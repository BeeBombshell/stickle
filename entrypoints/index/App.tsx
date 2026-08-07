import { useState, useRef } from 'preact/hooks';
import { NoteBubble } from '../../components/NoteBubble';
import type { StickleNote, NoteColorBlock } from '../../lib/types';
import { WaitlistForm } from './WaitlistForm';

type FaqItem = { q: string; a: string };

const FAQ_ITEMS = [
  {
    q: 'How does DOM anchoring work if a webpage updates?',
    a: 'Stickle uses a 5-tier anchoring engine: DOM element fingerprint (tag index + text fingerprint), CSS selector, neighbor content hashing, trigram fuzzy text matching, and stored absolute page coordinates as a last resort. If a page is deleted entirely, the note lands in a recoverable tray. You never lose data.',
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

export default function LandingApp() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pkmTab, setPkmTab] = useState<'notion' | 'obsidian' | 'mcp'>('notion');

  // Authentic Stickle Notes state for Landing Page Hero
  const [landingNotes, setLandingNotes] = useState<StickleNote[]>([
    {
      id: 'landing-hero-1',
      url: 'https://docs.github.com/en/get-started',
      pageTitle: 'GitHub Docs',
      content: 'Alt + Click pinned this note directly to the h1 heading. Survives reloads and React re-renders.',
      color: 'lime',
      anchor: { cssSelector: 'h1', offsetX: 0, offsetY: 0, tier: 'selector' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: true,
      tags: ['research', 'github-docs', 'v1.0'],
    },
    {
      id: 'landing-hero-2',
      url: 'https://docs.github.com/en/get-started',
      pageTitle: 'GitHub Docs',
      content: '📌 Synced to Notion in 1 click! Try dragging me by the top header handle (⋮⋮).',
      color: 'lilac',
      anchor: { cssSelector: 'pre.code', offsetX: 0, offsetY: 0, tier: 'text-fragment' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: true,
      tags: ['notion', 'sync', 'local-first'],
    },
    {
      id: 'landing-hero-3',
      url: 'https://docs.github.com/en/get-started',
      pageTitle: 'GitHub Docs',
      content: '⚡️ 5-Tier fingerprint anchoring. Works on Wikipedia, SPAs, news feeds, and docs.',
      color: 'mint',
      anchor: { cssSelector: 'div.fakeArticle', offsetX: 0, offsetY: 0, tier: 'fuzzy' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: true,
      tags: ['resilient', 'anchoring'],
    },
  ]);

  // Position offsets for drag & drop
  const [landingPositions, setLandingPositions] = useState<Record<string, { x: number; y: number }>>({});
  const landingDragRef = useRef<{ noteId: string; startX: number; startY: number } | null>(null);
  const [landingActiveDragId, setLandingActiveDragId] = useState<string | null>(null);

  const handleLandingDragStart = (noteId: string) => {
    const current = landingPositions[noteId] || { x: 0, y: 0 };
    landingDragRef.current = { noteId, startX: current.x, startY: current.y };
    setLandingActiveDragId(noteId);
  };

  const handleLandingDrag = (noteId: string, dx: number, dy: number) => {
    if (!landingDragRef.current || landingDragRef.current.noteId !== noteId) return;
    const newX = landingDragRef.current.startX + dx;
    const newY = landingDragRef.current.startY + dy;
    setLandingPositions(prev => ({
      ...prev,
      [noteId]: { x: newX, y: newY },
    }));
  };

  const handleLandingDragEnd = () => {
    landingDragRef.current = null;
    setLandingActiveDragId(null);
  };

  const addLandingNote = (targetName: string, color: NoteColorBlock) => {
    const newNote: StickleNote = {
      id: `landing-${Date.now()}`,
      url: 'https://docs.github.com/en/get-started',
      pageTitle: 'GitHub Docs',
      content: `Attached to ${targetName}. Try editing text or dragging me around!`,
      color,
      anchor: { cssSelector: targetName, offsetX: 0, offsetY: 0, tier: 'selector' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
      tags: ['interactive', 'demo'],
    };
    setLandingNotes(prev => [...prev, newNote]);
  };

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

      {/* ══ 2. HERO (Signature Lime Accent & Interactive Canvas) ══════════════ */}
      <section style={s.hero}>
        <div style={s.heroGrid}>
          {/* Left Column: Headlines & Actions */}
          <div style={s.heroContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e4f579' }} />
              <span style={s.eyebrow}>STICKLE • V1.0 IS LIVE &amp; OPEN SOURCE</span>
            </div>
            <h1 style={s.displayXL}>
              Leave notes in the<br />margins of the web.
            </h1>
            <p style={s.heroSub}>
              Alt + Click any element on any webpage to drop a sticky note.
              It stays pinned right there: through reloads, re-renders, and revisits:
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
              100% Local-first · Works Offline · No Account Needed · Open Source
            </p>
          </div>

          {/* Right Column: Signature Lime Accent Web Browser Interactive Canvas */}
          <div style={s.heroVisual}>
            {/* Signature Lime Accent Background Panel */}
            <div style={{
              backgroundColor: '#e4f579',
              borderRadius: 24,
              padding: 16,
              border: '1px solid rgba(0,0,0,0.1)',
              transform: 'rotate(1.2deg)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.08)',
            }}>
              {/* Browser Mock Window */}
              <div style={{
                border: '1px solid #111111',
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                transform: 'rotate(-1.2deg)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}>
                {/* Browser Header Bar */}
                <div style={{
                  backgroundColor: '#111111',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {['#ff5f56', '#ffbd2e', '#27c93f'].map(c => (
                        <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c, display: 'inline-block' }} />
                      ))}
                    </div>
                    <div style={{
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      padding: '3px 12px',
                      borderRadius: 50,
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#ffffff',
                      letterSpacing: '0.2px',
                    }}>
                      https://docs.github.com/en/get-started
                    </div>
                  </div>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    backgroundColor: '#e4f579',
                    color: '#111111',
                    padding: '3px 8px',
                    borderRadius: 50,
                    letterSpacing: '0.6px',
                  }}>
                    LIVE DEMO
                  </span>
                </div>

                {/* Simulated Webpage Body */}
                <div style={{
                  padding: '24px 20px',
                  backgroundColor: '#fbfbf9',
                  position: 'relative',
                  minHeight: 340,
                }}>
                  {/* Interactive Element Target 1: Article Heading */}
                  <div
                    onClick={() => addLandingNote('Heading <h1>', 'mint')}
                    title="Click to attach Stickle note to Heading"
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1.5px dashed rgba(0,0,0,0.18)',
                      backgroundColor: '#ffffff',
                      marginBottom: 16,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#666', fontWeight: 600 }}>
                        DOM ELEMENT: &lt;h1.article-title&gt;
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#111', fontWeight: 700, backgroundColor: '#e4f579', padding: '1px 6px', borderRadius: 4 }}>
                        + Click to pin
                      </span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111111', margin: 0, letterSpacing: '-0.4px' }}>
                      Understanding Persistent Web Annotation
                    </h3>
                  </div>

                  {/* Interactive Element Target 2: Code Snippet */}
                  <div
                    onClick={() => addLandingNote('Code snippet', 'pink')}
                    title="Click to attach Stickle note to Code Block"
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1.5px dashed rgba(0,0,0,0.18)',
                      backgroundColor: '#111111',
                      color: '#ffffff',
                      marginBottom: 20,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#e4f579', fontWeight: 600 }}>
                        DOM ELEMENT: &lt;pre.code-block&gt;
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#111', fontWeight: 700, backgroundColor: '#e4f579', padding: '1px 6px', borderRadius: 4 }}>
                        + Click to pin
                      </span>
                    </div>
                    <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#e8d5ff' }}>
                      const note = stickle.attach('#heading', &#123; tier: 'selector' &#125;);
                    </code>
                  </div>

                  {/* Rendered NoteBubbles on top of simulated webpage */}
                  <div style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    left: 16,
                    bottom: 16,
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}>
                    {landingNotes.map((note, idx) => {
                      const pos = landingPositions[note.id] || { x: 0, y: 0 };
                      const isDragging = landingActiveDragId === note.id;

                      return (
                        <div
                          key={note.id}
                          style={{
                            position: 'absolute',
                            top: idx === 0 ? 10 : idx === 1 ? 120 : 60 + idx * 20,
                            right: idx === 0 ? 10 : idx === 1 ? 20 : 30 + idx * 10,
                            transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                            zIndex: isDragging ? 50 : 5 + idx,
                            pointerEvents: 'auto',
                            filter: isDragging ? 'drop-shadow(0 16px 32px rgba(0,0,0,0.25))' : 'drop-shadow(0 8px 20px rgba(0,0,0,0.12))',
                          }}
                        >
                          <NoteBubble
                            note={note}
                            onSave={(val) => setLandingNotes(prev => prev.map(n => n.id === note.id ? { ...n, content: val } : n))}
                            onColorChange={(col) => setLandingNotes(prev => prev.map(n => n.id === note.id ? { ...n, color: col } : n))}
                            onBorderStyleChange={(bs) => setLandingNotes(prev => prev.map(n => n.id === note.id ? { ...n, borderStyle: bs } : n))}
                            onToggleCollapse={(coll) => setLandingNotes(prev => prev.map(n => n.id === note.id ? { ...n, collapsed: coll } : n))}
                            onTagsChange={(tags) => setLandingNotes(prev => prev.map(n => n.id === note.id ? { ...n, tags } : n))}
                            onDelete={() => setLandingNotes(prev => prev.filter(n => n.id !== note.id))}
                            onDragStart={() => handleLandingDragStart(note.id)}
                            onDrag={(dx, dy) => handleLandingDrag(note.id, dx, dy)}
                            onDragEnd={handleLandingDragEnd}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Drag Instruction Banner */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid #e5e5e0',
                  }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#111111',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      🖐 GRAB TOP HEADER (⋮⋮) TO DRAG &amp; PLACE
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      color: '#64748b',
                    }}>
                      {landingNotes.length} notes active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 3. PROBLEM (White block with crisp hairline border) ════════════════ */}
      <section style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={{ ...s.colorBlock, backgroundColor: '#ffffff', color: '#111111', border: '1px solid #e5e5e0', padding: '56px 48px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <span style={{ ...s.eyebrow, color: '#111111', marginBottom: 12 }}>THE BROKEN WORKFLOW</span>
            <h2 style={{ ...s.displayLg, color: '#111111', maxWidth: 860 }}>
              Stop losing your thinking<br />in app-switching context collapse.
            </h2>
            <p style={{ fontSize: 20, fontWeight: 330, lineHeight: 1.4, letterSpacing: '-0.14px', color: '#111111', maxWidth: 720, margin: '0 0 28px' }}>
              You read something interesting, have a thought, then alt-tab to Notion, lose the reading
              flow, and paste a raw URL you will never fully remember.
              Highlighters only capture text you select. Web clippers save the page, not your thinking.
            </p>
            <div style={{ ...s.problemCallout, backgroundColor: '#e4f579', color: '#111111', border: '1px solid rgba(0,0,0,0.08)' }}>
              <strong>Stickle closes the gap:</strong>&nbsp;write floating notes directly on the webpage, right where your thoughts happen.
            </div>
          </div>
        </div>
      </section>

      {/* ══ 4. VALUE PROPS (Black block container with high-contrast white cards) ═════════ */}
      <section id="features" style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={{ ...s.colorBlock, backgroundColor: '#111111', color: '#ffffff', padding: '56px 48px' }}>
            <span style={{ ...s.eyebrow, color: '#e4f579', marginBottom: 12 }}>WHY STICKLE IS DIFFERENT</span>
            <h2 style={{ ...s.displayLg, color: '#ffffff', maxWidth: 640, marginBottom: 44 }}>
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
                  headline: 'A 5-tier anchoring engine keeps notes in place.',
                  body: 'Stickle survives React re-renders, Wikipedia DOM mutations, and layout shifts using DOM element fingerprinting, CSS selectors, content hashing, and trigram fuzzy matching.',
                },
                {
                  eyebrow: 'INTO NOTION, INSTANTLY',
                  headline: 'Push your research to Notion in one click.',
                  body: 'Batch-export all unsynced notes with source URL, page title, and timestamps into your existing Notion database.',
                },
              ].map(prop => (
                <div
                  key={prop.eyebrow}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#111111',
                    borderRadius: 20,
                    flex: 1,
                    minWidth: 260,
                    padding: '36px 32px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        color: '#111111',
                        backgroundColor: '#e4f579',
                        padding: '3px 10px',
                        borderRadius: 50,
                        marginBottom: 16,
                        display: 'inline-block',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                      }}
                    >
                      {prop.eyebrow}
                    </span>
                    <h3 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.3px', color: '#111111', margin: '14px 0 12px' }}>
                      {prop.headline}
                    </h3>
                    <p style={{ fontSize: 15, fontWeight: 330, lineHeight: 1.55, color: '#111111', margin: 0 }}>
                      {prop.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
                title: 'Seven signature pastel colors.',
                body: 'Lime, sky blue, lilac, cream, mint, pink, coral: each with a crisp monochrome frame that reads on light and dark pages without competing with the site.',
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
                <h3 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.2px', color: '#111111', margin: '0 0 10px' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: 15, fontWeight: 330, lineHeight: 1.55, color: '#111111', margin: 0 }}>
                  {feat.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ══ 6. ANCHORING ENGINE (White block, borderless, distinct pastel tier cards) ═ */}
      <section id="anchoring" style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={{ ...s.colorBlock, backgroundColor: '#ffffff', color: '#111111', border: 'none', padding: '56px 48px' }}>
            <span style={{ ...s.eyebrow, color: '#111111', marginBottom: 12 }}>5-TIER ANCHORING ENGINE</span>
            <h2 style={{ ...s.displayLg, color: '#111111', marginBottom: 16 }}>Never lose a note.</h2>
            <p style={{ fontSize: 18, fontWeight: 330, lineHeight: 1.45, letterSpacing: '-0.26px', color: '#111111', maxWidth: 640, margin: '0 0 36px' }}>
              Single-method highlighters break when DOM trees shift. Stickle combines five independent fallback tiers so your notes always find their home — even on Wikipedia articles, SPAs, and live feeds.
            </p>

            <div style={s.tierGrid}>
              {[
                {
                  badge: 'TIER 0: FINGERPRINT',
                  title: 'DOM element fingerprint',
                  desc: 'O(1) lookup by element index + text fingerprint. Uniquely identifies any <p> on Wikipedia even among hundreds of siblings.',
                  badgeBg: '#111111',
                  badgeColor: '#ffffff',
                  cardBg: '#e4f579',
                  cardBorder: '1px solid rgba(0,0,0,0.08)',
                  textColor: '#111111',
                  descColor: '#111111',
                  iconBg: '#ffffff',
                  strokeColor: '#111111',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12C6.477 12 10 8.477 10 4M22 12c-4.477 0-8 3.523-8 8M12 2a10 10 0 0 1 10 10M12 22A10 10 0 0 1 2 12" />
                    </svg>
                  ),
                },
                {
                  badge: 'TIER 1: EXACT',
                  title: 'CSS selector match',
                  desc: 'Attaches directly to the target element using an optimized selector chain. Instant on stable pages and docs.',
                  badgeBg: '#111111',
                  badgeColor: '#ffffff',
                  cardBg: '#f8f8f6',
                  cardBorder: '1px solid #e5e5e0',
                  textColor: '#111111',
                  descColor: '#555',
                  iconBg: '#ffffff',
                  strokeColor: '#111111',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                  badgeBg: '#e4f579',
                  badgeColor: '#111111',
                  cardBg: '#111111',
                  cardBorder: '1px solid rgba(255,255,255,0.15)',
                  textColor: '#ffffff',
                  descColor: '#d4d4d8',
                  iconBg: '#1c1c1e',
                  strokeColor: '#e4f579',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e4f579" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  ),
                },
                {
                  badge: 'TIER 3: FUZZY',
                  title: 'Handles layout refactors',
                  desc: 'Scans page text nodes to relocate notes even if HTML structure or CSS styling changes completely.',
                  badgeBg: '#111111',
                  badgeColor: '#ffffff',
                  cardBg: '#f8f8f6',
                  cardBorder: '1px solid #e5e5e0',
                  textColor: '#111111',
                  descColor: '#111111',
                  iconBg: '#ffffff',
                  strokeColor: '#111111',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  ),
                },
              ].map(t => (
                <div
                  key={t.title}
                  style={{
                    backgroundColor: t.cardBg,
                    borderRadius: 20,
                    padding: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: t.cardBorder,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.04)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        {t.icon}
                      </div>
                      <span
                        style={{
                          ...s.eyebrow,
                          fontSize: 9,
                          color: t.badgeColor,
                          backgroundColor: t.badgeBg,
                          padding: '4px 10px',
                          borderRadius: 50,
                          fontWeight: 700,
                        }}
                      >
                        {t.badge}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.25, color: t.textColor, margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                      {t.title}
                    </h3>
                    <p style={{ fontSize: 14, fontWeight: 330, lineHeight: 1.55, color: t.descColor, margin: 0 }}>
                      {t.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 7. KNOWLEDGE BASE SYNC (Monochrome Dark block + Lime Accents) ══════════════════ */}
      <section style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={{ ...s.colorBlock, backgroundColor: '#111111', color: '#ffffff', padding: '48px 48px' }}>
            
            {/* Header Flex Layout with Sync-Flow Animation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 40, marginBottom: 36, flexWrap: 'wrap' }}>
              <div style={{ maxWidth: 640 }}>
                <span style={{ ...s.eyebrow, color: '#e4f579', marginBottom: 12 }}>KNOWLEDGE BASE SYNC</span>
                <h2 style={{ ...s.displayLg, color: '#ffffff', margin: '0 0 16px' }}>
                  Export your web thoughts<br />directly to your Second Brain.
                </h2>
                <p style={{ fontSize: 18, fontWeight: 330, lineHeight: 1.45, letterSpacing: '-0.26px', color: '#d4d4d8', margin: 0 }}>
                  No more lost tabs or forgotten bookmarks. Connect your web annotations directly to Notion, Obsidian, or your local AI notes in one click.
                </p>
              </div>

              {/* ── Sync-Flow Animation: notes flying to Notion / Obsidian / AI ── */}
              <div style={{ flex: '1 1 320px', minWidth: 300, maxWidth: 380, position: 'relative', height: 220 }}>
                {/* ambient glow */}
                <div className="sync-glow" style={{ position: 'absolute', left: '10%', top: '50%', marginTop: -80, width: 160, height: 160, borderRadius: '50%', backgroundColor: '#e4f579', pointerEvents: 'none' }} />

                {/* ── SVG connector lines — strictly Lime & White Monochrome ── */}
                <svg width="100%" height="220" viewBox="0 0 380 220" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  {/* line to Notion — Lime */}
                  <path className="sync-connector" d="M 130 70 C 200 70 240 45 295 38" fill="none" stroke="#e4f579" strokeWidth="1.8" strokeLinecap="round" />
                  {/* line to Obsidian — White */}
                  <path className="sync-connector sync-connector-2" d="M 130 110 C 210 110 250 110 295 108" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                  {/* line to AI — Lime */}
                  <path className="sync-connector sync-connector-3" d="M 130 150 C 200 150 240 170 295 178" fill="none" stroke="#e4f579" strokeWidth="1.8" strokeLinecap="round" />
                </svg>

                {/* ── SOURCE: 3 bobbing sticky notes in Monochrome + Lime palette ── */}
                {/* Note 1 – Signature Lime Accent */}
                <div className="sync-note-1" style={{ position: 'absolute', left: 0, top: 38, width: 110, backgroundColor: '#e4f579', borderRadius: 10, padding: '8px 10px', boxShadow: '0 6px 20px rgba(228,245,121,0.25)', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: '#111', marginBottom: 4, opacity: 0.7 }}>stickle://note</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#111', lineHeight: 1.4 }}>Found great insight on page 3!</div>
                </div>
                {/* Note 2 – Sleek White */}
                <div className="sync-note-2" style={{ position: 'absolute', left: 8, top: 94, width: 110, backgroundColor: '#ffffff', borderRadius: 10, padding: '8px 10px', boxShadow: '0 6px 20px rgba(255,255,255,0.15)', border: '1px solid #e5e5e0' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: '#111', marginBottom: 4, opacity: 0.7 }}>stickle://note</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#111', lineHeight: 1.4 }}>Review this API pattern later</div>
                </div>
                {/* Note 3 – Monochrome Dark with Lime Border */}
                <div className="sync-note-3" style={{ position: 'absolute', left: 2, top: 152, width: 110, backgroundColor: '#1c1c1e', borderRadius: 10, padding: '8px 10px', boxShadow: '0 6px 20px rgba(0,0,0,0.4)', border: '1px solid #e4f579' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: '#e4f579', marginBottom: 4 }}>stickle://note</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>Ask AI about this approach</div>
                </div>

                {/* ── FLYING PARTICLES — strictly Lime and White Monochrome SVG Icons ── */}
                <div className="sync-fly-1" style={{ position: 'absolute', left: 110, top: 58, width: 22, height: 22, backgroundColor: '#e4f579', borderRadius: 6, border: '1.5px solid #111111', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(228,245,121,0.4)' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="sync-fly-2" style={{ position: 'absolute', left: 110, top: 100, width: 22, height: 22, backgroundColor: '#ffffff', borderRadius: 6, border: '1.5px solid #111111', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(255,255,255,0.3)' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="sync-fly-3" style={{ position: 'absolute', left: 110, top: 142, width: 22, height: 22, backgroundColor: '#e4f579', borderRadius: 6, border: '1.5px solid #111111', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(228,245,121,0.4)' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>

                {/* ── DESTINATIONS: Notion, Obsidian, AI — Lime & White Monochrome ── */}
                {/* Notion (Lime) */}
                <div className="sync-target-notion" style={{ position: 'absolute', right: 0, top: 12, width: 76, borderRadius: 14, backgroundColor: '#1c1c1e', border: '2px solid #e4f579', padding: '10px 8px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 5 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e4f579" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="M9 9h6M9 12h6M9 15h4" />
                  </svg>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: '#e4f579', letterSpacing: '0.5px' }}>NOTION</span>
                </div>
                {/* Obsidian (White Monochrome) */}
                <div className="sync-target-obsidian" style={{ position: 'absolute', right: 0, top: 84, width: 76, borderRadius: 14, backgroundColor: '#1c1c1e', border: '2px solid #ffffff', padding: '10px 8px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 5 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: '#ffffff', letterSpacing: '0.5px' }}>OBSIDIAN</span>
                </div>
                {/* AI (Lime Accent) */}
                <div className="sync-target-ai" style={{ position: 'absolute', right: 0, top: 154, width: 76, borderRadius: 14, backgroundColor: '#1c1c1e', border: '2px solid #e4f579', padding: '10px 8px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 5 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e4f579" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  </svg>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: '#e4f579', letterSpacing: '0.5px' }}>AI CHAT</span>
                </div>
              </div>
            </div>

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
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    backgroundColor: pkmTab === tab.id ? '#e4f579' : '#27272a',
                    color: pkmTab === tab.id ? '#111111' : '#a1a1aa',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Preview Box — dark surface on black block */}
            <div style={{ backgroundColor: '#18181b', borderRadius: 16, padding: 24, marginBottom: 28, border: '1px solid #27272a' }}>
              {pkmTab === 'notion' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #27272a' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e4f579" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#e4f579' }}>Notion Database Entry • Automatic Field Mapping</span>
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
                      <div key={p.label} style={{ ...s.notionPropCard, backgroundColor: '#27272a', border: '1px solid #3f3f46' }}>
                        <span style={{ ...s.eyebrow, fontSize: 9, color: '#e4f579', marginBottom: 4, display: 'block' }}>{p.label}</span>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', margin: 0 }}>{p.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pkmTab === 'obsidian' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8d5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#e8d5ff' }}>Clean `.md` Export with YAML Frontmatter &amp; [[WikiLinks]]</span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#e8d5ff', lineHeight: 1.6, backgroundColor: '#09090b', padding: 16, borderRadius: 12, border: '1px solid #27272a' }}>
                    <div style={{ color: '#a1a1aa', fontWeight: 700 }}>---</div>
                    <div>title: "Persistent Web Annotation"</div>
                    <div>url: "https://docs.github.com/en/get-started"</div>
                    <div>created: "2026-08-06T01:50:00Z"</div>
                    <div style={{ color: '#a1a1aa', fontWeight: 700 }}>---</div>
                    <br />
                    <div style={{ fontWeight: 700, color: '#ffffff' }}># [[Persistent Web Annotation]]</div>
                    <div style={{ color: '#d4d4d8' }}>Stickle attaches sticky notes directly to web page elements. Notes persist across reloads.</div>
                  </div>
                </div>
              )}

              {pkmTab === 'mcp' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#bae6fd' }}>Live Context Feed for Claude Desktop, Cursor &amp; ChatGPT</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.55 }}>
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
                  badgeColor: '#e4f579',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e4f579" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  badgeColor: '#e8d5ff',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8d5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  ),
                },
                {
                  title: 'AI Assistant Context',
                  desc: 'Feed your web annotations into AI tools so your assistant remembers what you read.',
                  badge: 'AI READY',
                  badgeColor: '#bae6fd',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    </svg>
                  ),
                },
                {
                  title: '100% Private & Local',
                  desc: 'Your data stays on device in local storage. Notion sync connects directly to Notion.',
                  badge: 'LOCAL-FIRST',
                  badgeColor: '#e4f579',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e4f579" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ),
                },
              ].map(item => (
                <div key={item.title} style={{ backgroundColor: '#18181b', borderRadius: 16, padding: 20, border: '1px solid #27272a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.icon}
                    </div>
                    <span style={{ ...s.eyebrow, fontSize: 9, color: item.badgeColor, fontWeight: 700 }}>{item.badge}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>{item.title}</h3>
                  <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                </div>
              ))}

            </div>
          </div>
        </div>
      </section>

      {/* ══ 8. ROADMAP (off-white colorBlock with animated road highway graphic) ══════ */}
      <section id="roadmap" style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={{ ...s.colorBlock, backgroundColor: '#f8f8f6', border: '1px solid #e5e5e0', padding: '48px 48px' }}>
            <span style={{ ...s.eyebrow, color: '#52514e', marginBottom: 12 }}>PRODUCT ROADMAP</span>
            <h2 style={{ ...s.displayLg, color: '#111111', maxWidth: 700 }}>
              The cloud &amp; AI layer<br />is being built next.
            </h2>
            <p style={{ fontSize: 18, fontWeight: 330, lineHeight: 1.45, letterSpacing: '-0.26px', color: '#52514e', maxWidth: 620, margin: '0 0 32px' }}>
              v1.0 is live as a 100% local-first tool. Here is our roadmap for cross-device syncing, team collaboration, and AI context:
            </p>

            {/* ── Cute Animated Road Track Graphic ── */}
            <div style={{
              backgroundColor: '#18181b',
              borderRadius: 20,
              padding: '24px 28px',
              marginBottom: 32,
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid #27272a',
              boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            }}>
              {/* Road Banner Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#e4f579', letterSpacing: '0.8px' }}>
                  🛣️ STICKLE DEVELOPMENT HIGHWAY
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#a1a1aa', letterSpacing: '0.4px' }}>
                  CRUISE FROM LOCAL-FIRST TO AI ECOSYSTEM
                </span>
              </div>

              {/* Animated Road Asphalt Surface */}
              <div style={{
                height: 76,
                backgroundColor: '#09090b',
                borderRadius: 14,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                border: '1.5px solid #27272a',
                overflow: 'hidden',
              }}>
                {/* SVG Lanes & Boundaries */}
                <svg width="100%" height="76" viewBox="0 0 1000 76" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                  <line x1="0" y1="6" x2="1000" y2="6" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.25" />
                  <line x1="0" y1="70" x2="1000" y2="70" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.25" />
                  <line x1="0" y1="38" x2="1000" y2="38" stroke="#e4f579" strokeWidth="3" strokeDasharray="14,14" className="road-dashed-line" />
                </svg>

                {/* Driving Stickle Car Mascot — continuous off-screen right travel */}
                <div className="road-sticky-car" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} title="Stickle Note Car cruising to the future!">
                  <div className="road-car-body" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="44" height="24" viewBox="0 0 44 24" fill="none">
                      <rect x="2" y="8" width="40" height="11" rx="4" fill="#e4f579" stroke="#111111" strokeWidth="1.5" />
                      <path d="M12 8 L17 2 L28 2 L33 8 Z" fill="#e4f579" stroke="#111111" strokeWidth="1.5" />
                      <path d="M14 7 L18 3 L24 3 L24 7 Z" fill="#111111" opacity="0.8" />
                      <path d="M26 3 L31 7 L26 7 Z" fill="#111111" opacity="0.8" />
                      <circle cx="40" cy="12" r="1.5" fill="#ffffff" stroke="#111111" strokeWidth="1" />
                      <circle cx="11" cy="19" r="3.5" fill="#111111" />
                      <circle cx="11" cy="19" r="1.2" fill="#ffffff" />
                      <circle cx="33" cy="19" r="3.5" fill="#111111" />
                      <circle cx="33" cy="19" r="1.2" fill="#ffffff" />
                    </svg>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#111111',
                      backgroundColor: '#e4f579',
                      padding: '2px 6px',
                      borderRadius: 4,
                      border: '1px solid #111111',
                      boxShadow: '0 2px 8px rgba(228,245,121,0.4)',
                      whiteSpace: 'nowrap',
                    }}>
                      📌 stickle
                    </span>
                  </div>
                </div>

                {/* Milestone Markers on the road */}
                {[
                  { pos: '6%', label: '🏁 V1.0 LIVE', active: true },
                  { pos: '32%', label: '☁️ Q3 2026', active: false },
                  { pos: '62%', label: '👥 Q4 2026', active: false },
                  { pos: '88%', label: '🚀 FUTURE', active: false },
                ].map((m) => (
                  <div
                    key={m.label}
                    className={m.active ? 'road-pin-pulse' : ''}
                    style={{
                      position: 'absolute',
                      left: m.pos,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: m.active ? '#e4f579' : '#27272a',
                      color: m.active ? '#111111' : '#ffffff',
                      border: m.active ? '1.5px solid #111111' : '1px solid rgba(255,255,255,0.2)',
                      padding: '4px 10px',
                      borderRadius: 50,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      zIndex: 5,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* 4-Card Responsive Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              {[
                {
                  badge: 'NOW • V1.0',
                  title: 'Instant Web Notes',
                  desc: 'Drop floating sticky notes on any webpage. Fully offline, local storage, and 1-click Notion export.',
                  badgeBg: '#e4f579',
                  badgeColor: '#111111',
                  iconBg: '#e4f579',
                  iconStroke: '#111111',
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
                  badgeBg: '#27272a',
                  badgeColor: '#a1a1aa',
                  iconBg: '#27272a',
                  iconStroke: '#ffffff',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                      <path d="M12 13l-3-3m0 0l3-3m-3 3h8" />
                    </svg>
                  ),
                },
                {
                  badge: 'SOON • Q4 2026',
                  title: 'Team Workspaces',
                  desc: 'Share annotated web pages with your team. Discuss articles, documentation, and PRs right where they live.',
                  badgeBg: '#27272a',
                  badgeColor: '#a1a1aa',
                  iconBg: '#27272a',
                  iconStroke: '#ffffff',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  badgeBg: '#27272a',
                  badgeColor: '#a1a1aa',
                  iconBg: '#27272a',
                  iconStroke: '#ffffff',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    border: '1px solid #e5e5e0',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.icon}
                      </div>
                      <span
                        style={{
                          ...s.eyebrow,
                          fontSize: 9,
                          color: item.badgeColor,
                          backgroundColor: item.badgeBg,
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

      {/* ══ 9. COMPARISON (Wrapped in Signature Lime ColorBlock Container) ═════════════════════════════════════ */}
      <section id="comparison" style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={{ ...s.colorBlock, backgroundColor: '#e4f579', color: '#111111', padding: '56px 48px' }}>
            <span style={{ ...s.eyebrow, color: '#111111', fontWeight: 700, marginBottom: 12 }}>FEATURE COMPARISON</span>
            <h2 style={{ ...s.displayLg, color: '#111111', maxWidth: 600, marginBottom: 36 }}>
              Stickle vs alternative tools.
            </h2>
            <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Feature</th>
                      <th style={{ ...s.th, backgroundColor: '#111111', color: '#e4f579', fontWeight: 800, fontSize: 13 }}>★ Stickle</th>
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
                          <td key={i} style={{ ...s.td, textAlign: 'center' as const, backgroundColor: i === 0 ? 'rgba(228,245,121,0.12)' : 'transparent' }}>
                            {v === '✓' || (typeof v === 'string' && v.startsWith('✓')) ? (
                              <span style={{ ...s.checkYes, backgroundColor: i === 0 ? '#111111' : '#111111', color: i === 0 ? '#e4f579' : '#ffffff' }}>{v}</span>
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
          </div>
        </div>
      </section>

      {/* ══ 10. PRICING (Signature Lime for Early Access) ════════════════════ */}
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

            {/* Pro Supporter (Lime featured card) */}
            <div style={{ ...s.priceCard, backgroundColor: '#111111', color: '#ffffff', border: '2px solid #e4f579', position: 'relative' as const }}>
              <span style={{ ...s.featuredBadge, backgroundColor: '#e4f579', color: '#111111' }}>EARLY ACCESS</span>
              <span style={{ ...s.eyebrow, color: '#e4f579' }}>PRO SUPPORTER</span>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', margin: '8px 0 4px', letterSpacing: '-0.3px' }}>Supporter Access</h3>
              <div style={{ ...s.priceAmount, color: '#ffffff' }}>
                $29 <span style={{ fontSize: 15, fontWeight: 400, color: '#a1a1aa' }}>one-time</span>
              </div>
              <p style={{ fontSize: 14, color: '#a1a1aa', margin: '0 0 24px', lineHeight: 1.5 }}>
                Support open source + unlock cloud features when they ship.
              </p>
              <ul style={s.featureList}>
                {['Everything in Free Core', 'Cross-device cloud sync', 'Central web dashboard', 'Remote MCP server for AI context', 'Priority feature requests'].map(f => (
                  <li key={f} style={{ ...s.featureItem, color: '#ffffff' }}>
                    <span style={{ ...s.checkMark, color: '#e4f579' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                style={{ ...s.btnPrimary, width: '100%', marginTop: 'auto', backgroundColor: '#e4f579', color: '#111111' }}
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

      {/* ══ 10.5 DEDICATED WAITLIST SECTION (High Contrast Black Block: #111111) ══ */}
      <section id="waitlist" style={s.sectionSpacing}>
        <div style={s.wrap}>
          <div style={{ ...s.colorBlock, backgroundColor: '#111111', padding: '56px 48px', textAlign: 'center' as const, color: '#ffffff' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <span style={{ ...s.eyebrow, color: '#e4f579', marginBottom: 12 }}>EXTENSION ROLLOUT</span>
              <h2 style={{ ...s.displayLg, color: '#ffffff', margin: '0 0 16px' }}>
                Be first in line when Stickle launches.
              </h2>
              <p style={{ fontSize: 18, fontWeight: 330, lineHeight: 1.5, color: '#a1a1aa', margin: '0 0 28px' }}>
                We are preparing the extension for public release. Join the waitlist to receive an email notification the exact moment early access builds are live.
              </p>
              <div>
                <a
                  href="/waitlist.html"
                  style={{ ...s.btnPrimary, backgroundColor: '#e4f579', color: '#111111', fontSize: 16, padding: '14px 32px', textDecoration: 'none', display: 'inline-block' }}
                >
                  Join Rollout Waitlist ↗
                </a>
              </div>
              <div style={{ marginTop: 20 }}>
                <span style={{ ...s.eyebrow, fontSize: 11, color: '#a1a1aa', letterSpacing: '0.8px' }}>
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
              style={{ ...s.btnSecondary, fontSize: 16, padding: '14px 28px', textDecoration: 'none', gap: 8 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Star on GitHub
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
  hero: { padding: '72px 0 88px', maxWidth: 1280, margin: '0 auto', paddingLeft: 32, paddingRight: 32 },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 48,
    alignItems: 'center',
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
  },
  heroVisual: {
    position: 'relative' as const,
    width: '100%',
  },
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
    margin: '0 0 0',
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

