import { useState } from 'preact/hooks';

export default function PrivacyApp() {
  const openLanding = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('landing.html') });
    } else {
      window.open('/landing.html', '_blank');
    }
  };

  return (
    <div style={s.page}>
      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={{ ...s.logoLockup, cursor: 'pointer' }} onClick={openLanding}>
            <div style={s.logoMark}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="14" cy="14" r="5" fill="white" opacity="0.9" />
                <circle cx="14" cy="14" r="2" fill="#111" />
              </svg>
            </div>
            <span style={s.wordmark}>stickle</span>
            <span style={s.badge}>PRIVACY</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button style={s.btnSecondary} onClick={openLanding}>Product Page</button>
            <a href="https://github.com/BeeBombshell/stickle" target="_blank" rel="noreferrer" style={s.navLink}>
              GitHub ↗
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={s.hero}>
        <span style={s.eyebrow}>LEGAL • PRIVACY POLICY</span>
        <h1 style={s.displayXL}>Privacy Policy</h1>
        <p style={s.bodyLg}>
          Stickle is designed local-first. We do not collect, track, buy, or sell your personal data or browsing activity.
          Last updated: August 6, 2026.
        </p>
      </section>

      {/* ── CORE PRIVACY TENETS ─────────────────────────────────────────── */}
      <section style={s.section}>
        <div style={s.container}>
          <div style={s.threeGrid}>
            <div style={s.card}>
              <span style={s.cardEyebrow}>01 • LOCAL FIRST</span>
              <h3 style={s.cardTitle}>Data Stored on Device</h3>
              <p style={s.bodyText}>
                All sticky notes, anchor positions, text selection highlights, tags, and preferences are stored exclusively on your device using Chrome's extension storage (`chrome.storage.local`) and IndexedDB.
              </p>
            </div>
            <div style={s.card}>
              <span style={s.cardEyebrow}>02 • ZERO TELEMETRY</span>
              <h3 style={s.cardTitle}>No Analytics or Tracking</h3>
              <p style={s.bodyText}>
                Stickle contains zero tracking scripts, telemetry, or analytics software. We do not inspect your browsing history, web activity, or note contents.
              </p>
            </div>
            <div style={s.card}>
              <span style={s.cardEyebrow}>03 • DIRECT INTEGRATION</span>
              <h3 style={s.cardTitle}>Notion API Direct Sync</h3>
              <p style={s.bodyText}>
                When you export notes to Notion, requests travel directly from your browser to Notion's official API (`api.notion.com`). Credentials and notes never pass through any Stickle server.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── NOTION INTEGRATION & SECURITY (mint color block) ────────────── */}
      <section style={s.section}>
        <div style={s.container}>
          <div style={{ ...s.colorBlock, backgroundColor: '#d1f7c4' }}>
            <span style={{ ...s.eyebrow, color: '#065f46' }}>CREDENTIAL SAFETY & NOTION API</span>
            <h2 style={{ ...s.displayLg, color: '#052e16', maxWidth: 640 }}>
              How Notion integration tokens are handled.
            </h2>
            <p style={{ ...s.bodyText, color: '#14532d', maxWidth: 640, marginBottom: 24 }}>
              If you choose to sync research to Notion, your integration token is saved strictly inside extension-isolated storage (`chrome.storage.local`).
            </p>
            <ul style={{ ...s.bodyText, color: '#14532d', paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
              <li><strong>No unencrypted web storage:</strong> Integration tokens are never stored in unencrypted web page `localStorage`.</li>
              <li><strong>Background worker proxying:</strong> Requests to `https://api.notion.com/*` are dispatched strictly by the extension's background service worker to satisfy Manifest V3 security rules.</li>
              <li><strong>Full user control:</strong> You can disconnect or revoke your integration token at any time in Settings or via your Notion Integrations dashboard.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── PERMISSIONS POLICY (navy color block) ───────────────────────── */}
      <section style={s.section}>
        <div style={s.container}>
          <div style={{ ...s.colorBlock, backgroundColor: '#1e2038', color: '#ffffff' }}>
            <span style={{ ...s.eyebrow, color: '#94a3b8' }}>CHROME EXTENSION PERMISSIONS POLICY</span>
            <h2 style={{ ...s.displayLg, color: '#ffffff', maxWidth: 680 }}>
              Why permissions are requested.
            </h2>
            <p style={{ ...s.bodyText, color: '#cbd5e1', maxWidth: 640, marginBottom: 32 }}>
              Stickle requests the absolute minimum set of browser permissions needed to deliver sticky note anchoring and Notion export.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {[
                { name: 'storage', rationale: 'Used to save your notes, anchor coordinates, tags, and settings locally on your computer.' },
                { name: 'activeTab', rationale: 'Used to render sticky note overlays on the active web page when triggered by your Alt+Click action.' },
                { name: 'scripting', rationale: 'Used to inject element anchor positioning and selection highlight handlers into the current active page.' },
                { name: 'contextMenus', rationale: 'Used to provide a right-click context menu entry ("📌 Add Stickle Note Here") for fast note creation.' },
                { name: 'https://api.notion.com/*', rationale: 'Used exclusively to transmit user-initiated note exports to Notion\'s official API.' },
              ].map(p => (
                <div key={p.name} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <code style={{ fontFamily: 'monospace', fontSize: 14, color: '#38bdf8', display: 'block', marginBottom: 8 }}>{p.name}</code>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{p.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STORE COMPLIANCE & SINGLE PURPOSE ────────────────────────────── */}
      <section style={s.section}>
        <div style={s.container}>
          <div style={{ ...s.colorBlock, backgroundColor: '#fff7db' }}>
            <span style={s.eyebrow}>SINGLE PURPOSE DECLARATION & CODE INTEGRITY</span>
            <h2 style={{ ...s.displayLg, maxWidth: 640 }}>
              Chrome Web Store single purpose compliance.
            </h2>
            <p style={s.bodyText}>
              <strong>Single Purpose Description:</strong> Stickle is dedicated to a single utility: allowing users to attach persistent floating sticky notes and text selection highlights to webpage elements and export them to Notion.
            </p>
            <p style={s.bodyText}>
              <strong>No Remote Code Execution (RCE):</strong> Stickle contains zero remote code execution logic. All execution bundles are 100% packaged inside the compiled extension build. Stickle does not use `eval()`, dynamic script tag insertion from external CDNs, or dynamic remote module loading.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={s.footer}>
        <div style={s.container}>
          <p style={{ fontSize: 13, color: '#52514e', margin: 0 }}>
            © 2026 Stickle Open Source Project. Built for local-first web research.
          </p>
        </div>
      </footer>
    </div>
  );
}

const s = {
  page: { fontFamily: 'Inter, -apple-system, sans-serif', backgroundColor: '#ffffff', color: '#111111', minHeight: '100vh' },
  nav: { borderBottom: '1px solid #e5e5e0', padding: '16px 24px', position: 'sticky' as const, top: 0, backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', zIndex: 100 },
  navInner: { maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoLockup: { display: 'flex', alignItems: 'center', gap: 8 },
  logoMark: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: '#111111' },
  badge: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, backgroundColor: '#e8d5ff', padding: '2px 8px', borderRadius: 50 },
  navLink: { fontSize: 14, fontWeight: 500, color: '#52514e', textDecoration: 'none' },
  btnSecondary: { backgroundColor: '#ffffff', color: '#111', border: '1px solid #e5e5e0', borderRadius: 50, padding: '8px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  hero: { maxWidth: 1280, margin: '0 auto', padding: '64px 24px 48px' },
  displayXL: { fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 340, lineHeight: 1.1, letterSpacing: '-1.2px', margin: '16px 0 20px', color: '#111' },
  displayLg: { fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 340, lineHeight: 1.15, letterSpacing: '-0.8px', margin: '12px 0 20px' },
  bodyLg: { fontSize: 20, fontWeight: 330, lineHeight: 1.4, color: '#52514e', maxWidth: 680 },
  bodyText: { fontSize: 16, fontWeight: 330, lineHeight: 1.6, color: '#52514e' },
  eyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase' as const, color: '#52514e', display: 'block', marginBottom: 8 },
  section: { padding: '0 0 64px' },
  container: { maxWidth: 1280, margin: '0 auto', padding: '0 24px' },
  threeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 },
  card: { backgroundColor: '#ffffff', border: '1px solid #e5e5e0', borderRadius: 24, padding: 32 },
  cardEyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#b0b0a8', display: 'block', marginBottom: 12 },
  cardTitle: { fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: '#111' },
  colorBlock: { borderRadius: 24, padding: 48 },
  footer: { borderTop: '1px solid #e5e5e0', padding: '32px 24px', textAlign: 'center' as const },
};
