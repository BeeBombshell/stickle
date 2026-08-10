import { useState, useEffect } from 'preact/hooks';
import { testNotionConnection } from '../lib/notion';
import type { NoteColorBlock, NoteBorderStyle, UserProfile } from '../lib/types';
import { COLOR_SWATCHES } from './NoteBubble';
import { getAllNotes } from '../lib/db';
import { exportNotesToJson, importNotesFromJson } from '../lib/export-import';
import { getProfile, signInWithOAuth, signOut } from '../lib/auth';
import { isEnabled, FEATURE_NAMES, type FeatureFlag } from '../lib/flags';
import { fullSync } from '../lib/sync';
import { getActiveWorkspaceId, setActiveWorkspaceId, getUserWorkspaces, createWorkspace, inviteWorkspaceMember } from '../lib/workspace';
import type { Workspace } from '../lib/types';

export interface NotionSettings {
  apiKey: string;
  databaseId: string;
  defaultNoteColor?: NoteColorBlock;
  defaultBorderStyle?: NoteBorderStyle;
  enabled?: boolean;
}

const inMemoryStorage: Record<string, string> = {};

export function loadSettings(): Promise<NotionSettings> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(
        ['notionApiKey', 'notionDatabaseId', 'defaultNoteColor', 'defaultBorderStyle', 'sticklesEnabled'],
        (res) => {
          resolve({
            apiKey: res.notionApiKey || '',
            databaseId: res.notionDatabaseId || '',
            defaultNoteColor: (res.defaultNoteColor as NoteColorBlock) || 'lime',
            defaultBorderStyle: (res.defaultBorderStyle as NoteBorderStyle) || 'solid',
            enabled: res.sticklesEnabled !== undefined ? Boolean(res.sticklesEnabled) : true,
          });
        }
      );
    } else {
      let color: NoteColorBlock = 'lime';
      let borderStyle: NoteBorderStyle = 'solid';
      let enabled = true;
      try {
        if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
          color = (localStorage.getItem('defaultNoteColor') as NoteColorBlock) || 'lime';
          borderStyle = (localStorage.getItem('defaultBorderStyle') as NoteBorderStyle) || 'solid';
          const savedEnabled = localStorage.getItem('sticklesEnabled');
          if (savedEnabled !== null) enabled = savedEnabled === 'true';
        } else {
          color = (inMemoryStorage['defaultNoteColor'] as NoteColorBlock) || 'lime';
          borderStyle = (inMemoryStorage['defaultBorderStyle'] as NoteBorderStyle) || 'solid';
          if (inMemoryStorage['sticklesEnabled'] !== undefined) {
            enabled = inMemoryStorage['sticklesEnabled'] === 'true';
          }
        }
      } catch {
        color = (inMemoryStorage['defaultNoteColor'] as NoteColorBlock) || 'lime';
        borderStyle = (inMemoryStorage['defaultBorderStyle'] as NoteBorderStyle) || 'solid';
        if (inMemoryStorage['sticklesEnabled'] !== undefined) {
          enabled = inMemoryStorage['sticklesEnabled'] === 'true';
        }
      }
      resolve({
        apiKey: '',
        databaseId: '',
        defaultNoteColor: color,
        defaultBorderStyle: borderStyle,
        enabled,
      });
    }
  });
}

export function saveSettings(settings: NotionSettings): Promise<void> {
  return new Promise((resolve) => {
    const color = settings.defaultNoteColor || 'lime';
    const borderStyle = settings.defaultBorderStyle || 'solid';
    const enabled = settings.enabled !== undefined ? settings.enabled : true;

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set(
        {
          notionApiKey: settings.apiKey,
          notionDatabaseId: settings.databaseId,
          defaultNoteColor: color,
          defaultBorderStyle: borderStyle,
          sticklesEnabled: enabled,
        },
        () => resolve()
      );
    } else {
      try {
        if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
          localStorage.setItem('defaultNoteColor', color);
          localStorage.setItem('defaultBorderStyle', borderStyle);
          localStorage.setItem('sticklesEnabled', String(enabled));
        } else {
          inMemoryStorage['defaultNoteColor'] = color;
          inMemoryStorage['defaultBorderStyle'] = borderStyle;
          inMemoryStorage['sticklesEnabled'] = String(enabled);
        }
      } catch {
        inMemoryStorage['defaultNoteColor'] = color;
        inMemoryStorage['defaultBorderStyle'] = borderStyle;
        inMemoryStorage['sticklesEnabled'] = String(enabled);
      }
      resolve();
    }
  });
}

export function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [defaultNoteColor, setDefaultNoteColor] = useState<NoteColorBlock>('lime');
  const [defaultBorderStyle, setDefaultBorderStyle] = useState<NoteBorderStyle>('solid');
  const [enabled, setEnabled] = useState<boolean>(true);
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isNotionOpen, setIsNotionOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(true);

  // Auth & Cloud Sync State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<'google' | 'github' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Team Workspaces State
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceIdState, setActiveWorkspaceIdState] = useState<string | null>(null);
  const [newWsName, setNewWsName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isCreatingWs, setIsCreatingWs] = useState(false);

  const reloadWorkspaces = async () => {
    const wsId = await getActiveWorkspaceId();
    setActiveWorkspaceIdState(wsId);
    const list = await getUserWorkspaces();
    setWorkspaces(list);
  };

  useEffect(() => {
    loadSettings().then((s) => {
      setApiKey(s.apiKey);
      setDatabaseId(s.databaseId);
      if (s.defaultNoteColor) setDefaultNoteColor(s.defaultNoteColor);
      if (s.defaultBorderStyle) setDefaultBorderStyle(s.defaultBorderStyle);
      if (s.enabled !== undefined) setEnabled(s.enabled);
    });

    getProfile().then((p) => {
      setProfile(p);
    });

    reloadWorkspaces();
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
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setProfile(null);
    setStatus({ type: 'success', message: 'Signed out successfully.' });
  };

  const handleCreateWorkspace = async (e: Event) => {
    e.preventDefault();
    if (!profile) {
      setStatus({ type: 'error', message: '🔒 Auth Required: Please sign in above with Google or GitHub first.' });
      return;
    }
    if (!isEnabled('teamSharing', profile.tier)) {
      setStatus({
        type: 'error',
        message: `🔒 TEAMS Plan Required: Your current tier is "${profile.tier.toUpperCase()}". Team Workspaces require a TEAMS plan.`,
      });
      return;
    }
    if (!newWsName.trim()) return;

    setIsCreatingWs(true);
    const res = await createWorkspace(newWsName.trim());
    setIsCreatingWs(false);

    if (res.success && res.workspace) {
      setNewWsName('');
      await setActiveWorkspaceId(res.workspace.id);
      await reloadWorkspaces();
      setStatus({ type: 'success', message: `Workspace "${res.workspace.name}" created and set active!` });
    } else {
      setStatus({ type: 'error', message: `Failed to create workspace: ${res.error || 'Unknown error'}` });
    }
  };

  const handleInviteMember = async (e: Event) => {
    e.preventDefault();
    if (!profile) {
      setStatus({ type: 'error', message: '🔒 Auth Required: Please sign in above with Google or GitHub first.' });
      return;
    }
    if (!isEnabled('teamSharing', profile.tier)) {
      setStatus({
        type: 'error',
        message: `🔒 TEAMS Plan Required: Your current tier is "${profile.tier.toUpperCase()}". Team Workspaces require a TEAMS plan.`,
      });
      return;
    }
    if (!activeWorkspaceIdState || !inviteEmail.trim()) return;

    const res = await inviteWorkspaceMember(activeWorkspaceIdState, inviteEmail.trim());
    if (res.success) {
      setInviteEmail('');
      setStatus({ type: 'success', message: `Invited ${inviteEmail} to workspace.` });
    } else {
      setStatus({ type: 'error', message: `Invite failed: ${res.error}` });
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fullSync();
      setStatus({
        type: 'success',
        message: `Sync complete: ${res.pushed} pushed, ${res.pulled} pulled${res.conflicts > 0 ? `, ${res.conflicts} conflicts` : ''}.`,
      });
    } catch (err: any) {
      setStatus({ type: 'error', message: `Sync failed: ${err?.message || 'Network error'}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveAndTest = async () => {
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
          message: 'Settings saved & Notion connection verified successfully!',
        });
      } else {
        setStatus({
          type: 'error',
          message: `Settings saved, but Notion connection test failed: ${testRes.error}`,
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

  const handleExportAllJson = async () => {
    const notes = await getAllNotes();
    if (notes.length === 0) {
      setStatus({ type: 'error', message: 'No notes available in database to export.' });
      return;
    }
    const { filename } = exportNotesToJson(notes);
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
        setStatus({
          type: 'success',
          message: `Import complete: ${res.imported} imported, ${res.updated} updated (${res.skipped} skipped).`,
        });
      } else {
        setStatus({ type: 'error', message: `Import failed: ${res.error}` });
      }
      input.value = '';
    };
    reader.readAsText(file);
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
    setStatus({
      type: 'success',
      message: `Default note theme updated to ${COLOR_SWATCHES[key].name}.`,
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
    setStatus({
      type: 'success',
      message: `Default border style updated to ${bStyle}.`,
    });
  };

  const handleToggleEnabled = async (nextEnabled: boolean) => {
    setEnabled(nextEnabled);
    await saveSettings({
      apiKey: apiKey.trim(),
      databaseId: databaseId.trim(),
      defaultNoteColor,
      defaultBorderStyle,
      enabled: nextEnabled,
    });
    setStatus({
      type: 'success',
      message: nextEnabled ? 'Stickles enabled on webpages.' : 'Stickles disabled on webpages.',
    });
  };

  const userTier = profile?.tier || 'free';

  return (
    <div style={settingsStyles.container}>
      <h2 style={settingsStyles.title}>Preferences & Settings</h2>
      <p style={settingsStyles.subtitle}>
        Customize your default note appearance and extension behavior.
      </p>

      {status && (
        <div style={{
          padding: '10px 12px',
          borderRadius: '8px',
          marginBottom: '12px',
          backgroundColor: status.type === 'success' ? '#e4f579' : '#ffd6e8',
          color: '#111111',
          fontSize: '12px',
          fontWeight: '500',
          border: '1px solid rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          lineHeight: '1.4',
        }}>
          <span>{status.message}</span>
          <button
            onClick={() => setStatus(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#111111', padding: 0, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Cloud Account & Supabase Auth Section (DESIGN.md) */}
      <div
        onClick={() => setIsAccountOpen(!isAccountOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          padding: '8px 12px',
          backgroundColor: '#111111',
          color: '#ffffff',
          borderRadius: '12px',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{ fontSize: '13px' }}>☁️</span>
          <span style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '-0.1px', whiteSpace: 'nowrap' }}>
            Stickle Cloud
          </span>
          <span
            style={{
              fontSize: '9px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: '700',
              textTransform: 'uppercase',
              padding: '2px 7px',
              borderRadius: '50px',
              backgroundColor: userTier === 'supporter' ? '#e4f579' : userTier === 'team_member' ? '#e8d5ff' : '#374151',
              color: userTier === 'free' ? '#9ca3af' : '#111111',
              flexShrink: 0,
            }}
          >
            {userTier === 'supporter' ? 'PRO SUPPORTER' : userTier === 'team_member' ? 'TEAMS' : 'FREE TIER'}
          </span>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isAccountOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: '#9ca3af',
            flexShrink: 0,
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {isAccountOpen && (
        <div
          style={{
            backgroundColor: 'var(--color-surface-soft, rgba(0,0,0,0.03))',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid var(--color-hairline, rgba(0,0,0,0.08))',
            marginBottom: '16px',
            boxSizing: 'border-box',
          }}
        >
          {profile ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-ink-muted)', textTransform: 'uppercase' }}>
                    SIGNED IN AS
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile.email}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-hairline)',
                    color: 'var(--color-ink)',
                    borderRadius: '50px',
                    padding: '3px 10px',
                    fontSize: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Sign Out
                </button>
              </div>

              <button
                onClick={handleTriggerSync}
                disabled={isSyncing}
                style={{
                  width: '100%',
                  backgroundColor: '#111111',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50px', // Pill CTA (DESIGN.md)
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: isSyncing ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <span>🔄</span> {isSyncing ? 'Syncing with Cloud...' : 'Sync Cloud Notes Now'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* Google OAuth Button */}
                <button
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={isSigningIn !== null}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 14px',
                    borderRadius: '50px',
                    border: '1px solid var(--color-hairline, rgba(0,0,0,0.15))',
                    backgroundColor: '#ffffff',
                    cursor: isSigningIn !== null ? 'not-allowed' : 'pointer',
                    opacity: isSigningIn !== null && isSigningIn !== 'google' ? 0.5 : 1,
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#111111',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.15s ease',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Official Google G SVG */}
                  <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    {isSigningIn === 'google' ? 'Redirecting...' : 'Continue with Google'}
                  </span>
                </button>

                {/* GitHub OAuth Button */}
                <button
                  onClick={() => handleOAuthSignIn('github')}
                  disabled={isSigningIn !== null}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 14px',
                    borderRadius: '50px',
                    border: '1px solid var(--color-hairline, rgba(0,0,0,0.15))',
                    backgroundColor: '#ffffff',
                    cursor: isSigningIn !== null ? 'not-allowed' : 'pointer',
                    opacity: isSigningIn !== null && isSigningIn !== 'github' ? 0.5 : 1,
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#111111',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.15s ease',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Official GitHub Mark SVG */}
                  <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }} fill="#111111">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    {isSigningIn === 'github' ? 'Redirecting...' : 'Continue with GitHub'}
                  </span>
                </button>
              </div>
              <p style={{ fontSize: '10.5px', color: 'var(--color-ink-muted)', margin: '8px 0 0 0', lineHeight: '1.4', textAlign: 'center' }}>
                Sign in to enable cross-device cloud sync.
              </p>
            </div>
          )}

          {/* Redesigned Feature Access Matrix (DESIGN.md) */}
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-hairline, rgba(0,0,0,0.08))' }}>
            <div style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-ink-muted)', marginBottom: '8px' }}>
              Feature Availability &amp; Plan Tier
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(Object.keys(FEATURE_NAMES) as FeatureFlag[]).map((flag) => {
                const enabled = isEnabled(flag, userTier);
                const info = FEATURE_NAMES[flag];

                return (
                  <div
                    key={flag}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-canvas, #ffffff)',
                      border: '1px solid var(--color-hairline-soft, #f0f0eb)',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {info.name}
                      </div>
                      <div style={{ fontSize: '9.5px', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {info.description}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '50px',
                        backgroundColor: enabled ? '#e4f579' : '#f3f4f6',
                        color: enabled ? '#111111' : '#6b7280',
                        border: enabled ? '1px solid #d4ee42' : '1px solid #e5e7eb',
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}
                    >
                      {enabled ? '✓ ACTIVE' : info.minTier}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Team Workspaces Section */}
      <div
        onClick={() => setIsTeamOpen(!isTeamOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          padding: '8px 12px',
          backgroundColor: '#111111',
          color: '#ffffff',
          borderRadius: '12px',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{ fontSize: '13px' }}>👥</span>
          <span style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '-0.1px', whiteSpace: 'nowrap' }}>
            Team Workspaces
          </span>
          <span
            style={{
              fontSize: '9px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: '700',
              textTransform: 'uppercase',
              padding: '2px 7px',
              borderRadius: '50px',
              backgroundColor: '#e8d5ff',
              color: '#111111',
              flexShrink: 0,
            }}
          >
            {workspaces.length} {workspaces.length === 1 ? 'Workspace' : 'Workspaces'}
          </span>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isTeamOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: '#9ca3af',
            flexShrink: 0,
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {isTeamOpen && (
        <div
          style={{
            backgroundColor: 'var(--color-surface-soft, rgba(0,0,0,0.03))',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid var(--color-hairline, rgba(0,0,0,0.08))',
            marginBottom: '16px',
            boxSizing: 'border-box',
          }}
        >
          {!profile ? (
            <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#fff7db', border: '1px solid #fcd34d', color: '#92400e', fontSize: '11px', lineHeight: '1.4' }}>
              <strong>🔒 Authentication Required</strong><br />
              Please sign in above with Google or GitHub to create or join Team Workspaces.
            </div>
          ) : !isEnabled('teamSharing', userTier) ? (
            <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#e8d5ff', border: '1px solid #c084fc', color: '#111111', fontSize: '11px', lineHeight: '1.4' }}>
              <div style={{ fontWeight: '700', marginBottom: '2px' }}>🔒 TEAMS Plan Required</div>
              <div>Your current account tier is <strong>{userTier.toUpperCase()}</strong>. Shared Team Workspaces require a <strong>TEAMS ($9/user/mo)</strong> subscription.</div>
              <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px', fontStyle: 'italic' }}>
                💡 Dev/Testing Tip: Update your profile tier in Supabase (<code>UPDATE profiles SET tier = 'team_member' WHERE id = '{profile.id}';</code>) or upgrade via the Dashboard!
              </div>
            </div>
          ) : null}

          {/* Active Workspace Selector */}
          <div style={{ marginTop: '10px', marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-ink)', display: 'block', marginBottom: '4px' }}>
              Active Workspace Mode
            </label>
            <select
              value={activeWorkspaceIdState || 'personal'}
              onChange={async (e) => {
                const val = (e.target as HTMLSelectElement).value;
                const nextId = val === 'personal' ? null : val;
                setActiveWorkspaceIdState(nextId);
                await setActiveWorkspaceId(nextId);
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--color-hairline, rgba(0,0,0,0.15))',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: '#ffffff',
                color: '#111111',
                cursor: 'pointer',
              }}
            >
              <option value="personal">👤 Personal Mode (Only my notes)</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  👥 {ws.name} ({ws.role || 'member'})
                </option>
              ))}
            </select>
          </div>

          {/* Create Workspace Form */}
          <form onSubmit={handleCreateWorkspace} style={{ marginBottom: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-hairline, rgba(0,0,0,0.08))' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-ink)', display: 'block', marginBottom: '4px' }}>
              Create New Team Workspace
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="Workspace Name (e.g. Acme Corp)"
                value={newWsName}
                onInput={(e) => setNewWsName((e.target as HTMLInputElement).value)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '50px',
                  border: '1px solid var(--color-hairline, rgba(0,0,0,0.15))',
                  fontSize: '11px',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!profile || !isEnabled('teamSharing', userTier) || isCreatingWs || !newWsName.trim()}
                style={{
                  padding: '6px 12px',
                  borderRadius: '50px',
                  backgroundColor: '#111111',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: !profile || !isEnabled('teamSharing', userTier) || isCreatingWs || !newWsName.trim() ? 'not-allowed' : 'pointer',
                  opacity: !profile || !isEnabled('teamSharing', userTier) || isCreatingWs || !newWsName.trim() ? 0.5 : 1,
                }}
              >
                Create
              </button>
            </div>
          </form>

          {/* Invite Teammates Form (shown when workspace active) */}
          {activeWorkspaceIdState && (
            <form onSubmit={handleInviteMember} style={{ paddingTop: '10px', borderTop: '1px solid var(--color-hairline, rgba(0,0,0,0.08))' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-ink)', display: 'block', marginBottom: '4px' }}>
                Invite Teammate by Email
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onInput={(e) => setInviteEmail((e.target as HTMLInputElement).value)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '50px',
                    border: '1px solid var(--color-hairline, rgba(0,0,0,0.15))',
                    fontSize: '11px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={!inviteEmail.trim()}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '50px',
                    backgroundColor: '#e8d5ff',
                    color: '#111111',
                    border: '1px solid rgba(0,0,0,0.1)',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: !inviteEmail.trim() ? 'not-allowed' : 'pointer',
                    opacity: !inviteEmail.trim() ? 0.5 : 1,
                  }}
                >
                  Invite
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Extension Global Enable/Disable Toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 12px',
        backgroundColor: 'var(--color-surface-soft, rgba(0,0,0,0.03))',
        borderRadius: 'var(--radius-md, 8px)',
        marginBottom: '16px',
        border: '1px solid var(--color-hairline, rgba(0,0,0,0.08))',
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>
            Enable Stickles on Webpages
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
            Toggle in-page floating sticky notes on/off globally
          </div>
        </div>
        <button
          onClick={() => handleToggleEnabled(!enabled)}
          style={{
            position: 'relative',
            width: '40px',
            height: '22px',
            borderRadius: '12px',
            backgroundColor: enabled ? '#111111' : '#d1d5db',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '2px',
              left: enabled ? '20px' : '2px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </button>
      </div>

      <div style={settingsStyles.formGroup}>
        <label style={settingsStyles.label}>Default Note Theme</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
          {(Object.keys(COLOR_SWATCHES) as NoteColorBlock[]).map((key) => (
            <button
              key={key}
              onClick={() => handleColorSelect(key)}
              title={COLOR_SWATCHES[key].name}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: COLOR_SWATCHES[key].bg,
                border: defaultNoteColor === key ? '3px solid #111111' : '1px solid #d1d5db',
                cursor: 'pointer',
                padding: 0,
                boxSizing: 'border-box',
              }}
            />
          ))}
        </div>
      </div>

      <div style={settingsStyles.formGroup}>
        <label style={settingsStyles.label}>Default Border Style</label>
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'solid', label: 'Solid' },
            { id: 'dashed', label: 'Dashed' },
            { id: 'none', label: 'No Border' },
          ].map((bOpt) => {
            const isSelected = defaultBorderStyle === bOpt.id;
            return (
              <button
                key={bOpt.id}
                onClick={() => handleBorderStyleSelect(bOpt.id as NoteBorderStyle)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: isSelected ? '600' : '400',
                  backgroundColor: isSelected ? '#111111' : 'var(--color-surface-soft, rgba(0,0,0,0.05))',
                  color: isSelected ? '#ffffff' : 'var(--color-ink)',
                  border: isSelected ? '1px solid #111111' : '1px solid var(--color-hairline, rgba(0,0,0,0.08))',
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

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-hairline)', margin: '16px 0' }} />

      <div
        onClick={() => setIsNotionOpen(!isNotionOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          padding: '4px 0',
        }}
      >
        <h3 style={{ ...settingsStyles.title, fontSize: '15px', margin: 0 }}>Notion Integration</h3>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isNotionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'var(--color-ink-muted)',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {isNotionOpen && (
        <div style={{ marginTop: '12px' }}>
          <div style={settingsStyles.formGroup}>
            <label style={settingsStyles.label}>Internal Integration Token</label>
            <input
              type="password"
              style={settingsStyles.input}
              placeholder="secret_..."
              value={apiKey}
              onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
            />
          </div>

          <div style={settingsStyles.formGroup}>
            <label style={settingsStyles.label}>Notion Database ID</label>
            <input
              type="text"
              style={settingsStyles.input}
              placeholder="32-character database ID or database URL"
              value={databaseId}
              onInput={(e) => setDatabaseId((e.target as HTMLInputElement).value)}
            />
          </div>

          <button
            className="btn-pill btn-secondary"
            onClick={handleSaveAndTest}
            disabled={isTesting}
            style={{ marginTop: '6px', width: '100%', opacity: isTesting ? 0.7 : 1 }}
          >
            {isTesting ? 'Testing Connection...' : 'Save Settings'}
          </button>
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-hairline)', margin: '16px 0' }} />

      <div
        onClick={() => setIsBackupOpen(!isBackupOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          padding: '4px 0',
        }}
      >
        <h3 style={{ ...settingsStyles.title, fontSize: '15px', margin: 0 }}>Data Backup & Portability</h3>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isBackupOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'var(--color-ink-muted)',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {isBackupOpen && (
        <div style={{ marginTop: '12px' }}>
          <p style={settingsStyles.subtitle}>
            Export your notes to portable JSON files or restore notes from a previous backup.
          </p>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleExportAllJson}
              style={{
                flex: '1 1 calc(50% - 4px)',
                minWidth: 0,
                padding: '8px 10px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid #d4ee42',
                backgroundColor: 'var(--color-block-lime)',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                color: '#2a3000',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                boxSizing: 'border-box',
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Export (.json)</span>
            </button>

            <label
              style={{
                flex: '1 1 calc(50% - 4px)',
                minWidth: 0,
                padding: '8px 10px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid #d4ee42',
                backgroundColor: 'var(--color-block-lime)',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                color: '#2a3000',
                textAlign: 'center',
                boxSizing: 'border-box',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Import (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJsonFile}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      )}

      {status && (
        <div
          style={{
            ...settingsStyles.statusBanner,
            backgroundColor:
              status.type === 'success' ? 'var(--color-block-mint)' : 'var(--color-block-pink)',
            color: status.type === 'success' ? '#166534' : '#991b1b',
          }}
        >
          {status.message}
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-hairline)', margin: '16px 0' }} />

      <div>
        <h3 style={{ ...settingsStyles.title, fontSize: '15px', marginBottom: '8px' }}>Product &amp; Resources</h3>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
          <button
            className="btn-pill btn-secondary"
            style={{ flex: '1 1 70px', minWidth: 0, fontSize: '11px', padding: '6px 8px', boxSizing: 'border-box' }}
            onClick={() => {
              if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
              } else {
                window.open('/', '_blank');
              }
            }}
          >
            🌐 Landing
          </button>
          <button
            className="btn-pill btn-secondary"
            style={{ flex: '1 1 70px', minWidth: 0, fontSize: '11px', padding: '6px 8px', boxSizing: 'border-box' }}
            onClick={() => {
              if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
              } else {
                window.open('/onboarding.html', '_blank');
              }
            }}
          >
            ⚡ Sandbox
          </button>
          <button
            className="btn-pill btn-secondary"
            style={{ flex: '1 1 70px', minWidth: 0, fontSize: '11px', padding: '6px 8px', boxSizing: 'border-box' }}
            onClick={() => {
              if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
              } else {
                window.open('/privacy.html', '_blank');
              }
            }}
          >
            🔒 Privacy
          </button>
        </div>
      </div>
    </div>
  );
}

const settingsStyles = {
  container: {
    padding: '12px 0',
    backgroundColor: 'var(--color-canvas)',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
    overflowX: 'hidden' as const,
  },
  title: {
    fontSize: '18px',
    fontWeight: '600' as const,
    marginBottom: '4px',
    color: 'var(--color-ink)',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
    marginBottom: '16px',
    lineHeight: '1.4',
  },
  formGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500' as const,
    marginBottom: '4px',
    color: 'var(--color-ink)',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-hairline)',
    backgroundColor: 'var(--color-surface-soft)',
    fontSize: '13px',
    boxSizing: 'border-box' as const,
    outline: 'none',
  },
  statusBanner: {
    marginTop: '12px',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '12px',
    fontWeight: '500' as const,
    lineHeight: '1.4',
  },
};
