import { useState } from 'preact/hooks';
import { WaitlistForm } from '../index/WaitlistForm';
import { NoteBubble } from '../../components/NoteBubble';
import type { StickleNote, NoteColorBlock } from '../../lib/types';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoNote, setDemoNote] = useState<StickleNote>({
    id: 'waitlist-hero-note',
    url: 'https://stickle.app/waitlist',
    pageTitle: 'Be first in line when Stickle launches',
    content: 'Alt + Click pinned this note directly to the DOM element. Notes survive reloads, re-renders, and revisits.',
    anchor: {
      cssSelector: 'h1.hero-title',
      exactText: 'Be first in line when Stickle launches',
      tier: 'selector',
      offsetX: 0,
      offsetY: 0,
    },
    color: 'lime',
    tags: ['research', 'dom-anchoring'],
    collapsed: false,
    syncedToNotion: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div style={s.page}>
      {/* ══ 1. TOP NAV ════════════════════════════════════════════════════════ */}
      <nav style={s.nav}>
        <div className="waitlist-wrap" style={s.navInner}>
          <div style={s.logoLockup} onClick={goHome}>
            <div style={s.logoMark}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="13" cy="13" r="5" fill="white" opacity="0.9" />
                <circle cx="13" cy="13" r="2" fill="#111" />
              </svg>
            </div>
            <span style={s.wordmark}>stickle</span>
            <span style={s.navBadge}>WAITLIST</span>
          </div>

          <div className="nav-desktop-links" style={s.navLinks}>
            <a href="/" style={s.navLink}>Home</a>
            <a href="/#features" style={s.navLink}>Features</a>
            <a href="/docs" style={s.navLink}>Docs</a>
            <a href="/onboarding" style={s.navLink}>Sandbox</a>
            <a href="/privacy" style={s.navLink}>Privacy</a>
          </div>

          <div className="nav-desktop-actions" style={s.navActions}>
            <a
              href="https://github.com/BeeBombshell/stickle"
              target="_blank"
              rel="noreferrer"
              style={{ ...s.btnSecondary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              GitHub ↗
            </a>
            <button style={s.btnPrimary} onClick={goHome}>
              ← Homepage
            </button>
          </div>

          {/* Mobile Toggle Button */}
          <button
            className="nav-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-menu-drawer">
            <a href="/" style={s.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              Home
            </a>
            <a href="/#features" style={s.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              Features
            </a>
            <a href="/docs" style={s.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              Documentation
            </a>
            <a href="/onboarding" style={s.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              Interactive Sandbox
            </a>
            <a href="/privacy" style={s.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              Privacy Policy
            </a>
            <a
              href="https://github.com/BeeBombshell/stickle"
              target="_blank"
              rel="noreferrer"
              style={s.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              GitHub Repository ↗
            </a>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e5e0' }}>
              <button
                style={{ ...s.btnPrimary, width: '100%', padding: '12px 20px', fontSize: 15 }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  goHome();
                }}
              >
                ← Return to Homepage
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ══ 2. HERO / WAITLIST SECTION (Dynamic Responsive Monochrome Dark Block with Lime Accents) ═ */}
      <section className="waitlist-hero-section" style={s.heroSection}>
        <div className="waitlist-wrap" style={s.wrap}>
          <div className="waitlist-hero-card">
            {/* Ambient background accent glow */}
            <div style={{ position: 'absolute', right: '-5%', top: '-20%', width: 360, height: 360, borderRadius: '50%', backgroundColor: 'rgba(228,245,121,0.07)', filter: 'blur(70px)', pointerEvents: 'none' }} />

            <div className="waitlist-hero-grid">
              {/* Left Column: Headlines, Subhead, Embedded Form & Social Proof */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e4f579', display: 'inline-block' }} />
                  <span style={{ ...s.eyebrow, color: '#e4f579' }}>STICKLE • LAUNCH WAITLIST</span>
                </div>
                
                <h1 style={{ ...s.displayXL, color: '#ffffff', margin: '0 0 20px' }}>
                  Be first in line<br />when Stickle launches.
                </h1>
                
                <p style={{ ...s.heroSub, color: '#ffffff', marginBottom: 28 }}>
                  Leave persistent sticky notes in the margins of the web. Enter your email to get notified the exact moment early access builds drop.
                </p>

                {/* Standalone Waitlist Form Component */}
                <WaitlistForm variant="standalone" source="waitlist_page" />

                {/* Social Proof Avatar Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, flexWrap: 'wrap' as const }}>
                  <div style={{ display: 'flex' }}>
                    {['#e4f579', '#ffffff', '#bfdbfe', '#e8d5ff'].map((bg, idx) => (
                      <div key={bg} style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: bg, border: '2px solid #111111', marginLeft: idx > 0 ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#111111' }}>
                        {['S', 'P', 'K', 'M'][idx]}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#e4f579', letterSpacing: '0.4px' }}>
                    500+ RESEARCHERS &amp; DEVS WAITING
                  </span>
                </div>
              </div>

              {/* Right Column: Cute 3D Interactive Stickle Note Display */}
              <div className="waitlist-hero-preview">
                {/* Cute Floating Tooltip Badge pointing to the Note */}
                <div style={{
                  position: 'absolute',
                  top: -8,
                  right: 4,
                  backgroundColor: '#e4f579',
                  color: '#111111',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '6px 14px',
                  borderRadius: 50,
                  boxShadow: '0 8px 20px rgba(228,245,121,0.3)',
                  transform: 'rotate(4deg)',
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  maxWidth: '90%',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="17" x2="12" y2="22" />
                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                  </svg>
                  Try typing in this note! ↗
                </div>

                {/* Secondary Shadow Card behind for 3D depth collage effect */}
                <div style={{
                  position: 'absolute',
                  width: 250,
                  height: 160,
                  backgroundColor: '#e4f579',
                  borderRadius: 16,
                  transform: 'rotate(6deg) translate(16px, 16px)',
                  opacity: 0.85,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                }} />

                {/* Main Production NoteBubble Component */}
                <div style={{
                  position: 'relative',
                  zIndex: 10,
                  transform: 'rotate(-2.5deg)',
                  filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.5))',
                }}>
                  <NoteBubble
                    note={demoNote}
                    onSave={(updatedContent) => setDemoNote((prev) => ({ ...prev, content: updatedContent }))}
                    onColorChange={(color) => setDemoNote((prev) => ({ ...prev, color }))}
                    onBorderStyleChange={(borderStyle) => setDemoNote((prev) => ({ ...prev, borderStyle }))}
                    onTagsChange={(tags) => setDemoNote((prev) => ({ ...prev, tags }))}
                    onToggleCollapse={(collapsed) => setDemoNote((prev) => ({ ...prev, collapsed }))}
                  />
                </div>

                {/* Cute Floating SVG Stickle Badge at bottom left */}
                <div style={{
                  position: 'absolute',
                  bottom: -8,
                  left: 4,
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #111111',
                  borderRadius: 50,
                  padding: '5px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                  transform: 'rotate(-4deg)',
                  zIndex: 25,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#111111', letterSpacing: '0.4px' }}>
                    PINNED TO DOM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 3. WHAT STICKLE OFFERS (4 Crisp White Feature Cards) ══════════════ */}
      <section className="waitlist-section-spacing" style={s.sectionSpacing}>
        <div className="waitlist-wrap" style={s.wrap}>
          <div style={{ textAlign: 'center' as const, marginBottom: 40 }}>
            <span style={s.eyebrow}>FEATURE HIGHLIGHTS</span>
            <h2 style={{ ...s.displayLg, maxWidth: 640, margin: '12px auto 0' }}>
              Why you'll love Stickle
            </h2>
          </div>

          <div className="waitlist-feature-grid">
            {[
              {
                eyebrow: 'ROBUST ANCHORING',
                title: '3-Tier DOM Anchoring',
                desc: 'Notes stay pinned through reloads, ad reflows, and layout shifts using structural XPath, fingerprinting & trigram matching.',
                badge: 'CORE TECH',
              },
              {
                eyebrow: 'NOTION SYNC',
                title: '1-Click Notion Export',
                desc: 'Push individual notes or batch-export web annotations with source URL, title, and timestamp directly into Notion.',
                badge: 'NOTION API',
              },
              {
                eyebrow: 'LOCAL-FIRST',
                title: '100% Private & Offline',
                desc: 'Zero telemetry, zero external tracking servers. Complete privacy for your reading thoughts and research notes.',
                badge: 'LOCAL-FIRST',
              },
              {
                eyebrow: 'AI CONTEXT',
                title: 'AI Assistant Context (MCP)',
                desc: 'Expose your web notes to Claude Desktop, Cursor, and AI agents via local Model Context Protocol.',
                badge: 'MCP READY',
              },
            ].map((card) => (
              <div key={card.title} className="waitlist-feature-card">
                <div>
                  {/* Fixed Header Layout for Badges & Eyebrows */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8 }}>
                    <span style={{ ...s.eyebrow, fontSize: 10, color: '#111111', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {card.eyebrow}
                    </span>
                    <span style={{ ...s.cardBadge, backgroundColor: '#e4f579', color: '#111111', flexShrink: 0, whiteSpace: 'nowrap' as const }}>
                      {card.badge}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111111', margin: '0 0 10px', letterSpacing: '-0.3px' }}>
                    {card.title}
                  </h3>
                </div>
                <p style={{ fontSize: 14, color: '#111111', lineHeight: 1.55, margin: 0, fontWeight: 330 }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. WAITLIST FAQ (Signature Block Lime: #e4f579) ═══════════════════ */}
      <section className="waitlist-section-spacing" style={s.sectionSpacing}>
        <div className="waitlist-wrap" style={s.wrap}>
          <div className="waitlist-faq-card">
            <span style={{ ...s.eyebrow, color: '#111111', marginBottom: 12 }}>WAITLIST FAQ</span>
            <h2 style={{ ...s.displayLg, color: '#111111', maxWidth: 520, marginBottom: 36 }}>
              Frequently asked questions
            </h2>
            <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
              {WAITLIST_FAQS.map((faq, i) => (
                <div key={i} style={{ ...s.faqItem, borderRadius: i === 0 ? '12px 12px 0 0' : i === WAITLIST_FAQS.length - 1 ? '0 0 12px 12px' : 0 }}>
                  <button className="waitlist-faq-q-btn" style={s.faqQ} onClick={() => toggleFaq(i)}>
                    <span>{faq.q}</span>
                    <span style={{ fontSize: 20, fontWeight: 300, flexShrink: 0 }}>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <div className="waitlist-faq-a-content" style={s.faqA}>{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 5. FOOTER (Monochrome Dark #111) ═══════════════════════════════════ */}
      <footer style={s.footer}>
        <div className="waitlist-wrap" style={s.wrap}>
          <div style={s.footerInner}>
            <div>
              <div style={s.footerLogo}>
                <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <circle cx="13" cy="13" r="5" fill="#111111" opacity="0.9" />
                    <circle cx="13" cy="13" r="2" fill="#ffffff" />
                  </svg>
                </div>
                <span style={{ ...s.wordmark, color: '#ffffff' }}>stickle</span>
              </div>
              <p style={{ fontSize: 13, color: '#a1a1aa', margin: '12px 0 0', maxWidth: 300, lineHeight: 1.5, fontWeight: 330 }}>
                Leave persistent sticky notes in the margins of the web. 100% local-first &amp; open source.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 130 }}>
                <span style={{ ...s.eyebrow, fontSize: 10, color: '#71717a', marginBottom: 4 }}>NAVIGATION</span>
                <a href="/" style={s.footerLink}>Home</a>
                <a href="/docs" style={s.footerLink}>Documentation</a>
                <a href="/onboarding" style={s.footerLink}>Interactive Sandbox</a>
                <a href="/privacy" style={s.footerLink}>Privacy Policy</a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 130 }}>
                <span style={{ ...s.eyebrow, fontSize: 10, color: '#71717a', marginBottom: 4 }}>OPEN SOURCE</span>
                <a href="https://github.com/BeeBombshell/stickle" target="_blank" rel="noreferrer" style={s.footerLink}>GitHub Repository ↗</a>
                <a href="https://github.com/BeeBombshell/stickle/issues" target="_blank" rel="noreferrer" style={s.footerLink}>Issues &amp; Bugs ↗</a>
                <a href="https://github.com/BeeBombshell/stickle/discussions" target="_blank" rel="noreferrer" style={s.footerLink}>Discussions ↗</a>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #262626', fontSize: 12, color: '#a1a1aa', textAlign: 'center' as const, fontFamily: "'JetBrains Mono', monospace" }}>
            © {new Date().getFullYear()} STICKLE OPEN SOURCE PROJECT · MIT LICENSE
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Design Tokens strictly Monochrome + Lime (#e4f579) ──────────────────────
const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    color: '#111111',
    fontFamily: "Inter, 'SF Pro Display', -apple-system, sans-serif",
    WebkitFontSmoothing: 'antialiased' as const,
    overflowX: 'hidden' as const,
  },
  wrap: {
    maxWidth: 1280,
    margin: '0 auto',
  },
  sectionSpacing: {},
  heroSection: {},
  nav: {
    height: 64,
    borderBottom: '1px solid #e5e5e0',
    backgroundColor: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  navInner: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoLockup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#111111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: '-0.8px',
    color: '#111111',
  },
  navBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: '#e4f579',
    color: '#111111',
    padding: '3px 10px',
    borderRadius: 50,
    letterSpacing: '0.4px',
  },
  navLinks: {
    display: 'flex',
    gap: 24,
    alignItems: 'center',
  },
  navLink: {
    color: '#111111',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  mobileNavLink: {
    display: 'block',
    padding: '12px 14px',
    fontSize: 16,
    fontWeight: 500,
    color: '#111111',
    textDecoration: 'none',
    borderRadius: 8,
  },
  btnPrimary: {
    backgroundColor: '#111111',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 500,
    padding: '10px 22px',
    borderRadius: 50,
    border: 'none',
    cursor: 'pointer',
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    color: '#111111',
    fontSize: 14,
    fontWeight: 500,
    padding: '10px 20px',
    borderRadius: 50,
    border: 'none',
    boxShadow: '0 0 0 1px #e5e5e0',
    cursor: 'pointer',
  },
  heroHeader: {
    textAlign: 'center' as const,
    maxWidth: 760,
    margin: '0 auto',
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    display: 'block',
  },
  displayXL: {
    fontSize: 'clamp(28px, 6vw, 56px)',
    fontWeight: 340,
    letterSpacing: '-1.5px',
    lineHeight: 1.08,
  },
  displayLg: {
    fontSize: 'clamp(24px, 4.8vw, 44px)',
    fontWeight: 340,
    letterSpacing: '-0.8px',
    lineHeight: 1.15,
  },
  heroSub: {
    fontSize: 'clamp(15px, 3.8vw, 19px)',
    fontWeight: 330,
    lineHeight: 1.45,
    letterSpacing: '-0.14px',
    margin: '0 auto',
    maxWidth: 680,
  },
  cardBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: '#e4f579',
    color: '#111111',
    padding: '3px 10px',
    borderRadius: 50,
    letterSpacing: '0.5px',
  },
  faqItem: {
    backgroundColor: '#f8f8f6',
    overflow: 'hidden',
    borderBottom: '1px solid #e5e5e0',
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
    color: '#111111',
  },
  faqA: {
    padding: '0 24px 20px',
    fontSize: 15,
    color: '#111111',
    lineHeight: 1.6,
    fontWeight: 330,
  },
  footer: {
    backgroundColor: '#111111',
    color: '#ffffff',
    padding: '64px 0 36px',
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
  },
  footerLink: {
    display: 'block',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 330,
  },
} as const;
