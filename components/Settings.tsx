import { useState, useEffect } from 'preact/hooks';
import { testNotionConnection } from '../lib/notion';
import type { NoteColorBlock } from '../lib/types';
import { COLOR_SWATCHES } from './NoteBubble';
import { getAllNotes } from '../lib/db';
import { exportNotesToJson, importNotesFromJson } from '../lib/export-import';

export interface NotionSettings {
  apiKey: string;
  databaseId: string;
  defaultNoteColor?: NoteColorBlock;
}

export function loadSettings(): Promise<NotionSettings> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['notionApiKey', 'notionDatabaseId', 'defaultNoteColor'], (res) => {
        resolve({
          apiKey: res.notionApiKey || '',
          databaseId: res.notionDatabaseId || '',
          defaultNoteColor: (res.defaultNoteColor as NoteColorBlock) || 'lime',
        });
      });
    } else {
      resolve({
        apiKey: localStorage.getItem('stickle_notion_api_key') || '',
        databaseId: localStorage.getItem('stickle_notion_db_id') || '',
        defaultNoteColor: (localStorage.getItem('stickle_default_note_color') as NoteColorBlock) || 'lime',
      });
    }
  });
}

export function saveSettings(settings: NotionSettings): Promise<void> {
  return new Promise((resolve) => {
    const color = settings.defaultNoteColor || 'lime';
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set(
        {
          notionApiKey: settings.apiKey,
          notionDatabaseId: settings.databaseId,
          defaultNoteColor: color,
        },
        () => resolve()
      );
    } else {
      localStorage.setItem('stickle_notion_api_key', settings.apiKey);
      localStorage.setItem('stickle_notion_db_id', settings.databaseId);
      localStorage.setItem('stickle_default_note_color', color);
      resolve();
    }
  });
}

export function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [defaultNoteColor, setDefaultNoteColor] = useState<NoteColorBlock>('lime');
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isNotionOpen, setIsNotionOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setApiKey(s.apiKey);
      setDatabaseId(s.databaseId);
      if (s.defaultNoteColor) setDefaultNoteColor(s.defaultNoteColor);
    });
  }, []);

  const handleSaveAndTest = async () => {
    setIsTesting(true);
    setStatus(null);

    const config: NotionSettings = {
      apiKey: apiKey.trim(),
      databaseId: databaseId.trim(),
      defaultNoteColor,
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
    });
    setStatus({
      type: 'success',
      message: `Default note theme updated to ${COLOR_SWATCHES[key].name}.`,
    });
  };

  return (
    <div style={settingsStyles.container}>
      <h2 style={settingsStyles.title}>Preferences & Settings</h2>
      <p style={settingsStyles.subtitle}>
        Customize your default note appearance and Notion integration.
      </p>

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

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={handleExportAllJson}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid #d4ee42',
                backgroundColor: 'var(--color-block-lime)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                color: '#2a3000',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Export Notes (.json)
            </button>

            <label
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid #d4ee42',
                backgroundColor: 'var(--color-block-lime)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                color: '#2a3000',
                textAlign: 'center',
                boxSizing: 'border-box',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Import Notes (.json)
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-pill btn-secondary"
            style={{ flex: 1, fontSize: '11px', padding: '6px 12px' }}
            onClick={() => {
              if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.create({ url: chrome.runtime.getURL('landing.html') });
              } else {
                window.open('/landing.html', '_blank');
              }
            }}
          >
            🌐 Landing Page
          </button>
          <button
            className="btn-pill btn-secondary"
            style={{ flex: 1, fontSize: '11px', padding: '6px 12px' }}
            onClick={() => {
              if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
              } else {
                window.open('/onboarding.html', '_blank');
              }
            }}
          >
            ⚡ Sandbox Tutorial
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

