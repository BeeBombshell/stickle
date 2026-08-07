import { useState, useEffect } from 'preact/hooks';
import type { StickleNote } from '../../lib/types';
import { getAllNotes } from '../../lib/db';
import { NoteSidebar } from '../../components/NoteSidebar';
import { Settings, loadSettings, saveSettings } from '../../components/Settings';
import { exportNotesToJson, importNotesFromJson } from '../../lib/export-import';
import posthog from '../../lib/posthog';

export type PopupTab = 'all-notes' | 'active-tab' | 'settings';

export function App() {
  const [activeTab, setActiveTab] = useState<PopupTab>('all-notes');
  const [notes, setNotes] = useState<StickleNote[]>([]);
  const [activeUrlNotes, setActiveUrlNotes] = useState<StickleNote[]>([]);
  const [currentTabUrl, setCurrentTabUrl] = useState<string>('');
  const [pingStatus, setPingStatus] = useState<string>('Connecting...');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean>(true);

  const reloadNotes = async () => {
    try {
      const all = await getAllNotes();
      setNotes(all);

      const s = await loadSettings();
      if (s.enabled !== undefined) setEnabled(s.enabled);

      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0 && tabs[0].url) {
            const rawUrl = tabs[0].url;
            setCurrentTabUrl(rawUrl);
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

  const handleToggleEnabled = async () => {
    const next = !enabled;
    setEnabled(next);
    const config = await loadSettings();
    await saveSettings({ ...config, enabled: next });
    setStatusMsg(next ? 'Stickles enabled on webpages' : 'Stickles disabled on webpages');
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
          // Send message to active content script to trigger note creation prompt
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
        setStatusMsg(
          `Imported ${res.imported}, updated ${res.updated} (${res.skipped} skipped).`
        );
        reloadNotes();
      } else {
        setStatusMsg(`Import failed: ${res.error}`);
      }
      input.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div style={popupStyles.container}>
      {/* Header Bar */}
      <header style={popupStyles.header}>
        <div style={popupStyles.logoLockup}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: '#111111',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="13" cy="13" r="5" fill="white" opacity="0.95" />
              <circle cx="13" cy="13" r="2" fill="#111111" />
            </svg>
          </div>
          <span style={popupStyles.wordmark}>stickle</span>
          {/* Simple Green Dot Status Indicator */}
          <span style={popupStyles.statusDot} title={`Background Worker: ${pingStatus}`} />
        </div>

        {/* Header Promo Action Buttons */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <button
            onClick={handleToggleEnabled}
            title={enabled ? 'Stickles are ON. Click to disable.' : 'Stickles are OFF. Click to enable.'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '700',
              backgroundColor: enabled ? '#dcfce7' : '#fee2e2',
              color: enabled ? '#15803d' : '#b91c1c',
              border: enabled ? '1px solid #bbf7d0' : '1px solid #fca5a5',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: enabled ? '#16a34a' : '#ef4444' }} />
            {enabled ? 'ON' : 'OFF'}
          </button>
          <label style={popupStyles.headerPromoBtn} title="Import notes from JSON format">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: '3px' }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportFileChange}
              style={{ display: 'none' }}
            />
          </label>
          <button style={popupStyles.headerPromoBtn} onClick={handleExportJson} title="Export notes to JSON format">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: '3px' }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Export
          </button>
        </div>
      </header>

      {statusMsg && (
        <div style={popupStyles.statusToast}>
          {statusMsg}
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <nav style={popupStyles.navBar}>
        <button
          style={activeTab === 'all-notes' ? popupStyles.navPillActive : popupStyles.navPill}
          onClick={() => setActiveTab('all-notes')}
        >
          All Notes ({notes.length})
        </button>
        <button
          style={activeTab === 'active-tab' ? popupStyles.navPillActive : popupStyles.navPill}
          onClick={() => setActiveTab('active-tab')}
        >
          Active Tab ({activeUrlNotes.length})
        </button>
        <button
          style={activeTab === 'settings' ? popupStyles.navPillActive : popupStyles.navPill}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </nav>

      {/* Quick Action Button for Active Tab */}
      {currentTabUrl && (
        <div style={{ marginBottom: '12px' }}>
          <button
            className="btn-pill btn-primary"
            style={{ width: '100%', fontSize: '13px' }}
            onClick={handleCreateNoteOnActiveTab}
          >
            + Add Note to Active Tab
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      <main style={popupStyles.mainContent}>
        {activeTab === 'all-notes' && (
          <NoteSidebar notes={notes} onNoteChange={reloadNotes} />
        )}

        {activeTab === 'active-tab' && (
          <NoteSidebar notes={activeUrlNotes} onNoteChange={reloadNotes} />
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
    width: '360px',
    maxHeight: '580px',
    minHeight: '420px',
    padding: '16px',
    boxSizing: 'border-box' as const,
    backgroundColor: 'var(--color-canvas)',
    fontFamily: 'var(--font-sans)',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  logoLockup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  wordmark: {
    fontSize: '20px',
    fontWeight: '600' as const,
    letterSpacing: '-0.8px',
    color: 'var(--color-ink)',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    display: 'inline-block',
  },
  headerPromoBtn: {
    padding: '3px 9px',
    borderRadius: 'var(--radius-pill)',
    backgroundColor: 'var(--color-block-lime)',
    border: '1px solid #d4ee42',
    fontSize: '10px',
    fontWeight: '600' as const,
    color: '#2a3000',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  statusToast: {
    marginBottom: '8px',
    padding: '4px 8px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface-soft)',
    fontSize: '10px',
    color: 'var(--color-ink)',
    fontFamily: 'var(--font-mono)',
  },
  navBar: {
    display: 'flex',
    gap: '6px',
    padding: '4px',
    borderRadius: 'var(--radius-pill)',
    backgroundColor: 'var(--color-surface-soft)',
    marginBottom: '12px',
  },
  navPill: {
    flex: 1,
    padding: '6px 8px',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '11px',
    fontWeight: '500' as const,
    color: 'var(--color-ink-muted)',
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  navPillActive: {
    flex: 1,
    padding: '6px 8px',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    backgroundColor: 'var(--color-canvas)',
    fontSize: '11px',
    fontWeight: '600' as const,
    color: 'var(--color-ink)',
    boxShadow: 'var(--shadow-hairline)',
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  mainContent: {
    flex: 1,
    overflowY: 'auto' as const,
  },
};
