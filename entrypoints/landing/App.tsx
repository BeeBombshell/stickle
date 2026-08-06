import { useState } from 'preact/hooks';
import { WaitlistForm } from './WaitlistForm';

type FaqItem = { q: string; a: string };

const FAQ_ITEMS = [
  {
    q: 'How does DOM anchoring work if a webpage updates?',
    a: 'Stickle tries three anchoring methods in sequence: structural XPath, neighbor content hashing, then trigram fuzzy text matching. If a page is deleted entirely the note lands in a recoverable tray. You never lose data.',
  },
  {
    q: 'Is my data private? Does Stickle track my notes?',
    a: "Stickle v1 sends zero telemetry. When you connect Notion, your API key and note content go directly from your browser to Notion's official API: nothing routes through any Stickle server.",
  },
  {
    q: 'Can I export my notes to Notion?',
    a: 'Yes. Enter your Notion Integration Token and Database ID in Settings to export notes with source URL, title, and timestamp in 1 click.',
  },
  {
    q: 'Which browsers are supported?',
    a: 'Chrome and all Chromium-based browsers (Brave, Arc, Edge) via the Chrome Web Store. Firefox support is planned.',
  },
];

const FAQS = FAQ_ITEMS;
const DEMO_COLORS = ['#e4f579', '#e8d5ff', '#fff7db', '#d1f7c4', '#ffd6e8', '#ffdbcc'];

export default function LandingApp() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pkmTab, setPkmTab] = useState<'notion' | 'obsidian' | 'mcp'>('notion');
  const [demoColor, setDemoColor] = useState('#e4f579');
  const [demoText, setDemoText] = useState(
    'Alt + Click pinned this note here. Notes survive page reloads and React re-renders: try editing this.'
  );

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const openSandbox = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
    } else {
      window.open('/onboarding.html', '_blank');
    }
  };

  const openPrivacy = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
    } else {
      window.open('/privacy.html', '_blank');
    }
  };

  const DEMO_COLORS = ['#e4f579', '#e8d5ff', '#fff7db', '#d1f7c4', '#ffd6e8', '#ffdbcc'];

  return (
    <div style={s.page}>

      {/* ══ 1. NAV ═══════════════════════════════════════════════════════════ */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          {/* Left: logo lockup */}
          <div style={s.logoLockup}>
            <div style={s.logoMark}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="13" cy="13" r="5" fill="white" opacity="0.9" />
                <circle cx="13" cy="13" r="2" fill="#111" />
              </svg>
            </div>
            <span style={s.wordmark}>stickle</span>
            <span style={s.navBadge}>v1.0</span>
          </div>

          {/* Centre: page links */}
          <div style={s.navLinks}>
            {['Features', 'Anchoring', 'Roadmap', 'Pricing', 'FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={s.navLink}>{l}</a>
            ))}
            <a href="/waitlist.html" style={s.navLink}>Waitlist</a>
          </div>

          {/* Right: CTAs */}
          <div style={s.navActions}>
            <a
              href="https://github.com/BeeBombshell/stickle"
              target="_blank"
              rel="noreferrer"
              style={s.navLink}
            >
              GitHub ↗
            </a>
            <button style={s.btnSecondary} onClick={openSandbox}>Sandbox</button>
            <button style={s.btnPrimary} onClick={openSandbox}>Add to Chrome - Free</button>
          </div>
        </div>
      </nav>

      {/* ══ 2. HERO ══════════════════════════════════════════════════════════ */}
      <section style={s.hero}>
        <div style={s.wrap}>
          <span style={s.eyebrow}>NEW: V1.0 IS LIVE &amp; OPEN SOURCE</span>
          <h1 style={s.displayXL}>
            Leave notes in the<br />margins of the web.
          </h1>
          <p style={s.heroSub}>
            Alt + Click any element on any webpage to drop a sticky note.
            It stays pinned there: through reloads, re-renders, and revisits:
            and syncs to Notion in one click.
          </p>

          <div style={s.ctaRow}>
            <a
              href="/waitlist.html"
              style={{ ...s.btnPrimary, fontSize: 16, padding: '12px 28px', textDecoration: 'none' }}
            >
              Join Launch Waitlist ↗
            </a>
            <button style={{ ...s.btnSecondary, fontSize: 16, padding: '12px 24px' }} onClick={openSandbox}>
              Try Sandbox
            </button>
            <a
              href="https://github.com/BeeBombshell/stickle"
              target="_blank"
              rel="noreferrer"
              style={{ ...s.btnSecondary, fontSize: 16, padding: '12px 24px', textDecoration: 'none' }}
            >
              View on GitHub ↗
            </a>
          </div>

          <p style={s.trustBar}>
            100% Local-first&nbsp;·&nbsp;Works Offline&nbsp;·&nbsp;No Account Needed&nbsp;·&nbsp;Open Source
          </p>

          {/* Browser mock + floating stickle demo */}
          <div style={s.browserMock}>
            <div style={s.browserBar}>
              <div style={s.browserDots}>
                {['#ef4444', '#f59e0b', '#10b981'].map(c => (
                  <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c, display: 'inline-block' }} />
                ))}
              </div>
              <div style={s.browserAddress}>https://docs.github.com/en/get-started</div>
            </div>
            <div style={s.browserBody}>
              {/* Fake article */}
              <div style={s.fakeArticle}>
                <span style={{ ...s.eyebrow, fontSize: 10, color: '#94a3b8', marginBottom: 10 }}>DOCUMENTATION</span>
                <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px', color: '#111', letterSpacing: '-0.4px' }}>
                  Understanding Persistent Web Annotation
                </h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  Stickle attaches floating sticky notes to exact DOM positions. Notes survive React re-renders,
                  ads reloading, and layout shifts via a 3-tier anchoring engine.
                </p>
                {/* Inline color switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                  <span style={{ ...s.eyebrow, fontSize: 9, color: '#94a3b8' }}>NOTE COLOR</span>
                  {DEMO_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setDemoColor(c)}
                      style={{
                        width: 16, height: 16, borderRadius: '50%',
                        backgroundColor: c,
                        border: demoColor === c ? '2px solid #111' : '1px solid rgba(0,0,0,0.1)',
                        cursor: 'pointer', padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Floating stickle */}
              <div style={{ ...s.floatingNote, backgroundColor: demoColor }}>
                <div style={s.noteBar}>
                  <span style={{ ...s.eyebrow, fontSize: 9, letterSpacing: '0.8px' }}>STICKLE • TIER 1</span>
                  <span style={s.noteChip}>STRUCTURAL</span>
                </div>
                <textarea
                  style={s.noteTextarea}
                  value={demoText}
                  onInput={e => setDemoText((e.target as HTMLTextAreaElement).value)}
                />
                <div style={{ ...s.eyebrow, fontSize: 9, color: '#555', textAlign: 'right' as const, marginTop: 6 }}>
                  notion sync ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 3. PROBLEM (monochrome container with coral callout) ══════════════ */}
      <section style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={{ ...s.colorBlock, backgroundColor: '#f8f8f6', border: '1px solid #e5e5e0' }}>
            <span style={{ ...s.eyebrow, color: '#52514e', marginBottom: 12 }}>THE BROKEN WORKFLOW</span>
            <h2 style={{ ...s.displayLg, color: '#111111', maxWidth: 860 }}>
              Stop losing your thinking<br />in app-switching context collapse.
            </h2>
            <p style={{ fontSize: 20, fontWeight: 330, lineHeight: 1.4, letterSpacing: '-0.14px', color: '#52514e', maxWidth: 720, margin: '0 0 28px' }}>
              You read something interesting, have a thought, then alt-tab to Notion, lose the reading
              flow, and paste a raw URL you will never fully remember.
              Highlighters only capture text you select. Web clippers save the page, not your thinking.
            </p>
            <div style={{ ...s.problemCallout, backgroundColor: '#ffdbcc', color: '#7c2d12', border: '1px solid rgba(124,45,18,0.1)' }}>
              <strong>Stickle closes the gap:</strong>&nbsp;write floating notes directly on the webpage, right where your thoughts happen.
            </div>
          </div>
        </div>
      </section>

      {/* ══ 4. VALUE PROPS (three pastel blocks) ════════════════════════════ */}
      <section id="features" style={s.sectionSpacing}>
        <div style={s.wrap}>
          <span style={s.eyebrow}>WHY STICKLE IS DIFFERENT</span>
          <h2 style={{ ...s.displayLg, maxWidth: 640, marginBottom: 48 }}>
            Built for how you actually read the web.
          </h2>
          <div style={s.threeGrid}>
            {[
              {
                eyebrow: 'WRITE WHERE YOU READ',
                headline: 'Drop a note on any element without leaving the page.',
                body: 'Alt + Click any DOM element (heading, code block, image, paragraph) to attach a note. No toolbar. No text selection friction.',
              },
              {
                eyebrow: 'NOTES THAT DON\'T DRIFT',
                headline: 'A 3-tier anchoring engine keeps notes in place.',
                body: 'Stickle survives React re-renders, ad reflows, and layout shifts using XPath, content fingerprinting, and fuzzy text matching.',
              },
              {
                eyebrow: 'INTO NOTION, INSTANTLY',
                headline: 'Push your research to Notion in one click.',
                body: 'Batch-export all unsynced notes with source URL, page title, and timestamps into your existing Notion database.',
              },
            ].map(prop => (
              <div key={prop.eyebrow} style={{ ...s.colorBlock, backgroundColor: '#ffffff', border: '1px solid #e5e5e0', flex: 1, minWidth: 260 }}>
                <span style={{ ...s.eyebrow, fontSize: 10, color: '#111111', marginBottom: 16 }}>{prop.eyebrow}</span>
                <h3 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.3px', color: '#111111', margin: '0 0 12px' }}>
                  {prop.headline}
                </h3>
                <p style={{ fontSize: 15, fontWeight: 330, lineHeight: 1.55, color: '#52514e', margin: 0 }}>
                  {prop.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. FEATURE CARDS (white canvas, hairline grid) ═══════════════════ */}
      <section style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={s.featureGrid}>
            {[
              {
                eyebrow: 'KEYBOARD SHORTCUT',
                title: 'Alt + Click to annotate anything.',
                body: 'One shortcut. Hold Alt (or Option on Mac), click anything on the page. No toolbar hunting, no text selection. Right-click context menu also works.',
              },
              {
                eyebrow: 'DESIGN SYSTEM',
                title: 'Five signature pastel colors.',
                body: 'Lime, lilac, cream, mint, pink: each with a crisp monochrome frame that reads on light and dark pages without competing with the site.',
              },
              {
                eyebrow: 'NOTE MANAGEMENT',
                title: 'Central popup across the entire web.',
                body: 'Search every note you\'ve taken across all tabs. Filter by active domain, jump back to any saved position in one click.',
              },
              {
                eyebrow: 'PRIVACY & STORAGE',
                title: '100% local-first. No server, no telemetry.',
                body: 'Stored in Chrome\'s IndexedDB. Works offline completely. When you sync to Notion, data goes directly from your browser to Notion\'s official API.',
              },
            ].map(feat => (
              <div key={feat.eyebrow} style={s.featureCard}>
                <span style={{ ...s.eyebrow, marginBottom: 12 }}>{feat.eyebrow}</span>
                <h3 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.2px', color: '#111', margin: '0 0 10px' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: 15, fontWeight: 330, lineHeight: 1.55, color: '#52514e', margin: 0 }}>
                  {feat.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. ANCHORING ENGINE (monochrome section, pink cards) ══════════════ */}
      <section id="anchoring" style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={{ ...s.colorBlock, backgroundColor: '#f8f8f6', border: '1px solid #e5e5e0', padding: '48px 48px' }}>
            <span style={{ ...s.eyebrow, color: '#52514e', marginBottom: 12 }}>3-TIER ANCHORING ENGINE</span>
            <h2 style={{ ...s.displayLg, color: '#111111', maxWidth: 720 }}>
              Notes that don't drift.<br />Ever.
            </h2>
            <p style={{ fontSize: 18, fontWeight: 330, lineHeight: 1.45, letterSpacing: '-0.26px', color: '#52514e', maxWidth: 640, margin: '0 0 36px' }}>
              Single-method highlighters break when DOM trees shift. Stickle combines three independent fallback tiers so your notes always find their home.
            </p>

            <div style={s.tierGrid}>
              {[
                {
                  badge: 'TIER 1: EXACT',
                  title: 'Structural XPath & DOM',
                  desc: 'Attaches directly to the target element using an optimized selector chain and relative offset vector.',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#500724" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  ),
                },
                {
                  badge: 'TIER 2: RESILIENT',
                  title: 'Survives dynamic re-renders',
                  desc: 'Fingerprints surrounding content so notes stay attached even when Twitter, Reddit, or GitHub update in real time.',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#500724" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  ),
                },
                {
                  badge: 'TIER 3: FUZZY',
                  title: 'Handles layout refactors',
                  desc: 'Scans page text nodes to relocate your notes even if HTML structure or CSS styling changes completely.',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#500724" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  ),
                },
              ].map(t => (
                <div
                  key={t.title}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid #e5e5e0',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {t.icon}
                      </div>
                      <span
                        style={{
                          ...s.eyebrow,
                          fontSize: 9,
                          color: '#111111',
                          backgroundColor: '#e4f579',
                          padding: '4px 10px',
                          borderRadius: 50,
                          fontWeight: 700,
                        }}
                      >
                        {t.badge}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3, color: '#111111', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                      {t.title}
                    </h3>
                    <p style={{ fontSize: 14, fontWeight: 330, lineHeight: 1.5, color: '#52514e', margin: 0 }}>
                      {t.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 7. NOTION & SECOND BRAIN (monochrome section, mint cards) ═════════ */}
      <section style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={{ ...s.colorBlock, backgroundColor: '#f8f8f6', border: '1px solid #e5e5e0', padding: '48px 48px' }}>
            <span style={{ ...s.eyebrow, color: '#52514e', marginBottom: 12 }}>KNOWLEDGE BASE SYNC</span>
            <h2 style={{ ...s.displayLg, color: '#111111', maxWidth: 680 }}>
              Export your web thoughts<br />directly to your Second Brain.
            </h2>
            <p style={{ fontSize: 18, fontWeight: 330, lineHeight: 1.45, letterSpacing: '-0.26px', color: '#52514e', maxWidth: 620, margin: '0 0 36px' }}>
              No more lost tabs or forgotten bookmarks. Connect your web annotations directly to Notion, Obsidian, or your local AI notes in one click.
            </p>

            {/* Interactive Format Selector Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' as const }}>
              {[
                { id: 'notion', label: 'NOTION WORKSPACE' },
                { id: 'obsidian', label: 'OBSIDIAN MARKDOWN' },
                { id: 'mcp', label: 'AI ASSISTANT CONTEXT' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPkmTab(tab.id as any)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 50,
                    fontSize: 11,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    backgroundColor: pkmTab === tab.id ? '#052e16' : 'rgba(255, 255, 255, 0.75)',
                    color: pkmTab === tab.id ? '#ffffff' : '#052e16',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Preview Box */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 24, marginBottom: 28, border: '1px solid rgba(5,46,22,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              {pkmTab === 'notion' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0fdf4' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#052e16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#052e16' }}>Notion Database Entry • Automatic Field Mapping</span>
                  </div>
                  <div style={s.notionPropGrid}>
                    {[
                      { label: 'ANNOTATION BODY', value: 'Web sticky note content' },
                      { label: 'SOURCE PERMALINK', value: 'Exact URL of the webpage' },
                      { label: 'DOCUMENT TITLE', value: 'Page title tag' },
                      { label: 'DATE CREATED', value: 'ISO timestamp tag' },
                      { label: 'NOTE THEME', value: 'Pastel color label' },
                      { label: 'SYNC STATUS', value: 'Synced flag' },
                    ].map(p => (
                      <div key={p.label} style={s.notionPropCard}>
                        <span style={{ ...s.eyebrow, fontSize: 9, color: '#065f46', marginBottom: 4, display: 'block' }}>{p.label}</span>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#052e16', margin: 0 }}>{p.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pkmTab === 'obsidian' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#052e16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#052e16' }}>Clean `.md` Export with YAML Frontmatter &amp; [[WikiLinks]]</span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#052e16', lineHeight: 1.6, backgroundColor: '#f4fce3', padding: 16, borderRadius: 12 }}>
                    <div style={{ color: '#065f46', fontWeight: 700 }}>---</div>
                    <div>title: "Persistent Web Annotation"</div>
                    <div>url: "https://docs.github.com/en/get-started"</div>
                    <div>created: "2026-08-06T01:50:00Z"</div>
                    <div style={{ color: '#065f46', fontWeight: 700 }}>---</div>
                    <br />
                    <div style={{ fontWeight: 700 }}># [[Persistent Web Annotation]]</div>
                    <div>Stickle attaches sticky notes directly to web page elements. Notes persist across reloads.</div>
                  </div>
                </div>
              )}

              {pkmTab === 'mcp' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#052e16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#052e16' }}>Live Context Feed for Claude Desktop, Cursor &amp; ChatGPT</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#14532d', lineHeight: 1.55 }}>
                    Your web sticky notes expose instant context to local LLMs. Ask your AI: <em>"What did I note about this documentation page last week?"</em> and get accurate answers backed by your notes.
                  </div>
                </div>
              )}
            </div>

            {/* 4 Feature Cards with SVG Vector Icons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {[
                {
                  title: '1-Click Notion Sync',
                  desc: 'Push single notes or batch-sync all web annotations directly to your Notion database.',
                  badge: 'NOTION API',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#052e16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                  ),
                },
                {
                  title: 'Obsidian & Markdown',
                  desc: 'Export formatted `.md` files with YAML frontmatter ready for Obsidian [[WikiLinks]].',
                  badge: 'OPEN FORMAT',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#052e16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  ),
                },
                {
                  title: 'AI Assistant Context',
                  desc: 'Feed your web annotations into AI tools so your assistant remembers what you read.',
                  badge: 'AI READY',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#052e16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    </svg>
                  ),
                },
                {
                  title: '100% Private & Local',
                  desc: 'Your data stays on device in local storage. Notion sync connects directly to Notion.',
                  badge: 'LOCAL-FIRST',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#052e16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ),
                },
              ].map(item => (
                <div key={item.title} style={{ backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#e4f579', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.icon}
                    </div>
                    <span style={{ ...s.eyebrow, fontSize: 9, color: '#111111' }}>{item.badge}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111111', margin: '0 0 6px' }}>{item.title}</h3>
                  <p style={{ fontSize: 13, color: '#52514e', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 8. ROADMAP (monochrome section, lime cards) ═══════════════════════ */}
      <section id="roadmap" style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={{ ...s.colorBlock, backgroundColor: '#f8f8f6', border: '1px solid #e5e5e0', padding: '48px 48px' }}>
            <span style={{ ...s.eyebrow, color: '#52514e', marginBottom: 12 }}>PRODUCT ROADMAP</span>
            <h2 style={{ ...s.displayLg, color: '#111111', maxWidth: 700 }}>
              The cloud &amp; AI layer<br />is being built next.
            </h2>
            <p style={{ fontSize: 18, fontWeight: 330, lineHeight: 1.45, letterSpacing: '-0.26px', color: '#52514e', maxWidth: 620, margin: '0 0 36px' }}>
              v1.0 is live as a 100% local-first tool. Here is our roadmap for cross-device syncing, team collaboration, and AI context:
            </p>

            {/* 4-Card Responsive Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              {[
                {
                  badge: 'NOW • V1.0',
                  title: 'Instant Web Notes',
                  desc: 'Drop floating sticky notes on any webpage. Fully offline, local storage, and 1-click Notion export.',
                  isCurrent: true,
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="17" x2="12" y2="22" />
                      <path d="M5 17h14l-1.5-5H6.5L5 17z" />
                      <path d="M9 12V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v8" />
                    </svg>
                  ),
                },
                {
                  badge: 'NEXT • Q3 2026',
                  title: 'Cross-Device Sync',
                  desc: 'Access your web notes automatically across all your devices and Chromium browsers with cloud backup.',
                  isCurrent: false,
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                      <path d="M12 13l-3-3m0 0l3-3m-3 3h8" />
                    </svg>
                  ),
                },
                {
                  badge: 'SOON • Q4 2026',
                  title: 'Team Workspaces',
                  desc: 'Share annotated web pages with your team. Discuss articles, documentation, and PRs right where they live.',
                  isCurrent: false,
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                },
                {
                  badge: 'FUTURE VISION',
                  title: 'AI Assistant Context',
                  desc: 'Connect your web notes to Claude, Cursor, or ChatGPT so your AI assistant remembers what you read.',
                  isCurrent: false,
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                      <path d="M5 3v4" />
                      <path d="M19 17v4" />
                      <path d="M3 5h4" />
                      <path d="M17 19h4" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#e4f579', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.icon}
                      </div>
                      <span
                        style={{
                          ...s.eyebrow,
                          fontSize: 9,
                          color: item.isCurrent ? '#ffffff' : '#111111',
                          backgroundColor: item.isCurrent ? '#111111' : '#e4f579',
                          padding: '4px 10px',
                          borderRadius: 50,
                          fontWeight: 700,
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3, color: '#111111', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: 14, fontWeight: 330, lineHeight: 1.5, color: '#52514e', margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 9. COMPARISON (white) ════════════════════════════════════════════ */}
      <section id="comparison" style={s.sectionSpacing}>
        <div style={s.wrap}>
          <span style={s.eyebrow}>FEATURE COMPARISON</span>
          <h2 style={{ ...s.displayLg, maxWidth: 600, marginBottom: 40 }}>
            Stickle vs alternative tools.
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Feature</th>
                  <th style={{ ...s.th, color: '#111', fontWeight: 800 }}>Stickle</th>
                  <th style={s.th}>Hypothes.is</th>
                  <th style={s.th}>Notion Clipper</th>
                  <th style={s.th}>Readwise / Liner</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Free-form placement (no text selection)', '✓', '✕', '✕', '✕'],
                  ['Resilient 3-tier DOM anchoring', '✓ 3-Tier', '⚠ Basic', '✕', '✕'],
                  ['Works offline / local-first', '✓', '✕', '✕', '✕'],
                  ['Direct 1-click Notion export', '✓', '✕', '⚠ Full page', '⚠ Highlights'],
                  ['No account to start', '✓', '✕', '✕', '✕'],
                  ['Fully open source (FOSS)', '✓', '⚠ Partial', '✕', '✕'],
                ].map(([feat, ...vals]) => (
                  <tr key={feat as string}>
                    <td style={s.td}>{feat}</td>
                    {vals.map((v, i) => (
                      <td key={i} style={{ ...s.td, textAlign: 'center' as const }}>
                        {v === '✓' || (typeof v === 'string' && v.startsWith('✓')) ? (
                          <span style={s.checkYes}>{v}</span>
                        ) : v === '✕' ? (
                          <span style={s.checkNo}>{v}</span>
                        ) : (
                          <span style={s.checkWarn}>{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══ 10. PRICING (white, hairline cards) ══════════════════════════════ */}
      <section id="pricing" style={s.sectionSpacing}>
        <div style={s.wrap}>
          <span style={s.eyebrow}>TRANSPARENT PRICING</span>
          <h2 style={{ ...s.displayLg, maxWidth: 560, marginBottom: 48 }}>
            Open-core. Always free at the core.
          </h2>
          <div style={s.pricingGrid}>
            {/* Free */}
            <div style={s.priceCard}>
              <span style={s.eyebrow}>FREE FOREVER</span>
              <h3 style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 4px', letterSpacing: '-0.3px' }}>Core Extension</h3>
              <div style={s.priceAmount}>$0</div>
              <p style={{ fontSize: 14, color: '#52514e', margin: '0 0 24px', lineHeight: 1.5 }}>
                100% free &amp; open source forever.
              </p>
              <ul style={s.featureList}>
                {['Unlimited local sticky notes', '3-tier DOM anchoring engine', '1-click Notion export', 'Central popup note manager', 'Offline-first IndexedDB storage'].map(f => (
                  <li key={f} style={s.featureItem}>
                    <span style={s.checkMark}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button style={{ ...s.btnPrimary, width: '100%', marginTop: 'auto' }} onClick={openSandbox}>
                Add to Chrome - Free
              </button>
            </div>

            {/* Pro */}
            <div style={{ ...s.priceCard, border: '2px solid #111', position: 'relative' as const }}>
              <span style={s.featuredBadge}>EARLY ACCESS</span>
              <span style={{ ...s.eyebrow, color: '#e02475' }}>PRO SUPPORTER</span>
              <h3 style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 4px', letterSpacing: '-0.3px' }}>Supporter Access</h3>
              <div style={s.priceAmount}>
                $29 <span style={{ fontSize: 15, fontWeight: 400 }}>one-time</span>
              </div>
              <p style={{ fontSize: 14, color: '#52514e', margin: '0 0 24px', lineHeight: 1.5 }}>
                Support open source + unlock cloud features when they ship.
              </p>
              <ul style={s.featureList}>
                {['Everything in Free Core', 'Cross-device cloud sync', 'Central web dashboard', 'Remote MCP server for AI context', 'Priority feature requests'].map(f => (
                  <li key={f} style={s.featureItem}>
                    <span style={s.checkMark}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                style={{ ...s.btnPrimary, width: '100%', marginTop: 'auto', backgroundColor: '#e02475' }}
                onClick={openSandbox}
              >
                Become a Supporter
              </button>
            </div>

            {/* Teams */}
            <div style={s.priceCard}>
              <span style={s.eyebrow}>TEAMS</span>
              <h3 style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 4px', letterSpacing: '-0.3px' }}>Teams &amp; Workspaces</h3>
              <div style={s.priceAmount}>
                $9 <span style={{ fontSize: 15, fontWeight: 400 }}>/user/mo</span>
              </div>
              <p style={{ fontSize: 14, color: '#52514e', margin: '0 0 24px', lineHeight: 1.5 }}>
                For engineering, research, and product teams.
              </p>
              <ul style={s.featureList}>
                {['Everything in Pro', 'Team shared web annotations', 'Workspace audit logs', 'User role permissions', 'Dedicated support channel'].map(f => (
                  <li key={f} style={s.featureItem}>
                    <span style={s.checkMark}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button style={{ ...s.btnSecondary, width: '100%', marginTop: 'auto' }} onClick={() => {
                const el = document.getElementById('waitlist');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>
                Join Teams Waitlist
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 10.5 DEDICATED WAITLIST SECTION (Block Lime: #e4f579) ══════════════ */}
      <section id="waitlist" style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={{ ...s.colorBlock, backgroundColor: '#e4f579', padding: '56px 48px', textAlign: 'center' as const }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <span style={{ ...s.eyebrow, color: '#111111', marginBottom: 12 }}>EXTENSION ROLLOUT</span>
              <h2 style={{ ...s.displayLg, color: '#111111', margin: '0 0 16px' }}>
                Be first in line when Stickle launches.
              </h2>
              <p style={{ fontSize: 18, fontWeight: 330, lineHeight: 1.5, color: '#333333', margin: '0 0 28px' }}>
                We are preparing the extension for public release. Join the waitlist to receive an email notification the exact moment early access builds are live.
              </p>
              <div>
                <a
                  href="/waitlist.html"
                  style={{ ...s.btnPrimary, fontSize: 16, padding: '14px 32px', textDecoration: 'none', display: 'inline-block' }}
                >
                  Join Rollout Waitlist ↗
                </a>
              </div>
              <div style={{ marginTop: 20 }}>
                <span style={{ ...s.eyebrow, fontSize: 11, color: '#111111', letterSpacing: '0.8px' }}>
                  JOIN 500+ RESEARCHERS &amp; DEVELOPERS ALREADY WAITING FOR LAUNCH
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 11. FAQ (Block Lime: #e4f579) ═════════════════════════════════════ */}
      <section id="faq" style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={{ ...s.colorBlock, backgroundColor: '#e4f579' }}>
            <span style={{ ...s.eyebrow, color: '#111111', marginBottom: 12 }}>FAQ</span>
            <h2 style={{ ...s.displayLg, color: '#111111', maxWidth: 520, marginBottom: 40 }}>
              Got questions?
            </h2>
            <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
              {FAQS.map((faq, i) => (
                <div key={i} style={{ ...s.faqItem, borderRadius: i === 0 ? '12px 12px 0 0' : i === FAQS.length - 1 ? '0 0 12px 12px' : 0 }}>
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

      {/* ══ 12. CLOSING CTA (white) ═══════════════════════════════════════════ */}
      <section style={{ ...s.sectionSpacing, textAlign: 'center' as const }}>
        <div style={s.wrap}>
          <span style={s.eyebrow}>OPEN SOURCE &amp; FREE</span>
          <h2 style={{ ...s.displayLg, maxWidth: 600, margin: '16px auto 20px' }}>
            Start annotating the web today.
          </h2>
          <p style={{ fontSize: 18, color: '#52514e', maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.5, fontWeight: 330 }}>
            Install the extension. No account, no setup, no friction.
          </p>
          <div style={{ ...s.ctaRow, justifyContent: 'center' }}>
            <button style={{ ...s.btnPrimary, fontSize: 16, padding: '14px 32px' }} onClick={openSandbox}>
              Add to Chrome - Free
            </button>
            <a
              href="https://github.com/BeeBombshell/stickle"
              target="_blank"
              rel="noreferrer"
              style={{ ...s.btnSecondary, fontSize: 16, padding: '14px 28px', textDecoration: 'none' }}
            >
              ⭐ Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ══ FOOTER (inverse-canvas black) ════════════════════════════════════ */}
      <footer style={s.footer}>
        <div style={{ ...s.wrap, ...s.footerInner }}>
          <div>
            <div style={s.footerLogo}>
              <div style={{ ...s.logoMarkLight, width: 28, height: 28, borderRadius: 7 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="10" cy="10" r="4" fill="#111111" />
                  <circle cx="10" cy="10" r="1.5" fill="#ffffff" />
                </svg>
              </div>
              <span style={{ ...s.wordmark, fontSize: 18, color: '#ffffff' }}>stickle</span>
            </div>
            <p style={{ color: '#737373', fontSize: 14, maxWidth: 280, margin: '10px 0 0', lineHeight: 1.5 }}>
              Spatial web annotation &amp; PKM for researchers, developers, and thinkers.
            </p>
            <p style={{ color: '#525252', fontSize: 12, margin: '16px 0 0', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.4px' }}>
              MIT LICENSE · OPEN SOURCE
            </p>
          </div>

          <div style={{ display: 'flex', gap: 64, flexWrap: 'wrap' as const }}>
            {[
              {
                head: 'PRODUCT',
                links: [
                  { label: 'Features', href: '#features' },
                  { label: 'Anchoring Tech', href: '#anchoring' },
                  { label: 'Roadmap', href: '#roadmap' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Waitlist', href: '/waitlist.html' },
                ],
              },
              {
                head: 'RESOURCES',
                links: [
                  { label: 'Sandbox Tutorial', href: '#', onClick: openSandbox },
                  { label: 'Privacy Policy', href: '#', onClick: openPrivacy },
                  { label: 'GitHub Repository', href: 'https://github.com/BeeBombshell/stickle' },
                  { label: 'FAQ', href: '#faq' },
                ],
              },
              {
                head: 'COMMUNITY',
                links: [
                  { label: 'Product Hunt', href: 'https://producthunt.com' },
                  { label: 'Twitter / X', href: 'https://twitter.com' },
                  { label: 'GitHub Discussions', href: 'https://github.com/BeeBombshell/stickle/discussions' },
                ],
              },
            ].map(col => (
              <div key={col.head}>
                <p style={{ ...s.eyebrow, color: '#737373', marginBottom: 14 }}>{col.head}</p>
                {col.links.map(link => (
                  link.onClick ? (
                    <button key={link.label} onClick={link.onClick} style={s.footerBtn}>{link.label}</button>
                  ) : (
                    <a key={link.label} href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" style={s.footerLink}>{link.label}</a>
                  )
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Design tokens — strictly matching DESIGN.md ──────────────────────────────
const s = {
  page: {
    backgroundColor: '#ffffff',
    color: '#111111',
    fontFamily: "Inter, 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    margin: 0,
    padding: 0,
    WebkitFontSmoothing: 'antialiased' as const,
  },

  // Nav — `top-nav` component, 64px height, canvas bg with blur
  nav: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid #ebebeb',
    height: 64,
    display: 'flex',
    alignItems: 'center',
  },
  // navInner is the full-width flex row INSIDE the nav
  navInner: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 32px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  // wrap is the generic content width container used OUTSIDE nav
  wrap: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 32px',
    width: '100%',
  },
  logoLockup: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  logoMark: {
    width: 32,
    height: 32,
    backgroundColor: '#111111',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoMarkLight: {
    width: 32,
    height: 32,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  wordmark: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.8px', color: '#111' },
  navBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.4px',
    backgroundColor: '#f0f0eb',
    color: '#52514e',
    padding: '2px 8px',
    borderRadius: 50,
  },
  navLinks: { display: 'flex', gap: 20, alignItems: 'center', flex: 1, justifyContent: 'center' as const },
  navActions: { display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 },
  navLink: { color: '#52514e', textDecoration: 'none', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap' as const },

  // Buttons — pill ONLY (DESIGN.md §Buttons)
  btnPrimary: {
    backgroundColor: '#111111',
    color: '#ffffff',
    border: 'none',
    borderRadius: 50,
    padding: '10px 22px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    letterSpacing: '-0.1px',
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    textDecoration: 'none',
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    color: '#111111',
    border: 'none',
    borderRadius: 50,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 0 0 1px #e5e5e0',
    letterSpacing: '-0.1px',
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Typography — DESIGN.md §Typography
  eyebrow: {
    fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    color: '#52514e',
    display: 'block',
  },
  displayXL: {
    fontSize: 'clamp(44px, 6.5vw, 86px)',
    fontWeight: 340,
    lineHeight: 1.00,
    letterSpacing: '-1.72px',
    color: '#111111',
    margin: '16px 0 24px',
  },
  displayLg: {
    fontSize: 'clamp(32px, 4.5vw, 64px)',
    fontWeight: 340,
    lineHeight: 1.1,
    letterSpacing: '-0.96px',
    color: '#111111',
    margin: '12px 0 20px',
  },

  // Hero
  hero: { padding: '80px 0 96px', maxWidth: 1280, margin: '0 auto', paddingLeft: 32, paddingRight: 32 },
  heroSub: {
    fontSize: 20,
    fontWeight: 330,
    lineHeight: 1.4,
    letterSpacing: '-0.14px',
    color: '#52514e',
    maxWidth: 580,
    margin: '0 0 28px',
  },
  ctaRow: { display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 20 },
  trustBar: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    color: '#b0b0a8',
    margin: '0 0 56px',
  },

  // Browser mock
  browserMock: {
    border: '1px solid #e5e5e0',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
  },
  browserBar: {
    backgroundColor: '#f5f5f3',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderBottom: '1px solid #e5e5e0',
  },
  browserDots: { display: 'flex', gap: 5 },
  browserAddress: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: '4px 12px',
    borderRadius: 50,
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#64748b',
    border: '1px solid #e2e8f0',
  },
  browserBody: {
    padding: 32,
    position: 'relative' as const,
    minHeight: 280,
    backgroundColor: '#fafafa',
    display: 'flex',
    gap: 32,
    alignItems: 'flex-start',
  },
  fakeArticle: { flex: 1, maxWidth: 480 },

  // Floating stickle in hero
  floatingNote: {
    width: 280,
    borderRadius: 12,
    padding: 16,
    flexShrink: 0,
    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
    border: '1px solid rgba(0,0,0,0.08)',
    transition: 'background-color 0.2s ease',
  },
  noteBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteChip: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    fontWeight: 700,
    backgroundColor: 'rgba(0,0,0,0.08)',
    color: '#111',
    padding: '2px 8px',
    borderRadius: 50,
    letterSpacing: '0.4px',
  },
  noteTextarea: {
    width: '100%',
    height: 80,
    border: 'none',
    background: 'transparent',
    resize: 'none' as const,
    fontFamily: "Inter, -apple-system, sans-serif",
    fontSize: 13,
    color: '#111',
    outline: 'none',
    boxSizing: 'border-box' as const,
    lineHeight: 1.5,
  },

  // Sections
  sectionSpacing: { padding: '0 0 96px' },

  // Color blocks — DESIGN.md §Color-Block Sections
  // rounded-lg 24px, padding 48px, NO drop shadows
  colorBlock: {
    borderRadius: 24,
    padding: 56,
  },

  // Problem callout
  problemCallout: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    padding: '16px 22px',
    fontSize: 16,
    color: '#7c2d12',
    display: 'inline-block',
  },

  // Three column grid
  threeGrid: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap' as const,
  },

  // Feature cards — hairline bordered, surface-soft bg
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    border: '1px solid #e5e5e0',
    borderRadius: 24,
    overflow: 'hidden',
  },
  featureCard: {
    padding: '36px 32px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e5e5e0',
    borderBottom: '1px solid #e5e5e0',
  },

  // Anchoring tiers (on pink)
  tierGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  tierCard: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 16,
    padding: '22px 24px',
    border: '1px solid rgba(255,255,255,0.7)',
  },

  // Notion property grid (on mint)
  notionPropGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
  },
  notionPropCard: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    padding: '14px 18px',
  },

  // Roadmap (on lime)
  roadmapGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: 16,
  },
  roadmapCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: '22px 24px',
  },

  // Comparison table
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 14,
    marginTop: 8,
  },
  th: {
    padding: '12px 18px',
    textAlign: 'left' as const,
    backgroundColor: '#f5f5f3',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    color: '#52514e',
    borderBottom: '1px solid #e5e5e0',
  },
  td: {
    padding: '14px 18px',
    borderBottom: '1px solid #f0f0eb',
    fontSize: 14,
    color: '#111',
    fontWeight: 330,
  },
  checkYes: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#111', color: '#fff', borderRadius: 9999,
    fontSize: 11, fontWeight: 700, padding: '2px 8px', whiteSpace: 'nowrap' as const,
  },
  checkNo: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f0f0eb', color: '#9ca3af', borderRadius: 9999,
    fontSize: 11, fontWeight: 700, padding: '2px 8px',
  },
  checkWarn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff7db', color: '#92400e', borderRadius: 9999,
    fontSize: 11, fontWeight: 700, padding: '2px 8px', whiteSpace: 'nowrap' as const,
  },

  // Pricing cards
  pricingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 16,
    alignItems: 'start',
  },
  priceCard: {
    border: '1px solid #e5e5e0',
    borderRadius: 24,
    padding: '32px 28px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
    position: 'relative' as const,
    backgroundColor: '#ffffff',
  },
  priceAmount: {
    fontSize: 44,
    fontWeight: 800,
    letterSpacing: '-1.2px',
    color: '#111',
    margin: '12px 0 8px',
    lineHeight: 1,
  },
  featuredBadge: {
    position: 'absolute' as const,
    top: -13,
    right: 24,
    backgroundColor: '#111',
    color: '#fff',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.5px',
    padding: '3px 12px',
    borderRadius: 50,
  },
  featureList: { listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column' as const, gap: 10 },
  featureItem: { display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: '#52514e', lineHeight: 1.4 },
  checkMark: { color: '#111', fontWeight: 800, flexShrink: 0 },

  // FAQ (on lime)
  faqItem: {
    backgroundColor: 'rgba(255,255,255,0.65)',
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
    color: '#111111',
    letterSpacing: '-0.2px',
  },
  faqA: {
    padding: '0 24px 20px',
    fontSize: 15,
    color: '#333333',
    lineHeight: 1.6,
    fontWeight: 330,
  },

  // Footer (inverse-canvas)
  footer: {
    backgroundColor: '#111111',
    color: '#ffffff',
    padding: '80px 0 64px',
    marginTop: 32,
  },
  footerInner: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 48,
    flexWrap: 'wrap' as const,
  },
  footerLogo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  footerLink: {
    display: 'block',
    color: '#a3a3a3',
    textDecoration: 'none',
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 330,
  },
  footerBtn: {
    display: 'block',
    background: 'none',
    border: 'none',
    color: '#a3a3a3',
    padding: 0,
    fontSize: 14,
    marginBottom: 10,
    cursor: 'pointer',
    fontWeight: 330,
    textAlign: 'left' as const,
  },
} as const;

