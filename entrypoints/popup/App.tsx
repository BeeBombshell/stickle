import { useState, useEffect } from 'preact/hooks';
import type { StickleNote } from '../../lib/types';
import { getAllNotes } from '../../lib/db';
import { NoteSidebar } from '../../components/NoteSidebar';
import { Settings } from '../../components/Settings';
import { exportNotesToJson, importNotesFromJson } from '../../lib/export-import';

export type PopupTab = 'all-notes' | 'active-tab' | 'settings';

export function App() {
  const [activeTab, setActiveTab] = useState<PopupTab>('all-notes');
  const [notes, setNotes] = useState<StickleNote[]>([]);
  const [activeUrlNotes, setActiveUrlNotes] = useState<StickleNote[]>([]);
  const [currentTabUrl, setCurrentTabUrl] = useState<string>('');
  const [pingStatus, setPingStatus] = useState<string>('Connecting...');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const reloadNotes = async () => {
    try {
      const all = await getAllNotes();
      setNotes(all);

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
          {/* Anchor Pin Mark SVG */}
          <svg width="22" height="22" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="44" height="44" rx="10" fill="#1A1A1A" />
            <circle cx="31" cy="31" r="9" fill="#FFFFFF" />
            <circle cx="31" cy="31" r="3.5" fill="#1A1A1A" />
          </svg>
          <span style={popupStyles.wordmark}>stickle</span>
          {/* Simple Green Dot Status Indicator */}
          <span style={popupStyles.statusDot} title={`Background Worker: ${pingStatus}`} />
        </div>

        {/* Header Promo Action Buttons */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <label style={popupStyles.headerPromoBtn}>
            📥 Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportFileChange}
              style={{ display: 'none' }}
            />
          </label>
          <button style={popupStyles.headerPromoBtn} onClick={handleExportJson} title="Export notes to JSON format">
            📤 Export
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
