import { useState, useEffect } from 'preact/hooks';
import type { StickleNote } from '../../lib/types';
import { getAllNotes } from '../../lib/db';

export function App() {
  const [notes, setNotes] = useState<StickleNote[]>([]);
  const [pingStatus, setPingStatus] = useState<string>('Connecting...');

  useEffect(() => {
    // Test PING / PONG with background worker
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'PING' }, (res) => {
        if (res?.type === 'PONG') {
          setPingStatus('Active — Connected to Background Worker');
        } else {
          setPingStatus('Standalone Mode');
        }
      });
    } else {
      setPingStatus('Standalone Dev Mode');
    }

    // Load saved notes count
    getAllNotes().then((loaded) => setNotes(loaded)).catch(() => {});
  }, []);

  return (
    <div style={popupStyles.container}>
      {/* Header Bar */}
      <header style={popupStyles.header}>
        <div style={popupStyles.logoLockup}>
          {/* Concept 3: Anchor Pin Mark SVG */}
          <svg width="24" height="24" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="44" height="44" rx="10" fill="#1A1A1A" />
            <circle cx="22" cy="22" r="9" fill="#FFFFFF" />
            <circle cx="22" cy="22" r="3.5" fill="#1A1A1A" />
          </svg>
          <span style={popupStyles.wordmark}>stickle</span>
        </div>
        <span className="eyebrow" style={{ fontSize: '10px' }}>v0.1.0</span>
      </header>

      {/* Main Color Block Hero (Block Lime Signature Surface) */}
      <div style={popupStyles.heroBlock}>
        <div className="eyebrow" style={popupStyles.heroEyebrow}>DOM ANCHORING ACTIVE</div>
        <h1 style={popupStyles.heroTitle}>Hello Stickle</h1>
        <p style={popupStyles.heroText}>
          Pin persistent notes directly to elements and dynamic web text across any webpage.
        </p>
      </div>

      {/* Status & Stats Section */}
      <div style={popupStyles.statsSection}>
        <div style={popupStyles.statCard}>
          <span style={popupStyles.statNumber}>{notes.length}</span>
          <span style={popupStyles.statLabel}>Saved Notes</span>
        </div>
        <div style={popupStyles.statCard}>
          <span style={popupStyles.statNumber}>3</span>
          <span style={popupStyles.statLabel}>Fallback Tiers</span>
        </div>
      </div>

      {/* Extension System Status Pill */}
      <div style={popupStyles.statusBanner}>
        <span style={popupStyles.statusDot} />
        <span style={{ fontSize: '12px', fontWeight: 500 }}>{pingStatus}</span>
      </div>

      {/* Actions Footer */}
      <div style={popupStyles.footerActions}>
        <button className="btn-pill btn-primary" style={{ width: '100%' }}>
          + Create Note on Active Tab
        </button>
        <button className="btn-pill btn-secondary" style={{ width: '100%' }}>
          Open Notes Manager
        </button>
      </div>
    </div>
  );
}

const popupStyles = {
  container: {
    width: '340px',
    padding: '16px',
    boxSizing: 'border-box' as const,
    backgroundColor: 'var(--color-canvas)',
    fontFamily: 'var(--font-sans)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
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
  heroBlock: {
    backgroundColor: 'var(--color-block-lime)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    marginBottom: '14px',
    boxSizing: 'border-box' as const,
  },
  heroEyebrow: {
    color: '#3d4400',
    marginBottom: '6px',
  },
  heroTitle: {
    fontSize: '24px',
    fontWeight: '600' as const,
    letterSpacing: '-0.5px',
    margin: '0 0 6px 0',
    color: 'var(--color-ink)',
  },
  heroText: {
    fontSize: '13px',
    lineHeight: '1.45',
    margin: 0,
    color: '#2b3000',
  },
  statsSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '14px',
  },
  statCard: {
    backgroundColor: 'var(--color-surface-soft)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: '22px',
    fontWeight: '700' as const,
    color: 'var(--color-ink)',
  },
  statLabel: {
    fontSize: '11px',
    color: 'var(--color-ink-muted)',
    marginTop: '2px',
  },
  statusBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface-soft)',
    marginBottom: '14px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
  },
  footerActions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
};
