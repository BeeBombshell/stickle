import { useState } from 'preact/hooks';

export default function PrivacyApp() {
  const openLanding = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    } else {
      window.open('/', '_blank');
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
        </p>
        <p style={s.caption}>LAST UPDATED: AUGUST 6, 2026</p>
      </section>

      {/* ── CORE PRIVACY TENETS (3-up White Cards) ─────────────────────────── */}
      <section style={s.section}>
        <div style={s.container}>
          <div style={s.threeGrid}>
            <div style={s.card}>
              <span style={s.cardLimeBadge}>01 • LOCAL FIRST</span>
              <h3 style={s.cardTitle}>Data Stored on Device</h3>
              <p style={s.bodyText}>
                All sticky notes, anchor positions, text selection highlights, tags, and preferences are stored exclusively on your device using Chrome's extension storage (<code style={s.codeTag}>chrome.storage.local</code>) and IndexedDB.
              </p>
            </div>
            <div style={s.card}>
              <span style={s.cardLimeBadge}>02 • ANONYMOUS METRICS</span>
              <h3 style={s.cardTitle}>Privacy-Preserving Telemetry</h3>
              <p style={s.bodyText}>
                Stickle collects anonymized aggregate usage metrics (such as note creation counts and export success rates) via PostHog to improve app performance. We never collect note contents, webpage titles, browsing history, or personal identifiers.
              </p>
            </div>
            <div style={s.card}>
              <span style={s.cardLimeBadge}>03 • DIRECT INTEGRATION</span>
              <h3 style={s.cardTitle}>Notion API Direct Sync</h3>
              <p style={s.bodyText}>
                When you export notes to Notion, requests travel directly from your browser to Notion's official API (<code style={s.codeTag}>api.notion.com</code>). Credentials and notes never pass through any Stickle server.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── NOTION INTEGRATION & SECURITY (Signature Lime Block: #e4f579) ───── */}
      <section style={s.section}>
        <div style={s.container}>
          <div style={{ ...s.colorBlock, backgroundColor: '#e4f579', color: '#111111' }}>
            <span style={{ ...s.eyebrow, color: '#111111' }}>CREDENTIAL SAFETY &amp; NOTION API</span>
            <h2 style={{ ...s.displayLg, color: '#111111', maxWidth: 640 }}>
              How Notion integration tokens are handled.
            </h2>
            <p style={{ ...s.bodyText, color: '#111111', maxWidth: 640, marginBottom: 24, fontSize: 18 }}>
              If you choose to sync research to Notion, your integration token is saved strictly inside extension-isolated storage (<code style={{ ...s.codeTag, backgroundColor: '#ffffff', color: '#111111', border: '1px solid rgba(0,0,0,0.1)' }}>chrome.storage.local</code>).
            </p>
            <ul style={{ ...s.bodyText, color: '#111111', paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
              <li><strong>No unencrypted web storage:</strong> Integration tokens are never stored in unencrypted web page <code style={{ ...s.codeTag, backgroundColor: '#ffffff', color: '#111111', border: '1px solid rgba(0,0,0,0.1)' }}>localStorage</code>.</li>
              <li><strong>Background worker proxying:</strong> Requests to <code style={{ ...s.codeTag, backgroundColor: '#ffffff', color: '#111111', border: '1px solid rgba(0,0,0,0.1)' }}>https://api.notion.com/*</code> are dispatched strictly by the extension's background service worker to satisfy Manifest V3 security rules.</li>
              <li><strong>Full user control:</strong> You can disconnect or revoke your integration token at any time in Settings or via your Notion Integrations dashboard.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── PERMISSIONS AUDIT (Monochrome Dark Block: #111111 with Lime Accents) ─ */}
      <section style={s.section}>
        <div style={s.container}>
          <div style={{ ...s.colorBlock, backgroundColor: '#111111', color: '#ffffff', padding: '56px 48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <span style={{ ...s.eyebrow, color: '#e4f579' }}>CHROME EXTENSION PERMISSIONS AUDIT</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, backgroundColor: 'rgba(228,245,121,0.15)', color: '#e4f579', padding: '4px 12px', borderRadius: 50, border: '1px solid rgba(228,245,121,0.3)' }}>
                MANIFEST V3 MINIMAL PRIVILEGE
              </span>
            </div>
            <h2 style={{ ...s.displayLg, color: '#ffffff', maxWidth: 720 }}>
              Why browser permissions are requested.
            </h2>
            <p style={{ ...s.bodyText, color: '#ffffff', maxWidth: 680, marginBottom: 36, fontSize: 18, fontWeight: 330 }}>
              Stickle adheres strictly to Google Chrome Web Store's Principle of Least Privilege. We request only the narrowest browser APIs required to anchor floating sticky notes to DOM elements and export research to Notion.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
              {[
                {
                  name: 'storage',
                  type: 'DATA PERSISTENCE',
                  rationale: 'Saves your sticky notes, DOM anchor selector chains, relative offsets, tags, and settings locally on your computer via extension IndexedDB and chrome.storage.local.',
                  safety: '100% offline local storage. Never synced to external servers unless initiated by you.',
                },
                {
                  name: 'activeTab',
                  type: 'ACTIVE PAGE OVERLAY',
                  rationale: 'Grants temporary access to the currently focused tab only when you interact with the extension (via Alt+Click or popup), allowing Stickle to compute DOM element coordinates.',
                  safety: 'Does NOT grant background access to inactive tabs, background windows, or unopened tabs.',
                },
                {
                  name: 'scripting',
                  type: 'DOM ANCHORING ENGINE',
                  rationale: 'Injects lightweight positioning listeners and text fragment calculators into the active page so sticky notes stay attached across re-renders and scrolling.',
                  safety: 'Only executes packaged local extension scripts. Contains zero remote code or CDN scripts.',
                },
                {
                  name: 'contextMenus',
                  type: 'SHORTCUT CREATION',
                  rationale: 'Provides a fast right-click menu entry ("📌 Add Stickle Note Here") on web elements for seamless 1-click note creation without opening toolbars.',
                  safety: 'Only triggers note creation when explicitly selected by the user from the right-click menu.',
                },
                {
                  name: 'https://api.notion.com/*',
                  type: 'OPTIONAL EXPORT SYNC',
                  rationale: 'Used exclusively to transmit user-initiated note exports directly from your browser background service worker to Notion\'s official API endpoint.',
                  safety: 'Requests travel strictly browser-to-Notion. Zero Stickle proxy servers in the middle.',
                },
                {
                  name: 'https://*.posthog.com/*',
                  type: 'ANONYMOUS TELEMETRY',
                  rationale: 'Transmits privacy-preserving, aggregate performance signals (e.g. note creation count, sync success rates) to measure app stability.',
                  safety: 'Zero note text, page titles, URLs, or personal identifiers are ever sent or logged.',
                },
              ].map(p => (
                <div key={p.name} style={{ backgroundColor: '#1c1c1e', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
                      <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#e4f579', backgroundColor: '#09090b', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(228,245,121,0.3)' }}>
                        {p.name}
                      </code>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#a1a1aa', letterSpacing: '0.5px' }}>
                        {p.type}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: '#ffffff', margin: '0 0 12px', lineHeight: 1.55, fontWeight: 330 }}>
                      {p.rationale}
                    </p>
                  </div>
                  <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: '#d4d4d8', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: 8, fontWeight: 330 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e4f579" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{p.safety}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STORE COMPLIANCE & SINGLE PURPOSE (White Block with Lime Accent) ─── */}
      <section style={s.section}>
        <div style={s.container}>
          <div style={{ ...s.colorBlock, backgroundColor: '#ffffff', border: '1px solid #e5e5e0', padding: '56px 48px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <span style={{ ...s.eyebrow, color: '#111111' }}>SINGLE PURPOSE DECLARATION &amp; CODE INTEGRITY GUARANTEE</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, backgroundColor: '#e4f579', color: '#111111', padding: '4px 12px', borderRadius: 50 }}>
                CHROME STORE PROGRAM POLICY COMPLIANT
              </span>
            </div>
            <h2 style={{ ...s.displayLg, color: '#111111', maxWidth: 720, marginBottom: 20 }}>
              Chrome Web Store single purpose &amp; security policy.
            </h2>
            <p style={{ ...s.bodyText, color: '#111111', maxWidth: 700, marginBottom: 36, fontSize: 18, fontWeight: 330 }}>
              Stickle strictly complies with Google Chrome Web Store Developer Program Policies regarding Single Purpose, User Data Privacy, and Code Execution Integrity.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, border: '1px solid #e5e5e0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#e4f579', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111111', margin: 0 }}>Single Purpose Declaration</h3>
                </div>
                <p style={{ fontSize: 14, color: '#111111', lineHeight: 1.6, margin: 0, fontWeight: 330 }}>
                  Stickle is dedicated to one single utility: <strong>allowing users to attach persistent floating sticky notes to webpage elements and export them to Notion</strong>. Stickle contains zero secondary features, background ad networks, search hijacking, or unrelated functionality.
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, border: '1px solid #e5e5e0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#e4f579', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111111', margin: 0 }}>No Remote Code Execution</h3>
                </div>
                <p style={{ fontSize: 14, color: '#111111', lineHeight: 1.6, margin: 0, fontWeight: 330 }}>
                  100% of Stickle's executable code is compiled and packaged directly within the Chrome extension build submitted to Google Web Store. Stickle contains <strong>zero remote code execution (RCE)</strong>: no <code style={s.codeTag}>eval()</code>, no dynamic CDN script tags, and no remote JS module loading.
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, border: '1px solid #e5e5e0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#e4f579', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111111', margin: 0 }}>Non-Sale &amp; Privacy Guarantee</h3>
                </div>
                <p style={{ fontSize: 14, color: '#111111', lineHeight: 1.6, margin: 0, fontWeight: 330 }}>
                  Stickle does not record, license, buy, or sell your browsing history, page content, note text, or Notion credentials to third parties or data brokers. All user data is processed locally on your device.
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, border: '1px solid #e5e5e0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#e4f579', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111111', margin: 0 }}>Manifest V3 Architecture</h3>
                </div>
                <p style={{ fontSize: 14, color: '#111111', lineHeight: 1.6, margin: 0, fontWeight: 330 }}>
                  Built natively for Manifest V3. Background tasks execute inside ephemeral background service workers with declarative Content Security Policies (CSP) enforcing strict origin isolation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={s.footer}>
        <div style={s.container}>
          <p style={s.caption}>
            © 2026 STICKLE OPEN SOURCE PROJECT · BUILT LOCAL-FIRST FOR WEB RESEARCH
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Design Tokens strictly Monochrome + Signature Lime (#e4f579) ──────────────
const s = {
  page: {
    fontFamily: "Inter, 'SF Pro Display', -apple-system, sans-serif",
    backgroundColor: '#ffffff',
    color: '#111111',
    minHeight: '100vh',
    WebkitFontSmoothing: 'antialiased' as const,
  },
  nav: {
    borderBottom: '1px solid #e5e5e0',
    padding: '16px 24px',
    position: 'sticky' as const,
    top: 0,
    backgroundColor: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    zIndex: 100,
  },
  navInner: { maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoLockup: { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.8px', color: '#111111' },
  badge: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.4px', backgroundColor: '#e4f579', color: '#111111', padding: '3px 10px', borderRadius: 50 },
  navLink: { fontSize: 14, fontWeight: 500, color: '#111111', textDecoration: 'none' },
  btnSecondary: { backgroundColor: '#ffffff', color: '#111111', border: 'none', borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer', boxShadow: '0 0 0 1px #e5e5e0' },
  hero: { maxWidth: 1280, margin: '0 auto', padding: '64px 24px 48px' },
  displayXL: { fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 340, lineHeight: 1.1, letterSpacing: '-1.2px', margin: '16px 0 20px', color: '#111111' },
  displayLg: { fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 340, lineHeight: 1.15, letterSpacing: '-0.8px', margin: '12px 0 20px' },
  bodyLg: { fontSize: 20, fontWeight: 330, lineHeight: 1.4, color: '#111111', maxWidth: 680, letterSpacing: '-0.14px' },
  bodyText: { fontSize: 16, fontWeight: 330, lineHeight: 1.6, color: '#111111' },
  eyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase' as const, color: '#111111', display: 'block', marginBottom: 8 },
  caption: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase' as const, color: '#111111', marginTop: 16 },
  codeTag: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, backgroundColor: '#f0f0eb', color: '#111111', padding: '2px 6px', borderRadius: 4 },
  section: { padding: '0 0 96px' },
  container: { maxWidth: 1280, margin: '0 auto', padding: '0 24px' },
  threeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 },
  card: { backgroundColor: '#ffffff', border: '1px solid #e5e5e0', borderRadius: 24, padding: 32 },
  cardLimeBadge: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const, backgroundColor: '#e4f579', color: '#111111', padding: '3px 10px', borderRadius: 50, display: 'inline-block', marginBottom: 16 },
  cardTitle: { fontSize: 22, fontWeight: 700, margin: '0 0 10px', color: '#111111', letterSpacing: '-0.3px' },
  colorBlock: { borderRadius: 24, padding: 56 },
  footer: { borderTop: '1px solid #e5e5e0', padding: '48px 24px', textAlign: 'center' as const },
};


