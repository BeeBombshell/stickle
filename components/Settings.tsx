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
          defaultNoteColor: (res.defaultNoteColor as NoteColorBlock) || 'cream',
        });
      });
    } else {
      resolve({
        apiKey: localStorage.getItem('stickle_notion_api_key') || '',
        databaseId: localStorage.getItem('stickle_notion_db_id') || '',
        defaultNoteColor: (localStorage.getItem('stickle_default_note_color') as NoteColorBlock) || 'cream',
      });
    }
  });
}

export function saveSettings(settings: NotionSettings): Promise<void> {
  return new Promise((resolve) => {
    const color = settings.defaultNoteColor || 'cream';
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
  const [defaultNoteColor, setDefaultNoteColor] = useState<NoteColorBlock>('cream');
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
              onClick={() => setDefaultNoteColor(key)}
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

      <h3 style={{ ...settingsStyles.title, fontSize: '15px' }}>Notion Integration</h3>

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

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-hairline)', margin: '16px 0' }} />

      <h3 style={{ ...settingsStyles.title, fontSize: '15px' }}>Data Backup & Portability</h3>
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
            border: '1px solid #f472b6',
            backgroundColor: 'var(--color-block-pink)',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            color: '#831843',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          📤 Export Notes (.json)
        </button>

        <label
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid #f472b6',
            backgroundColor: 'var(--color-block-pink)',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            color: '#831843',
            textAlign: 'center',
            boxSizing: 'border-box',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          📥 Import Notes (.json)
          <input
            type="file"
            accept=".json"
            onChange={handleImportJsonFile}
            style={{ display: 'none' }}
          />
        </label>
      </div>

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

