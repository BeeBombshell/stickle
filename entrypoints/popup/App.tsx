import { useState, useEffect } from 'preact/hooks';
import type { StickleNote, Workspace } from '../../lib/types';
import { getAllNotes } from '../../lib/db';
import { NoteSidebar } from '../../components/NoteSidebar';
import { Settings, loadSettings, saveSettings } from '../../components/Settings';
import { exportNotesToJson, importNotesFromJson } from '../../lib/export-import';
import { getActiveWorkspaceId, setActiveWorkspaceId, getUserWorkspaces } from '../../lib/workspace';
import posthog from '../../lib/posthog';

export type PopupTab = 'active-tab' | 'all-notes' | 'settings';

export function App() {
  const [activeTab, setActiveTab] = useState<PopupTab>('active-tab');
  const [notes, setNotes] = useState<StickleNote[]>([]);
  const [activeUrlNotes, setActiveUrlNotes] = useState<StickleNote[]>([]);
  const [currentTabUrl, setCurrentTabUrl] = useState<string>('');
  const [currentTabDomain, setCurrentTabDomain] = useState<string>('');
  const [pingStatus, setPingStatus] = useState<string>('Connecting...');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceIdState, setActiveWorkspaceIdState] = useState<string | null>(null);

  const reloadNotes = async () => {
    try {
      const all = await getAllNotes();
      setNotes(all);

      const wsId = await getActiveWorkspaceId();
      setActiveWorkspaceIdState(wsId);

      const userWs = await getUserWorkspaces();
      setWorkspaces(userWs);

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
    const nextId = wsId === 'personal' ? null : wsId;
    setActiveWorkspaceIdState(nextId);
    await setActiveWorkspaceId(nextId);
    setStatusMsg(nextId ? 'Switched to Workspace mode' : 'Switched to Personal mode');
    setTimeout(() => setStatusMsg(null), 2500);

    // Notify content script to re-anchor and refresh notes
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
    setStatusMsg(next ? 'Stickles enabled on webpages' : 'Stickles disabled on webpages');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  useEffect(() => {
    // Check background worker ping
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'PING' }, (res) => {
        if (res?.type === 'PONG') {
          setPingStatus('Active');
        } else {
          setPingStatus('Standby');
        }
      });
    } else {
      setPingStatus('Dev');
    }

    reloadNotes();

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const storageListener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
        if (areaName === 'local' && changes.stickle_notes) {
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
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'TRIGGER_CREATE_NOTE' });
        }
      });
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

  return (
    <div style={popupStyles.container}>
      {/* Header Bar — DESIGN.md Editorial Lockup */}
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
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <select
            value={activeWorkspaceIdState || 'personal'}
            onChange={(e) => handleWorkspaceChange((e.target as HTMLSelectElement).value)}
            style={{
              padding: '3px 8px',
              borderRadius: '50px',
              fontSize: '10px',
              fontWeight: '700',
              fontFamily: "'JetBrains Mono', monospace",
              backgroundColor: activeWorkspaceIdState ? '#e8d5ff' : '#f3f4f6',
              color: '#111111',
              border: '1px solid rgba(0,0,0,0.12)',
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '120px',
            }}
            title="Switch Workspace Mode"
          >
            <option value="personal">👤 Personal</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                👥 {ws.name}
              </option>
            ))}
          </select>
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

      {/* Signature Active Page Color Block (DESIGN.md Block Lime Panel) */}
      {currentTabDomain && (
        <div style={popupStyles.activePageCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ minWidth: 0, paddingRight: '8px' }}>
              <div style={popupStyles.activePageEyebrow}>
                ACTIVE WEBPAGE
              </div>
              <div style={popupStyles.activePageDomain} title={currentTabUrl}>
                {currentTabDomain}
              </div>
            </div>
            <span style={popupStyles.noteBadgePill}>
              {activeUrlNotes.length} {activeUrlNotes.length === 1 ? 'Note' : 'Notes'}
            </span>
          </div>

          <button
            className="btn-pill btn-primary"
            style={{ width: '100%', padding: '7px 14px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
            onClick={handleCreateNoteOnActiveTab}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              + Add Note to {currentTabDomain}
            </span>
          </button>
        </div>
      )}

      {/* Segmented Pill Navigation Bar (DESIGN.md) */}
      <nav style={popupStyles.navBar}>
        <button
          style={activeTab === 'active-tab' ? popupStyles.navPillActive : popupStyles.navPill}
          onClick={() => setActiveTab('active-tab')}
        >
          This Page ({activeUrlNotes.length})
        </button>
        <button
          style={activeTab === 'all-notes' ? popupStyles.navPillActive : popupStyles.navPill}
          onClick={() => setActiveTab('all-notes')}
        >
          All Notes ({notes.length})
        </button>
        <button
          style={activeTab === 'settings' ? popupStyles.navPillActive : popupStyles.navPill}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </nav>

      {/* Main Tab Content Container */}
      <main style={popupStyles.mainContent}>
        {activeTab === 'active-tab' && (
          <div>
            {activeUrlNotes.length === 0 ? (
              <div style={popupStyles.emptyStateContainer}>
                {/* Anchor-pin SVG — matches the Stickle logo mark */}
                <svg width="28" height="28" viewBox="0 0 44 44" fill="none" style={{ marginBottom: '8px', opacity: 0.35 }}>
                  <rect width="44" height="44" rx="10" fill="#111111" />
                  <circle cx="31" cy="31" r="9" fill="#ffffff" />
                  <circle cx="31" cy="31" r="3.5" fill="#111111" />
                </svg>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '4px' }}>
                  No notes on this page yet
                </div>
                <p style={{ fontSize: '11px', color: 'var(--color-ink-muted)', margin: 0, lineHeight: '1.4' }}>
                  Click <strong>+ Add Note</strong> above or select text on the page to pin a Stickle.
                </p>
              </div>
            ) : (
              <NoteSidebar notes={activeUrlNotes} onNoteChange={reloadNotes} />
            )}
          </div>
        )}

        {activeTab === 'all-notes' && (
          <div>
            <NoteSidebar notes={notes} onNoteChange={reloadNotes} />

            {/* Quick Import/Export Bar at bottom of All Notes */}
            <div style={popupStyles.backupActionBar}>
              <button onClick={handleExportJson} style={popupStyles.backupBtn}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Export Backup
              </button>
              <label style={popupStyles.backupBtn}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

const popupStyles = {
  container: {
    width: '380px',
    maxHeight: '590px',
    minHeight: '440px',
    padding: '12px',
    boxSizing: 'border-box' as const,
    backgroundColor: 'var(--color-canvas, #ffffff)',
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflowX: 'hidden' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
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
    padding: '6px 10px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-block-lime, #e4f579)',
    color: '#111111',
    fontSize: '11px',
    fontWeight: '600' as const,
    border: '1px solid #d4ee42',
  },
  activePageCard: {
    backgroundColor: 'var(--color-block-lime, #e4f579)',
    borderRadius: '16px',
    padding: '12px 14px',
    marginBottom: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    border: '1px solid #d4ee42',
  },
  activePageEyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '9.5px',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
    color: '#2a3000',
    marginBottom: '2px',
    opacity: 0.8,
  },
  activePageDomain: {
    fontSize: '14px',
    fontWeight: '700' as const,
    color: '#111111',
    letterSpacing: '-0.3px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  },
  noteBadgePill: {
    fontSize: '10px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: '700' as const,
    padding: '3px 8px',
    borderRadius: '50px',
    backgroundColor: '#111111',
    color: '#ffffff',
    flexShrink: 0,
  },
  navBar: {
    display: 'flex',
    gap: '4px',
    padding: '3px',
    borderRadius: '50px',
    backgroundColor: 'var(--color-surface-soft, #f5f5f3)',
    marginBottom: '10px',
    border: '1px solid var(--color-hairline, rgba(0,0,0,0.06))',
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
    padding: '24px 16px',
    backgroundColor: 'var(--color-surface-soft, #f5f5f3)',
    borderRadius: '12px',
    border: '1px solid var(--color-hairline, #e5e5e0)',
    marginTop: '4px',
  },
  backupActionBar: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    paddingTop: '8px',
    borderTop: '1px solid var(--color-hairline-soft, #f0f0eb)',
  },
  backupBtn: {
    flex: 1,
    padding: '6px 10px',
    borderRadius: '50px',
    border: '1px solid var(--color-hairline, #e5e5e0)',
    backgroundColor: 'var(--color-canvas, #ffffff)',
    fontSize: '10.5px',
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
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
  },
};
