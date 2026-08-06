import { useState } from 'preact/hooks';
import { WaitlistForm } from '../landing/WaitlistForm';

const WAITLIST_FAQS = [
  {
    q: 'When will Stickle launch on Chrome Web Store?',
    a: "We are preparing for public release. Joining the waitlist guarantees you'll receive an email notification the exact moment early access builds are live.",
  },
  {
    q: 'Is Stickle free and open source?',
    a: 'Yes, 100%! Stickle is local-first and open source under the MIT license. Core web notes, 3-tier anchoring, and Notion sync remain free forever.',
  },
  {
    q: 'Which browsers are supported?',
    a: 'Chrome, Brave, Arc, Edge, and all Chromium-based browsers via the Chrome Web Store. Firefox support is planned.',
  },
  {
    q: 'Will my notes stay private?',
    a: 'Yes! Stickle is 100% local-first. Your notes stay on your device in local IndexedDB storage. Notion sync connects directly to Notion with zero intermediate servers.',
  },
];

export default function WaitlistApp() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const goHome = () => {
    window.location.href = '/landing.html';
  };

  return (
    <div style={s.page}>
      {/* ══ 1. TOP NAV ════════════════════════════════════════════════════════ */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.logoLockup} onClick={goHome}>
            <div style={s.logoMark}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="13" cy="13" r="5" fill="white" opacity="0.9" />
                <circle cx="13" cy="13" r="2" fill="#111" />
              </svg>
            </div>
            <span style={s.wordmark}>stickle</span>
            <span style={s.navBadge}>waitlist</span>
          </div>

          <div style={s.navLinks}>
            <a href="/landing.html" style={s.navLink}>Home</a>
            <a href="/landing.html#features" style={s.navLink}>Features</a>
            <a href="/landing.html#pricing" style={s.navLink}>Pricing</a>
            <a href="/privacy.html" style={s.navLink}>Privacy</a>
          </div>

          <div style={s.navActions}>
            <button style={s.btnSecondary} onClick={goHome}>
              ← Back to Homepage
            </button>
          </div>
        </div>
      </nav>

      {/* ══ 2. HERO / WAITLIST COLOR BLOCK (Coral: #ffdbcc) ═══════════════════ */}
      <section style={s.heroSection}>
        <div style={s.wrap}>
          <div style={{ ...s.colorBlock, backgroundColor: '#ffdbcc', padding: '56px 48px', position: 'relative' as const }}>
            <div style={s.heroHeader}>
              <span style={{ ...s.eyebrow, color: '#9a3412', marginBottom: 12 }}>STICKLE LAUNCH ROLLOUT</span>
              <h1 style={{ ...s.displayXL, color: '#7c2d12', margin: '0 0 20px' }}>
                Be first in line<br />when Stickle launches.
              </h1>
              <p style={{ ...s.heroSub, color: '#9a3412' }}>
                Leave persistent sticky notes in the margins of the web. Enter your email to get notified the exact moment Stickle is released on the Chrome Web Store.
              </p>
            </div>

            {/* Monochrome Floating Sticky Note Preview */}
            <div style={s.stickyNotePreview}>
              <div style={s.stickyNoteHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <span style={s.stickyNoteEyebrow}>STICKLE • ANCHORED NOTE</span>
                </div>
                <span style={s.stickyNoteBadge}>STRUCTURAL</span>
              </div>
              <p style={s.stickyNoteText}>
                "Alt + Click pinned this note directly to the DOM element. It stays here through reloads, re-renders, and revisits."
              </p>
              <div style={s.stickyNoteFooter}>
                <span>https://docs.github.com/en/get-started</span>
                <span>Notion Sync Ready ↗</span>
              </div>
            </div>

            {/* Standalone Waitlist Form Component */}
            <div style={{ marginTop: 32 }}>
              <WaitlistForm variant="standalone" source="waitlist_page" />
            </div>

            <div style={s.socialProofBar}>
              <span>JOIN 500+ RESEARCHERS, DEVELOPERS &amp; PRODUCT BUILDERS WAITING FOR LAUNCH</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 3. WHAT STICKLE OFFERS (4 Pastel Feature Cards) ═════════════════ */}
      <section style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={{ textAlign: 'center' as const, marginBottom: 40 }}>
            <span style={s.eyebrow}>FEATURE HIGHLIGHTS</span>
            <h2 style={{ ...s.displayLg, maxWidth: 640, margin: '12px auto 0' }}>
              Why you'll love Stickle
            </h2>
          </div>

          <div style={s.fourGrid}>
            {[
              {
                bg: '#d1f7c4',
                eyebrow: 'ROBUST ANCHORING',
                title: '3-Tier DOM Anchoring',
                desc: 'Notes stay pinned through reloads, ad reflows, and layout shifts using structural XPath, fingerprinting & trigram matching.',
                badge: 'CORE TECH',
              },
              {
                bg: '#e8d5ff',
                eyebrow: 'NOTION SYNC',
                title: '1-Click Notion Export',
                desc: 'Push individual notes or batch-export web annotations with source URL, title, and timestamp directly into Notion.',
                badge: 'NOTION API',
              },
              {
                bg: '#fff7db',
                eyebrow: 'LOCAL-FIRST',
                title: '100% Private & Offline',
                desc: 'Zero telemetry, zero external tracking servers. Complete privacy for your reading thoughts and research notes.',
                badge: 'LOCAL-FIRST',
              },
              {
                bg: '#ffd6e8',
                eyebrow: 'AI CONTEXT',
                title: 'AI Assistant Context (MCP)',
                desc: 'Expose your web notes to Claude Desktop, Cursor, and AI agents via local Model Context Protocol.',
                badge: 'MCP READY',
              },
            ].map((card) => (
              <div key={card.title} style={{ ...s.colorBlock, backgroundColor: card.bg, flex: 1, minWidth: 260 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ ...s.eyebrow, fontSize: 10, color: '#52514e' }}>{card.eyebrow}</span>
                  <span style={s.cardBadge}>{card.badge}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 10px', letterSpacing: '-0.3px' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: 14, color: '#52514e', lineHeight: 1.5, margin: 0, fontWeight: 330 }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. WAITLIST FAQ (Lime Color Block) ════════════════════════════════ */}
      <section style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={{ ...s.colorBlock, backgroundColor: '#e4f579' }}>
            <span style={{ ...s.eyebrow, color: '#3f6212', marginBottom: 12 }}>WAITLIST FAQ</span>
            <h2 style={{ ...s.displayLg, color: '#14290a', maxWidth: 520, marginBottom: 36 }}>
              Frequently asked questions
            </h2>
            <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
              {WAITLIST_FAQS.map((faq, i) => (
                <div key={i} style={{ ...s.faqItem, borderRadius: i === 0 ? '12px 12px 0 0' : i === WAITLIST_FAQS.length - 1 ? '0 0 12px 12px' : 0 }}>
                  <button style={s.faqQ} onClick={() => toggleFaq(i)}>
                    <span>{faq.q}</span>
                    <span style={{ fontSize: 20, fontWeight: 300, flexShrink: 0 }}>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <div style={s.faqA}>{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 5. FOOTER (Inverse Canvas #111) ═══════════════════════════════════ */}
      <footer style={s.footer}>
        <div style={s.wrap}>
          <div style={s.footerInner}>
            <div>
              <div style={s.footerLogo}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="13" cy="13" r="5" fill="white" opacity="0.9" />
                  <circle cx="13" cy="13" r="2" fill="#111" />
                </svg>
                <span style={{ ...s.wordmark, color: '#fff' }}>stickle</span>
              </div>
              <p style={{ fontSize: 13, color: '#888888', margin: '8px 0 0', maxWidth: 300, lineHeight: 1.4 }}>
                Leave persistent sticky notes in the margins of the web. 100% local-first &amp; open source.
              </p>
            </div>
            <div>
              <a href="/landing.html" style={s.footerLink}>Home</a>
              <a href="/waitlist.html" style={s.footerLink}>Waitlist</a>
              <a href="/privacy.html" style={s.footerLink}>Privacy Policy</a>
              <a href="https://github.com/BeeBombshell/stickle" target="_blank" rel="noreferrer" style={s.footerLink}>GitHub Repository ↗</a>
            </div>
          </div>
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #222222', fontSize: 12, color: '#666666', textAlign: 'center' as const }}>
            © {new Date().getFullYear()} Stickle. Open Source under MIT License.
          </div>
        </div>
      </footer>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    color: '#111111',
    fontFamily: "'Inter', sans-serif",
  },
  wrap: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
  },
  sectionSpacing: {
    padding: '48px 0',
  },
  heroSection: {
    padding: '24px 0 48px',
  },
  nav: {
    height: 56,
    borderBottom: '1px solid #e5e5e0',
    backgroundColor: '#ffffff',
    sticky: 'top',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  navInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoLockup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#111111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: '-0.5px',
    color: '#111111',
  },
  navBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: '#f5f5f0',
    color: '#52514e',
    padding: '2px 8px',
    borderRadius: 50,
    letterSpacing: '0.5px',
  },
  navLinks: {
    display: 'flex',
    gap: 24,
    alignItems: 'center',
  },
  navLink: {
    color: '#52514e',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 400,
    transition: 'color 0.15s ease',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: '#111111',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    padding: '8px 18px',
    borderRadius: 50,
    border: 'none',
    cursor: 'pointer',
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    color: '#111111',
    fontSize: 14,
    fontWeight: 500,
    padding: '8px 18px',
    borderRadius: 50,
    border: '1px solid #e5e5e0',
    cursor: 'pointer',
  },
  colorBlock: {
    borderRadius: 24,
    padding: 48,
    boxSizing: 'border-box' as const,
  },
  heroHeader: {
    textAlign: 'center' as const,
    maxWidth: 720,
    margin: '0 auto',
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    display: 'block',
  },
  displayXL: {
    fontSize: 52,
    fontWeight: 800,
    letterSpacing: '-1.5px',
    lineHeight: 1.05,
  },
  displayLg: {
    fontSize: 40,
    fontWeight: 800,
    letterSpacing: '-1px',
    lineHeight: 1.1,
  },
  heroSub: {
    fontSize: 18,
    fontWeight: 330,
    lineHeight: 1.5,
    letterSpacing: '-0.2px',
    margin: '0 auto',
  },
  socialProofBar: {
    textAlign: 'center' as const,
    marginTop: 28,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: '#7c2d12',
    letterSpacing: '0.6px',
  },
  fourGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 16,
  },
  cardBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: '#111111',
    color: '#ffffff',
    padding: '3px 10px',
    borderRadius: 50,
    letterSpacing: '0.5px',
  },
  faqItem: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
    borderTop: '1px solid rgba(0,0,0,0.06)',
  },
  faqQ: {
    width: '100%',
    padding: '20px 24px',
    background: 'none',
    border: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    fontSize: 17,
    fontWeight: 600,
    textAlign: 'left' as const,
    cursor: 'pointer',
    color: '#14290a',
  },
  faqA: {
    padding: '0 24px 20px',
    fontSize: 15,
    color: '#365314',
    lineHeight: 1.6,
    fontWeight: 330,
  },
  footer: {
    backgroundColor: '#111111',
    color: '#ffffff',
    padding: '64px 0 36px',
    marginTop: 48,
  },
  footerInner: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 48,
    flexWrap: 'wrap' as const,
  },
  footerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  footerLink: {
    display: 'block',
    color: '#a3a3a3',
    textDecoration: 'none',
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 330,
  },

  // Monochrome Floating Sticky Note (DESIGN.md specification)
  stickyNotePreview: {
    backgroundColor: '#111111',
    color: '#ffffff',
    borderRadius: 16,
    padding: '24px 28px',
    maxWidth: 520,
    width: '100%',
    margin: '28px auto 0',
    transform: 'rotate(-2deg)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  stickyNoteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: '1px solid rgba(255,255,255,0.12)',
  },
  stickyNoteEyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.6px',
    color: '#e5e5e5',
  },
  stickyNoteBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    fontWeight: 700,
    backgroundColor: '#262626',
    color: '#a3a3a3',
    padding: '2px 8px',
    borderRadius: 50,
    letterSpacing: '0.5px',
  },
  stickyNoteText: {
    fontSize: 15,
    lineHeight: 1.5,
    color: '#f5f5f5',
    fontWeight: 340,
    margin: '0 0 16px',
    fontStyle: 'italic',
  },
  stickyNoteFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: '#737373',
    letterSpacing: '0.4px',
  },
} as const;
