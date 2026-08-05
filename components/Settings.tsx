import { useState, useEffect } from 'preact/hooks';

export interface NotionSettings {
  apiKey: string;
  databaseId: string;
}

export function loadSettings(): Promise<NotionSettings> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['notionApiKey', 'notionDatabaseId'], (res) => {
        resolve({
          apiKey: res.notionApiKey || '',
          databaseId: res.notionDatabaseId || '',
        });
      });
    } else {
      resolve({
        apiKey: localStorage.getItem('stickle_notion_api_key') || '',
        databaseId: localStorage.getItem('stickle_notion_db_id') || '',
      });
    }
  });
}

export function saveSettings(settings: NotionSettings): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set(
        {
          notionApiKey: settings.apiKey,
          notionDatabaseId: settings.databaseId,
        },
        () => resolve()
      );
    } else {
      localStorage.setItem('stickle_notion_api_key', settings.apiKey);
      localStorage.setItem('stickle_notion_db_id', settings.databaseId);
      resolve();
    }
  });
}

export function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSettings().then((s) => {
      setApiKey(s.apiKey);
      setDatabaseId(s.databaseId);
    });
  }, []);

  const handleSaveAndTest = async () => {
    if (!apiKey.trim() || !databaseId.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter both an Integration Token and Database ID.',
      });
      return;
    }

    await saveSettings({ apiKey: apiKey.trim(), databaseId: databaseId.trim() });
    setStatus({
      type: 'success',
      message: 'Settings saved! Notion connection configuration ready.',
    });
  };

  return (
    <div style={settingsStyles.container}>
      <h2 style={settingsStyles.title}>Notion Sync Settings</h2>
      <p style={settingsStyles.subtitle}>
        Connect your Notion workspace to export stickle notes with one click.
      </p>

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
          placeholder="32-character database ID"
          value={databaseId}
          onInput={(e) => setDatabaseId((e.target as HTMLInputElement).value)}
        />
      </div>

      <button className="btn-pill btn-secondary" onClick={handleSaveAndTest} style={{ marginTop: '6px', width: '100%' }}>
        Save & Test Connection
      </button>

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
