import { useState, useEffect } from 'preact/hooks';
import type { StickleNote } from '../../lib/types';
import { getAllNotes } from '../../lib/db';
import { NoteSidebar } from '../../components/NoteSidebar';
import { Settings } from '../../components/Settings';

export type PopupTab = 'all-notes' | 'active-tab' | 'settings';

export function App() {
  const [activeTab, setActiveTab] = useState<PopupTab>('all-notes');
  const [notes, setNotes] = useState<StickleNote[]>([]);
  const [activeUrlNotes, setActiveUrlNotes] = useState<StickleNote[]>([]);
  const [currentTabUrl, setCurrentTabUrl] = useState<string>('');
  const [pingStatus, setPingStatus] = useState<string>('Connecting...');

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
          setPingStatus('Active Worker Connected');
        } else {
          setPingStatus('Extension Mode');
        }
      });
    } else {
      setPingStatus('Dev Standalone');
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
        </div>

        <div style={popupStyles.statusBadge}>
          <span style={popupStyles.statusDot} />
          <span>{pingStatus}</span>
        </div>
      </header>

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
    gap: '8px',
  },
  wordmark: {
    fontSize: '20px',
    fontWeight: '600' as const,
    letterSpacing: '-0.8px',
    color: 'var(--color-ink)',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 8px',
    borderRadius: 'var(--radius-pill)',
    backgroundColor: 'var(--color-surface-soft)',
    fontSize: '10px',
    color: 'var(--color-ink-muted)',
    fontFamily: 'var(--font-mono)',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
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
