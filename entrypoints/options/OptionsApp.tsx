import { useState, useEffect } from 'preact/hooks';
import { loadSettings, saveSettings, type NotionSettings } from '../../components/Settings';
import { testNotionConnection } from '../../lib/notion';
import { COLOR_SWATCHES } from '../../components/NoteBubble';
import { getAllNotes } from '../../lib/db';
import { exportNotesToJson, importNotesFromJson } from '../../lib/export-import';
import { getProfile, signInWithOAuth, signOut } from '../../lib/auth';
import { isEnabled, FEATURE_NAMES, type FeatureFlag } from '../../lib/flags';
import { fullSync } from '../../lib/sync';
import type { NoteColorBlock, NoteBorderStyle, UserProfile } from '../../lib/types';
import posthog from '../../lib/posthog';

type NavTab = 'account' | 'notion' | 'defaults' | 'mcp' | 'about';

export function OptionsApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('account');

  // Auth & Cloud Sync
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<'google' | 'github' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Settings
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [defaultNoteColor, setDefaultNoteColor] = useState<NoteColorBlock>('lime');
  const [defaultBorderStyle, setDefaultBorderStyle] = useState<NoteBorderStyle>('solid');
  const [enabled, setEnabled] = useState<boolean>(true);

  // Testing & Toast status
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [totalNotesCount, setTotalNotesCount] = useState<number>(0);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const refreshNotesCount = async () => {
    try {
      const notes = await getAllNotes();
      setTotalNotesCount(notes.length);
    } catch {
      setTotalNotesCount(0);
    }
  };

  const refreshProfile = async () => {
    try {
      const p = await getProfile();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    loadSettings().then((s) => {
      setApiKey(s.apiKey);
      setDatabaseId(s.databaseId);
      if (s.defaultNoteColor) setDefaultNoteColor(s.defaultNoteColor);
      if (s.defaultBorderStyle) setDefaultBorderStyle(s.defaultBorderStyle);
      if (s.enabled !== undefined) setEnabled(s.enabled);
    });
    refreshNotesCount();
    refreshProfile();
  }, []);

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsSigningIn(provider);
    setStatus(null);
    const res = await signInWithOAuth(provider);
    setIsSigningIn(null);
    if (!res.success) {
      setStatus({
        type: 'error',
        message: `Sign-in failed: ${res.error || 'Unknown error'}`,
      });
    } else {
      await refreshProfile();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setProfile(null);
    setStatus({ type: 'success', message: 'Signed out successfully.' });
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fullSync();
      setStatus({
        type: 'success',
        message: `Cloud sync complete: ${res.pushed} pushed, ${res.pulled} pulled${res.conflicts > 0 ? `, ${res.conflicts} conflicts resolved` : ''}.`,
      });
      refreshNotesCount();
    } catch (err: any) {
      setStatus({ type: 'error', message: `Sync failed: ${err?.message || 'Network error'}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveNotion = async (e: Event) => {
    e.preventDefault();
    setIsTesting(true);
    setStatus(null);

    const config: NotionSettings = {
      apiKey: apiKey.trim(),
      databaseId: databaseId.trim(),
      defaultNoteColor,
      defaultBorderStyle,
      enabled,
    };
    await saveSettings(config);

    if (apiKey.trim() && databaseId.trim()) {
      const testRes = await testNotionConnection({ apiKey: apiKey.trim(), databaseId: databaseId.trim() });
      setIsTesting(false);
      if (testRes.success) {
        setStatus({
          type: 'success',
          message: '✓ Notion connection verified and settings saved successfully!',
        });
      } else {
        setStatus({
          type: 'error',
          message: `Settings saved, but Notion test failed: ${testRes.error}`,
        });
      }
    } else {
      setIsTesting(false);
      setStatus({
        type: 'success',
        message: 'Settings saved successfully.',
      });
    }
  };

  const handleColorSelect = async (key: NoteColorBlock) => {
    setDefaultNoteColor(key);
    await saveSettings({
      apiKey: apiKey.trim(),
      databaseId: databaseId.trim(),
      defaultNoteColor: key,
      defaultBorderStyle,
      enabled,
    });
  };

  const handleBorderStyleSelect = async (bStyle: NoteBorderStyle) => {
    setDefaultBorderStyle(bStyle);
    await saveSettings({
      apiKey: apiKey.trim(),
      databaseId: databaseId.trim(),
      defaultNoteColor,
      defaultBorderStyle: bStyle,
      enabled,
    });
  };

  const handleExportJson = async () => {
    const notes = await getAllNotes();
    if (notes.length === 0) {
      setStatus({ type: 'error', message: 'No notes available to export.' });
      return;
    }
    const { filename } = exportNotesToJson(notes);
    posthog.capture('notes_backup_exported', { note_count: notes.length });
    setStatus({ type: 'success', message: `Exported ${notes.length} notes to ${filename}` });
  };

  const handleImportJsonFile = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const res = await importNotesFromJson(text);
      if (res.success) {
        posthog.capture('notes_backup_imported', {
          imported_count: res.imported,
          updated_count: res.updated,
          skipped_count: res.skipped,
        });
        setStatus({
          type: 'success',
          message: `Import complete: ${res.imported} imported, ${res.updated} updated (${res.skipped} skipped).`,
        });
        refreshNotesCount();
      } else {
        setStatus({ type: 'error', message: `Import failed: ${res.error}` });
      }
      input.value = '';
    };
    reader.readAsText(file);
  };

  const handleOpenDashboard = () => {
    const dashboardUrl = 'http://localhost:3000/dashboard';
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: dashboardUrl });
    } else {
      window.open(dashboardUrl, '_blank');
    }
  };

  const handleCopySnippet = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const handleOpenLanding = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    } else {
      window.open('https://stickle.beebombshell.com', '_blank');
    }
  };

  const userTier = profile?.tier || 'free';

  const mcpCursorJson = JSON.stringify(
    {
      mcpServers: {
        stickle: {
          command: 'npx',
          args: ['-y', 'tsx', '/path/to/stickle/mcp-server/index.ts'],
        },
      },
    },
    null,
    2
  );

  const mcpClaudeJson = JSON.stringify(
    {
      mcpServers: {
        stickle: {
          command: 'node',
          args: ['/path/to/stickle/mcp-server/dist/index.js'],
        },
      },
    },
    null,
    2
  );

  return (
    <div style={styles.pageWrap}>
      {/* Header Bar — DESIGN.md Editorial Lockup */}
      <header style={styles.topHeader}>
        <div style={styles.headerContainer}>
          <div style={styles.headerTopRow}>
            <div style={styles.logoRow}>
              <svg width="32" height="32" viewBox="0 0 44 44" fill="none">
                <rect width="44" height="44" rx="10" fill="#111111" />
                <circle cx="31" cy="31" r="9" fill="#ffffff" />
                <circle cx="31" cy="31" r="3.5" fill="#111111" />
              </svg>
              <span style={styles.logoText}>stickle</span>
              <span style={styles.badgePill}>v1.0 PREFERENCES</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={handleOpenDashboard}
                className="btn-pill btn-primary"
                style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600' }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  Open Dashboard
                </span>
              </button>
            </div>
          </div>

          <div style={styles.headerSub}>
            Extension preferences, Cloud authentication, Notion integration, and Model Context Protocol (MCP) configuration.
          </div>
        </div>
      </header>

      {/* Main Content Layout with Sidebar */}
      <div className="options-grid" style={styles.bodyContainer}>
        {/* Left Nav Sidebar */}
        <aside style={styles.sidebar}>
          <nav className="options-nav" style={styles.navStack}>
            <button
              onClick={() => setActiveTab('account')}
              style={activeTab === 'account' ? styles.navItemActive : styles.navItem}
            >
              <span style={styles.navIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" />
                </svg>
              </span>
              <span style={styles.navLabel}>Account &amp; Tier</span>
            </button>

            <button
              onClick={() => setActiveTab('notion')}
              style={activeTab === 'notion' ? styles.navItemActive : styles.navItem}
            >
              <span style={styles.navIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </span>
              <span style={styles.navLabel}>Notion Integration</span>
            </button>

            <button
              onClick={() => setActiveTab('defaults')}
              style={activeTab === 'defaults' ? styles.navItemActive : styles.navItem}
            >
              <span style={styles.navIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                  <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                  <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                  <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.72 1.7-1.65 0-.43-.17-.83-.44-1.14-.29-.33-.46-.77-.46-1.26 0-1.05.85-1.9 1.9-1.9H17c2.76 0 5-2.24 5-5 0-4.97-4.48-9-10-9z" />
                </svg>
              </span>
              <span style={styles.navLabel}>Note Defaults</span>
            </button>

            <button
              onClick={() => setActiveTab('mcp')}
              style={activeTab === 'mcp' ? styles.navItemActive : styles.navItem}
            >
              <span style={styles.navIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                  <line x1="8" y1="16" x2="8" y2="16.01" />
                  <line x1="16" y1="16" x2="16" y2="16.01" />
                </svg>
              </span>
              <span style={styles.navLabel}>Data &amp; MCP Setup</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              style={activeTab === 'about' ? styles.navItemActive : styles.navItem}
            >
              <span style={styles.navIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </span>
              <span style={styles.navLabel}>Product &amp; Links</span>
            </button>
          </nav>

          <div style={styles.sidebarFooter}>
            <div style={styles.eyebrow}>LOCAL STORAGE</div>
            <div style={styles.sidebarStatValue}>{totalNotesCount} Notes Saved</div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              Tier: <strong style={{ color: '#111' }}>{userTier.toUpperCase()}</strong>
            </div>
          </div>
        </aside>

        {/* Right Main Pane */}
        <main style={styles.mainContent}>
          {status && (
            <div
              style={{
                ...styles.statusBanner,
                backgroundColor: status.type === 'success' ? '#e4f579' : '#ffd6e8',
                borderColor: status.type === 'success' ? '#d4ee42' : '#f43f5e',
              }}
            >
              <span>{status.message}</span>
              <button onClick={() => setStatus(null)} style={styles.statusCloseBtn}>✕</button>
            </div>
          )}

          {/* TAB 1: Account & Cloud Sync */}
          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <section style={{ ...styles.card, backgroundColor: '#111111', color: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={styles.eyebrowInverse}>STICKLE CLOUD AUTHENTICATION</span>
                    <h2 style={{ ...styles.cardTitle, color: '#ffffff', marginTop: '4px' }}>
                      {profile ? `Welcome back, ${profile.email.split('@')[0]}!` : 'Sign in to Stickle Cloud'}
                    </h2>
                    <p style={{ ...styles.cardDesc, color: '#9ca3af', marginBottom: 0 }}>
                      {profile
                        ? 'Your notes and workspaces are configured to sync across devices.'
                        : 'Sign in with Google or GitHub to enable real-time cloud sync and team workspaces.'}
                    </p>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      padding: '4px 12px',
                      borderRadius: '50px',
                      backgroundColor: userTier === 'supporter' ? '#e4f579' : userTier === 'team_member' ? '#e8d5ff' : '#374151',
                      color: userTier === 'free' ? '#d1d5db' : '#111111',
                    }}
                  >
                    {userTier === 'supporter' ? 'PRO SUPPORTER' : userTier === 'team_member' ? 'TEAMS' : 'FREE TIER'}
                  </span>
                </div>

                <div style={{ marginTop: '20px' }}>
                  {profile ? (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        onClick={handleTriggerSync}
                        disabled={isSyncing}
                        className="btn-pill btn-primary"
                        style={{ backgroundColor: '#e4f579', color: '#111111', padding: '10px 20px', fontSize: '13px', fontWeight: '700' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                          </svg>
                          {isSyncing ? 'Syncing...' : 'Sync Cloud Notes Now'}
                        </span>
                      </button>

                      <button
                        onClick={handleOpenDashboard}
                        className="btn-pill btn-secondary"
                        style={{ padding: '10px 20px', fontSize: '13px' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                          Open Web Dashboard
                        </span>
                      </button>

                      <button
                        onClick={handleSignOut}
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid #4b5563',
                          color: '#e5e7eb',
                          borderRadius: '50px',
                          padding: '9px 18px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleOAuthSignIn('google')}
                        disabled={isSigningIn !== null}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 20px',
                          borderRadius: '50px',
                          border: 'none',
                          backgroundColor: '#ffffff',
                          color: '#111111',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        {isSigningIn === 'google' ? 'Connecting...' : 'Continue with Google'}
                      </button>

                      <button
                        onClick={() => handleOAuthSignIn('github')}
                        disabled={isSigningIn !== null}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 20px',
                          borderRadius: '50px',
                          border: 'none',
                          backgroundColor: '#24292e',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                        </svg>
                        {isSigningIn === 'github' ? 'Connecting...' : 'Continue with GitHub'}
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Feature Availability & Plan Tier Matrix */}
              <section style={styles.card}>
                <span style={styles.eyebrow}>ENTITLEMENT DOCUMENTATION</span>
                <h2 style={styles.cardTitle}>Feature Availability &amp; Plan Matrix</h2>
                <p style={styles.cardDesc}>
                  Summary of extension, cloud, and MCP capabilities accessible based on your current account tier.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(Object.keys(FEATURE_NAMES) as FeatureFlag[]).map((flag) => {
                    const active = isEnabled(flag, userTier);
                    const info = FEATURE_NAMES[flag];

                    return (
                      <div
                        key={flag}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#111111' }}>
                            {info.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {info.description}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '10px',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            padding: '4px 10px',
                            borderRadius: '50px',
                            backgroundColor: active ? '#e4f579' : '#f3f4f6',
                            color: active ? '#111111' : '#6b7280',
                            border: active ? '1px solid #d4ee42' : '1px solid #e5e7eb',
                            flexShrink: 0,
                            marginLeft: '16px',
                          }}
                        >
                          {active ? '✓ ACTIVE' : `Requires ${info.minTier}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: Notion Integration */}
          {activeTab === 'notion' && (
            <section style={styles.card}>
              <span style={styles.eyebrow}>EXTERNAL SYNC</span>
              <h2 style={styles.cardTitle}>Notion Integration</h2>
              <p style={styles.cardDesc}>
                Sync stickle notes directly to a Notion database in real time. Works 100% locally with zero account requirements.
              </p>

              <form onSubmit={handleSaveNotion}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Internal Integration Token</label>
                  <input
                    type="password"
                    style={styles.input}
                    placeholder="secret_..."
                    value={apiKey}
                    onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
                  />
                  <span style={styles.helpText}>
                    Obtain a secret token from <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" style={{ color: '#111', fontWeight: '600' }}>notion.so/my-integrations</a>.
                  </span>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notion Database ID</label>
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="32-character database ID"
                    value={databaseId}
                    onInput={(e) => setDatabaseId((e.target as HTMLInputElement).value)}
                  />
                  <span style={styles.helpText}>
                    Copy the 32-character ID from your database URL and share the page with your Notion integration.
                  </span>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button
                    type="submit"
                    className="btn-pill btn-primary"
                    disabled={isTesting}
                    style={{ padding: '10px 24px', fontSize: '13px', fontWeight: '600' }}
                  >
                    {isTesting ? 'Testing Connection...' : 'Save & Test Notion Connection'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* TAB 3: Note Defaults */}
          {activeTab === 'defaults' && (
            <section style={styles.card}>
              <span style={styles.eyebrow}>APPEARANCE PREFERENCES</span>
              <h2 style={styles.cardTitle}>Note Creation Defaults</h2>
              <p style={styles.cardDesc}>
                Choose default swatches and border styles for new sticky notes created across webpages.
              </p>

              <div style={{ marginBottom: '28px' }}>
                <label style={styles.label}>Default Swatch Color</label>
                <div style={styles.swatchRow}>
                  {(Object.keys(COLOR_SWATCHES) as NoteColorBlock[]).map((key) => {
                    const isSelected = defaultNoteColor === key;
                    const sw = COLOR_SWATCHES[key];
                    return (
                      <button
                        key={key}
                        onClick={() => handleColorSelect(key)}
                        title={sw.name}
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor: sw.bg,
                          border: isSelected ? '3px solid #111111' : '1px solid rgba(0,0,0,0.15)',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxSizing: 'border-box',
                          transition: 'transform 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: sw.border,
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={styles.label}>Default Border Style</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'solid', label: 'Solid Border' },
                    { id: 'dashed', label: 'Dashed Border' },
                    { id: 'none', label: 'No Border' },
                  ].map((bOpt) => {
                    const isSelected = defaultBorderStyle === bOpt.id;
                    return (
                      <button
                        key={bOpt.id}
                        onClick={() => handleBorderStyleSelect(bOpt.id as NoteBorderStyle)}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '50px',
                          fontSize: '12px',
                          fontWeight: isSelected ? '700' : '500',
                          backgroundColor: isSelected ? '#111111' : '#f3f4f6',
                          color: isSelected ? '#ffffff' : '#374151',
                          border: isSelected ? '1px solid #111111' : '1px solid #e5e7eb',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {bOpt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Card */}
              <div style={{ marginTop: '20px', padding: '16px', borderRadius: '16px', backgroundColor: COLOR_SWATCHES[defaultNoteColor].bg, border: defaultBorderStyle === 'none' ? 'none' : `2px ${defaultBorderStyle} ${COLOR_SWATCHES[defaultNoteColor].border}`, color: '#111111' }}>
                <div style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', uppercase: 'true' as any }}>
                  PREVIEW STICKLE NOTE
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px' }}>
                  Default note theme &amp; border preview
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                  This is how your notes will look when dropped onto web pages.
                </div>
              </div>
            </section>
          )}

          {/* TAB 4: Data & MCP Setup */}
          {activeTab === 'mcp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Data Backup Card */}
              <section style={styles.card}>
                <span style={styles.eyebrow}>DATA PORTABILITY</span>
                <h2 style={styles.cardTitle}>Data Backup &amp; Import/Export</h2>
                <p style={styles.cardDesc}>
                  Export your notes as portable JSON files or restore notes from a backup. Your data remains 100% under your control.
                </p>

                <div className="options-backup-grid" style={styles.backupCardRow}>
                  <div style={styles.backupBox}>
                    <div style={styles.backupBoxTitle}>Export Backup</div>
                    <p style={styles.backupBoxDesc}>
                      Download all your local stickle notes, coordinates, anchors, and metadata into a single JSON file.
                    </p>
                    <button
                      onClick={handleExportJson}
                      className="btn-pill btn-primary"
                      style={{ padding: '9px 18px', fontSize: '12px', width: '100%' }}
                    >
                      Export {totalNotesCount} Notes (.json)
                    </button>
                  </div>

                  <div style={styles.backupBox}>
                    <div style={styles.backupBoxTitle}>Import Backup</div>
                    <p style={styles.backupBoxDesc}>
                      Restore or merge notes from a previously exported JSON backup file into your local database.
                    </p>
                    <label
                      className="btn-pill btn-secondary"
                      style={{ padding: '9px 18px', fontSize: '12px', width: '100%', cursor: 'pointer', display: 'inline-flex', justifyContent: 'center' }}
                    >
                      Select JSON File...
                      <input type="file" accept=".json" onChange={handleImportJsonFile} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              </section>

              {/* MCP Integration Setup & Documentation Card */}
              <section style={styles.card}>
                <span style={styles.eyebrow}>AI INTEGRATION ENGINE</span>
                <h2 style={styles.cardTitle}>Model Context Protocol (MCP) Setup</h2>
                <p style={styles.cardDesc}>
                  Connect AI coding assistants (Claude Desktop, Cursor, Windsurf) directly to your web notes via MCP.
                </p>

                {/* Local MCP Server Configuration */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>1. Local MCP Server Setup</h3>
                  <p style={{ fontSize: '12.5px', color: '#6b7280', lineHeight: '1.4', margin: '0 0 12px 0' }}>
                    Stickle provides an official MCP server located in <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>mcp-server/index.ts</code>.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Cursor config */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700' }}>Cursor Configuration (~/.cursor/mcp.json)</span>
                        <button
                          onClick={() => handleCopySnippet(mcpCursorJson, 'cursor')}
                          style={styles.copyBtn}
                        >
                          {copiedSnippet === 'cursor' ? '✓ Copied!' : 'Copy Config'}
                        </button>
                      </div>
                      <pre style={styles.codeBlock}>{mcpCursorJson}</pre>
                    </div>

                    {/* Claude Desktop config */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700' }}>Claude Desktop Configuration (claude_desktop_config.json)</span>
                        <button
                          onClick={() => handleCopySnippet(mcpClaudeJson, 'claude')}
                          style={styles.copyBtn}
                        >
                          {copiedSnippet === 'claude' ? '✓ Copied!' : 'Copy Config'}
                        </button>
                      </div>
                      <pre style={styles.codeBlock}>{mcpClaudeJson}</pre>
                    </div>
                  </div>
                </div>

                {/* MCP Tools List */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Available MCP Tools</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={styles.mcpToolCard}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', fontSize: '11px' }}>get_stickle_notes</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Fetch all web notes anchored across sites.</div>
                    </div>
                    <div style={styles.mcpToolCard}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', fontSize: '11px' }}>create_stickle_note</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Create a new note pinned to any URL.</div>
                    </div>
                    <div style={styles.mcpToolCard}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', fontSize: '11px' }}>search_stickle_notes</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Search note contents, titles, or #tags.</div>
                    </div>
                    <div style={styles.mcpToolCard}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', fontSize: '11px' }}>get_notes_for_url</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Get notes anchored to a specific webpage.</div>
                    </div>
                  </div>
                </div>

                {/* Remote MCP Endpoint Info */}
                <div style={{ marginTop: '20px', padding: '12px 14px', borderRadius: '12px', backgroundColor: '#e8d5ff', border: '1px solid #c084fc', color: '#111111' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Remote MCP Endpoint (HTTPS / SSE)
                  </div>
                  <div style={{ fontSize: '11.5px', marginTop: '4px', lineHeight: '1.4' }}>
                    Remote MCP access allows cloud AI agents to connect over secure HTTPS. Requires a <strong>Pro Supporter</strong> or <strong>Teams</strong> subscription. Manage remote MCP tokens on the Web Dashboard!
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 5: Product & Resources */}
          {activeTab === 'about' && (
            <section style={styles.card}>
              <span style={styles.eyebrow}>DOCUMENTATION &amp; LINKS</span>
              <h2 style={styles.cardTitle}>Product &amp; Resources</h2>
              <p style={styles.cardDesc}>
                Explore documentation, interactive onboarding, privacy commitments, and dashboard tools.
              </p>

              <div style={styles.resourceGrid}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleOpenDashboard();
                  }}
                  style={{ ...styles.resourceCard, backgroundColor: '#111111', color: '#ffffff' }}
                >
                  <div style={styles.resourceIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ ...styles.resourceTitle, color: '#ffffff' }}>Web Dashboard</div>
                    <div style={{ ...styles.resourceDesc, color: '#9ca3af' }}>Manage team workspaces, cross-device timeline, and billing status.</div>
                  </div>
                </a>

                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleOpenLanding();
                  }}
                  style={styles.resourceCard}
                >
                  <div style={styles.resourceIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <div>
                    <div style={styles.resourceTitle}>Landing Page</div>
                    <div style={styles.resourceDesc}>Overview of features, architecture, and extension capabilities (stickle.beebomsbhell.com).</div>
                  </div>
                </a>

                <a
                  href="/onboarding.html"
                  target="_blank"
                  rel="noreferrer"
                  style={styles.resourceCard}
                >
                  <div style={styles.resourceIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <div>
                    <div style={styles.resourceTitle}>Interactive Sandbox</div>
                    <div style={styles.resourceDesc}>Practice anchoring stickles and testing shortcuts in a live tutorial environment.</div>
                  </div>
                </a>

                <a
                  href="/privacy.html"
                  target="_blank"
                  rel="noreferrer"
                  style={styles.resourceCard}
                >
                  <div style={styles.resourceIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div>
                    <div style={styles.resourceTitle}>Privacy Policy</div>
                    <div style={styles.resourceDesc}>Learn about local-first storage, permissions, and zero tracking commitments.</div>
                  </div>
                </a>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  pageWrap: {
    minHeight: '100vh',
    backgroundColor: '#f8f8f6',
    color: '#111111',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  topHeader: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e5e0',
    padding: '24px 32px',
  },
  headerContainer: {
    maxWidth: '980px',
    margin: '0 auto',
  },
  headerTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.8px',
  },
  badgePill: {
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '50px',
    backgroundColor: '#e4f579',
    color: '#111111',
    border: '1px solid #d4ee42',
  },
  headerSub: {
    fontSize: '14px',
    color: '#52514e',
  },
  bodyContainer: {
    maxWidth: '980px',
    margin: '32px auto',
    padding: '0 16px',
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    gap: '32px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignSelf: 'start',
    position: 'sticky' as const,
    top: '32px',
  },
  navStack: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#52514e',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.15s ease',
  },
  navItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#111111',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left' as const,
    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
  },
  navIcon: {
    fontSize: '16px',
  },
  navLabel: {
    flex: 1,
  },
  sidebarFooter: {
    padding: '16px',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e5e0',
    marginTop: '20px',
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10.5px',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  eyebrowInverse: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10.5px',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
    color: '#9ca3af',
    marginBottom: '4px',
  },
  sidebarStatValue: {
    fontSize: '14px',
    fontWeight: '700',
    marginTop: '2px',
  },
  mainContent: {
    minWidth: 0,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '28px 32px',
    border: '1px solid #e5e5e0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 6px 0',
    letterSpacing: '-0.4px',
  },
  cardDesc: {
    fontSize: '13px',
    color: '#52514e',
    margin: '0 0 24px 0',
    lineHeight: '1.5',
  },
  formGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    boxSizing: 'border-box' as const,
    outline: 'none',
  },
  helpText: {
    display: 'block',
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '4px',
  },
  statusBanner: {
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '12.5px',
    fontWeight: '600',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: 0,
  },
  swatchRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  backupCardRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  backupBox: {
    backgroundColor: '#f9fafb',
    borderRadius: '14px',
    padding: '18px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  },
  backupBoxTitle: {
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  backupBoxDesc: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.4',
    margin: '0 0 16px 0',
  },
  resourceGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  resourceCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 18px',
    borderRadius: '14px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all 0.15s ease',
  },
  resourceIcon: {
    fontSize: '22px',
  },
  resourceTitle: {
    fontSize: '14px',
    fontWeight: '700',
  },
  resourceDesc: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  codeBlock: {
    backgroundColor: '#111111',
    color: '#e4f579',
    padding: '14px',
    borderRadius: '10px',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
    overflowX: 'auto' as const,
    margin: 0,
  },
  copyBtn: {
    padding: '3px 9px',
    borderRadius: '50px',
    backgroundColor: '#111111',
    color: '#ffffff',
    border: 'none',
    fontSize: '10px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  mcpToolCard: {
    backgroundColor: '#f9fafb',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
  },
};
