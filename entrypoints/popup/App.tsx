import { useState, useEffect } from 'preact/hooks';
import type { StickleNote, Workspace, UserProfile } from '../../lib/types';
import { getAllNotes } from '../../lib/db';
import { NoteSidebar } from '../../components/NoteSidebar';
import { loadSettings, saveSettings } from '../../components/Settings';
import { exportNotesToJson, importNotesFromJson } from '../../lib/export-import';
import { getActiveWorkspaceId, setActiveWorkspaceId, getUserWorkspaces } from '../../lib/workspace';
import { getProfile } from '../../lib/auth';
import { ENABLE_CLOUD_AUTH } from '../../lib/flags';
import posthog from '../../lib/posthog';
import { normalizeUrl } from '../../lib/anchoring';

export type PopupTab = 'active-tab' | 'all-notes';

export function App() {
  const [activeTab, setActiveTab] = useState<PopupTab>('active-tab');
  const [notes, setNotes] = useState<StickleNote[]>([]);
  const [activeUrlNotes, setActiveUrlNotes] = useState<StickleNote[]>([]);
  const [currentTabUrl, setCurrentTabUrl] = useState<string>('');
  const [currentTabDomain, setCurrentTabDomain] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceIdState, setActiveWorkspaceIdState] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const reloadNotes = async () => {
    try {
      const all = await getAllNotes();
      setNotes(all);

      const wsId = await getActiveWorkspaceId();
      setActiveWorkspaceIdState(wsId);

      const userWs = await getUserWorkspaces();
      setWorkspaces(userWs);

      const userProf = await getProfile();
      setProfile(userProf);

      const s = await loadSettings();
      if (s.enabled !== undefined) setEnabled(s.enabled);

      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0 && tabs[0].url) {
            const rawUrl = tabs[0].url;
            setCurrentTabUrl(rawUrl);
            try {
              const hostname = new URL(rawUrl).hostname.replace(/^www\./, '');
              setCurrentTabDomain(hostname);
            } catch {
              setCurrentTabDomain('Webpage');
            }
            const normalized = normalizeUrl(rawUrl);
            const matching = all.filter((n) => n.url === normalized || n.url === rawUrl);
            setActiveUrlNotes(matching);
          }
        });
      }
    } catch (err) {
      console.error('[Stickle Popup] Failed to load notes:', err);
    }
  };

  const handleWorkspaceChange = async (wsId: string) => {
    setActiveWorkspaceIdState(wsId);
    const nextId = (wsId === 'personal' || wsId === 'all') ? null : wsId;
    await setActiveWorkspaceId(nextId);
    setStatusMsg(wsId === 'all' ? 'Showing all Stickles' : wsId === 'personal' ? 'Switched to Personal mode' : 'Switched to Workspace mode');
    setTimeout(() => setStatusMsg(null), 2500);

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'TRIGGER_REANCHOR' });
        }
      });
    }
  };

  const handleToggleEnabled = async () => {
    const next = !enabled;
    setEnabled(next);
    const config = await loadSettings();
    await saveSettings({ ...config, enabled: next });
    setStatusMsg(next ? 'Stickles enabled' : 'Stickles disabled');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  useEffect(() => {
    reloadNotes();

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const storageListener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
        if (areaName === 'local' && (changes.stickle_notes || changes.stickle_user_session || changes.stickle_auth_updated_at)) {
          reloadNotes();
        }
      };
      chrome.storage.onChanged.addListener(storageListener);
      return () => {
        chrome.storage.onChanged.removeListener(storageListener);
      };
    }
  }, []);

  const handleCreateNoteOnActiveTab = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id && tabs[0]?.url) {
          const tabUrl = tabs[0].url;
          if (tabUrl.startsWith('chrome://') || tabUrl.startsWith('chrome-extension://') || tabUrl.startsWith('about:')) {
            setStatusMsg('ℹ Stickles pin to web pages (e.g. github.com), not system pages.');
            setTimeout(() => setStatusMsg(null), 3500);
            return;
          }
          chrome.tabs.sendMessage(tabs[0].id, { type: 'TRIGGER_CREATE_NOTE' }, (res) => {
            if (chrome.runtime.lastError || !res) {
              setStatusMsg('Reload tab or press Alt + Click on webpage to pin note');
            } else {
              setStatusMsg('✓ Stickle created on webpage!');
            }
            setTimeout(() => setStatusMsg(null), 3500);
          });
        }
      });
    }
  };

  const handleOpenOptions = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    } else if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('/options.html', '_blank');
    }
  };

  const handleOpenDashboard = () => {
    const dashboardUrl = (import.meta.env.WXT_PUBLIC_DASHBOARD_URL as string | undefined) || 'https://app.stickle.app/notes';
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: dashboardUrl });
    } else {
      window.open(dashboardUrl, '_blank');
    }
  };

  const handleExportJson = () => {
    if (notes.length === 0) {
      setStatusMsg('No notes to export.');
      return;
    }
    const { filename } = exportNotesToJson(notes);
    posthog.capture('notes_backup_exported', { note_count: notes.length });
    setStatusMsg(`Exported ${notes.length} notes to ${filename}`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleImportFileChange = async (e: Event) => {
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
        setStatusMsg(`Imported ${res.imported}, updated ${res.updated}.`);
        reloadNotes();
      } else {
        setStatusMsg(`Import failed: ${res.error}`);
      }
      setTimeout(() => setStatusMsg(null), 3500);
      input.value = '';
    };
    reader.readAsText(file);
  };

  const filterByWorkspace = (list: StickleNote[]) => {
    if (!activeWorkspaceIdState || activeWorkspaceIdState === 'all') return list;
    if (activeWorkspaceIdState === 'personal') return list.filter((n) => !n.workspaceId);
    return list.filter((n) => n.workspaceId === activeWorkspaceIdState);
  };

  const displayNotes = filterByWorkspace(notes);
  const displayActiveUrlNotes = filterByWorkspace(activeUrlNotes);

  return (
    <div style={popupStyles.container}>
      {/* Header Bar */}
      <header style={popupStyles.header}>
        <div style={popupStyles.logoLockup}>
          <svg width="22" height="22" viewBox="0 0 44 44" fill="none" style={{ flexShrink: 0 }}>
            <rect width="44" height="44" rx="10" fill="#111111" />
            <circle cx="31" cy="31" r="9" fill="#ffffff" />
            <circle cx="31" cy="31" r="3.5" fill="#111111" />
          </svg>
          <span style={popupStyles.wordmark}>stickle</span>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
          {profile && (
            <select
              value={activeWorkspaceIdState || 'all'}
              onChange={(e) => handleWorkspaceChange((e.target as HTMLSelectElement).value)}
              style={{
                padding: '3px 8px',
                borderRadius: '50px',
                fontSize: '10px',
                fontWeight: '700',
                fontFamily: "'JetBrains Mono', monospace",
                backgroundColor: activeWorkspaceIdState && activeWorkspaceIdState !== 'all' ? '#e8d5ff' : '#f3f4f6',
                color: '#111111',
                border: '1px solid rgba(0,0,0,0.12)',
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '110px',
              }}
              title="Workspace Mode"
            >
              <option value="all">All Workspaces</option>
              <option value="personal">Personal</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleToggleEnabled}
            title={enabled ? 'Stickles are active globally. Click to disable.' : 'Stickles are disabled globally. Click to enable.'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 9px',
              borderRadius: '50px',
              fontSize: '10px',
              fontWeight: '700',
              fontFamily: "'JetBrains Mono', monospace",
              backgroundColor: enabled ? '#e4f579' : '#f3f4f6',
              color: enabled ? '#111111' : '#6b7280',
              border: enabled ? '1px solid #d4ee42' : '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: enabled ? '#16a34a' : '#9ca3af' }} />
            {enabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </header>

      {statusMsg && (
        <div style={popupStyles.statusToast}>
          {statusMsg}
        </div>
      )}

      {/* Simplified Active Page Card */}
      {currentTabDomain && (
        <div style={popupStyles.activePageCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '6px', minWidth: 0 }}>
            <div style={{ ...popupStyles.activePageDomain, minWidth: 0, flex: 1 }} title={currentTabUrl}>
              {currentTabDomain}
            </div>
            <span style={popupStyles.noteBadgePill}>
              {displayActiveUrlNotes.length} {displayActiveUrlNotes.length === 1 ? 'Note' : 'Notes'}
            </span>
          </div>

          <button
            className="btn-pill btn-primary"
            style={{ width: '100%', padding: '6px 12px', fontSize: '11.5px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
            onClick={handleCreateNoteOnActiveTab}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              + Add Note to {currentTabDomain}
            </span>
          </button>

          <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center', marginTop: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.55.63 2.84 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
            </svg>
            Press <strong>Alt + Click</strong> (Option + Click on Mac) anywhere on page
          </div>
        </div>
      )}

      {/* 2-Tab Navigation Bar */}
      <nav style={popupStyles.navBar}>
        <button
          style={activeTab === 'active-tab' ? popupStyles.navPillActive : popupStyles.navPill}
          onClick={() => setActiveTab('active-tab')}
        >
          This Page ({displayActiveUrlNotes.length})
        </button>
        <button
          style={activeTab === 'all-notes' ? popupStyles.navPillActive : popupStyles.navPill}
          onClick={() => setActiveTab('all-notes')}
        >
          All Notes ({displayNotes.length})
        </button>
      </nav>

      {/* Main Tab Content Container */}
      <main style={popupStyles.mainContent}>
        {activeTab === 'active-tab' && (
          <div>
            {displayActiveUrlNotes.length === 0 ? (
              <div style={popupStyles.emptyStateContainer}>
                <svg width="24" height="24" viewBox="0 0 44 44" fill="none" style={{ marginBottom: '6px', opacity: 0.35 }}>
                  <rect width="44" height="44" rx="10" fill="#111111" />
                  <circle cx="31" cy="31" r="9" fill="#ffffff" />
                  <circle cx="31" cy="31" r="3.5" fill="#111111" />
                </svg>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '3px' }}>
                  No notes on this page yet
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--color-ink-muted)', lineHeight: '1.5', textAlign: 'left', marginTop: '8px', padding: '8px 10px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e5e0' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px', color: '#111111' }}>How to add Stickles:</div>
                  <div>1. <strong>+ Add Note</strong>: Click button above to pin at top of page</div>
                  <div>2. <strong>Alt + Click</strong>: Press Alt (Option on Mac) + Click anywhere</div>
                  <div>3. <strong>Highlight</strong>: Select text on page to drop a highlight note</div>
                </div>
              </div>
            ) : (
              <NoteSidebar notes={displayActiveUrlNotes} onNoteChange={reloadNotes} />
            )}
          </div>
        )}

        {activeTab === 'all-notes' && (
          <div>
            <NoteSidebar notes={displayNotes} onNoteChange={reloadNotes} />

            {/* Quick Export/Import Bar at bottom of All Notes */}
            <div style={popupStyles.backupActionBar}>
              <button onClick={handleExportJson} style={popupStyles.backupBtn}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Export Backup
              </button>
              <label style={popupStyles.backupBtn}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Import Backup
                <input type="file" accept=".json" onChange={handleImportFileChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}
      </main>

      {/* Task 3: Popup Footer */}
      <footer style={popupStyles.footer}>
        <div style={popupStyles.syncStatusText}>
          {ENABLE_CLOUD_AUTH && profile ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
              Synced ({profile.email.split('@')[0]})
            </span>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--color-ink-muted, #6b7280)', fontFamily: 'var(--font-mono, monospace)', fontWeight: '600' }}>v1.0</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleOpenOptions}
            title="Open Extension Options & Settings"
            style={popupStyles.footerIconButton}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {ENABLE_CLOUD_AUTH && profile && (
            <button
              onClick={handleOpenDashboard}
              title="Open Web Dashboard"
              style={popupStyles.footerIconButton}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}



const popupStyles = {
  container: {
    width: '380px',
    height: '520px',
    padding: '12px',
    boxSizing: 'border-box' as const,
    backgroundColor: 'var(--color-canvas, #ffffff)',
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
    flexShrink: 0,
  },
  logoLockup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  wordmark: {
    fontSize: '18px',
    fontWeight: '700' as const,
    letterSpacing: '-0.6px',
    color: 'var(--color-ink, #111111)',
  },
  statusToast: {
    marginBottom: '8px',
    padding: '5px 10px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-block-lime, #e4f579)',
    color: '#111111',
    fontSize: '11px',
    fontWeight: '600' as const,
    border: '1px solid #d4ee42',
    flexShrink: 0,
  },
  activePageCard: {
    backgroundColor: '#fafafa',
    borderRadius: '12px',
    padding: '8px 10px',
    marginBottom: '8px',
    border: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  activePageDomain: {
    fontSize: '13px',
    fontWeight: '700' as const,
    color: '#111111',
    letterSpacing: '-0.2px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    paddingRight: '6px',
  },
  noteBadgePill: {
    fontSize: '9.5px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: '700' as const,
    padding: '2px 7px',
    borderRadius: '50px',
    backgroundColor: '#e4f579',
    color: '#111111',
    border: '1px solid #d4ee42',
    flexShrink: 0,
  },
  navBar: {
    display: 'flex',
    gap: '4px',
    padding: '3px',
    borderRadius: '50px',
    backgroundColor: 'var(--color-surface-soft, #f5f5f3)',
    marginBottom: '8px',
    border: '1px solid var(--color-hairline, rgba(0,0,0,0.06))',
    flexShrink: 0,
  },
  navPill: {
    flex: 1,
    padding: '5px 8px',
    borderRadius: '50px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '11px',
    fontWeight: '500' as const,
    color: 'var(--color-ink-muted, #52514e)',
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'all 0.15s ease',
  },
  navPillActive: {
    flex: 1,
    padding: '5px 8px',
    borderRadius: '50px',
    border: 'none',
    backgroundColor: '#111111',
    fontSize: '11px',
    fontWeight: '600' as const,
    color: '#ffffff',
    cursor: 'pointer',
    textAlign: 'center' as const,
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
  },
  emptyStateContainer: {
    textAlign: 'center' as const,
    padding: '20px 14px',
    backgroundColor: 'var(--color-surface-soft, #f5f5f3)',
    borderRadius: '12px',
    border: '1px solid var(--color-hairline, #e5e5e0)',
    marginTop: '4px',
  },
  backupActionBar: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
    paddingTop: '8px',
    borderTop: '1px solid var(--color-hairline-soft, #f0f0eb)',
  },
  backupBtn: {
    flex: 1,
    padding: '5px 8px',
    borderRadius: '50px',
    border: '1px solid var(--color-hairline, #e5e5e0)',
    backgroundColor: 'var(--color-canvas, #ffffff)',
    fontSize: '10px',
    fontWeight: '600' as const,
    color: 'var(--color-ink, #111111)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  mainContent: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
    paddingRight: '2px',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '8px',
    marginTop: '8px',
    borderTop: '1px solid var(--color-hairline, #e5e5e0)',
    flexShrink: 0,
  },
  syncStatusText: {
    fontSize: '10px',
    fontFamily: "'JetBrains Mono', monospace",
    color: '#6b7280',
    fontWeight: '600' as const,
  },
  footerIconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    border: '1px solid var(--color-hairline, #e5e5e0)',
    backgroundColor: '#ffffff',
    color: '#111111',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};
