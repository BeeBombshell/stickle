import { useState } from 'preact/hooks';

export function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [status, setStatus] = useState('');

  const handleTestConnection = () => {
    if (!apiKey || !databaseId) {
      setStatus('Please enter both Integration Token and Database ID.');
      return;
    }
    setStatus('Connection test passed! (Phase 4 placeholder)');
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

      <button className="btn-pill btn-secondary" onClick={handleTestConnection} style={{ marginTop: '10px' }}>
        Test Connection
      </button>

      {status && <p style={settingsStyles.status}>{status}</p>}
    </div>
  );
}

const settingsStyles = {
  container: {
    padding: '16px',
    backgroundColor: 'var(--color-canvas)',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600' as const,
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
    marginBottom: '16px',
  },
  formGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500' as const,
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-hairline)',
    fontSize: '13px',
    boxSizing: 'border-box' as const,
  },
  status: {
    marginTop: '12px',
    fontSize: '12px',
    color: 'var(--color-ink)',
  },
};
