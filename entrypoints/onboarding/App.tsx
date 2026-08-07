import { useState, useRef } from 'preact/hooks';
import { NoteBubble } from '../../components/NoteBubble';
import type { StickleNote, NoteColorBlock } from '../../lib/types';

export default function OnboardingApp() {
  // Authentic Stickle Notes for Interactive Sandbox (STEP 2)
  const [sandboxNotes, setSandboxNotes] = useState<StickleNote[]>([
    {
      id: 'sandbox-1',
      url: 'https://stickle.app/onboarding',
      pageTitle: 'Interactive Sandbox',
      content: 'Hold Alt and click any element on a webpage. Your note attaches right there.',
      color: 'lime',
      anchor: { cssSelector: '#sandbox-el-1', offsetX: 0, offsetY: 0, tier: 'selector' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: true,
      tags: ['sandbox', 'tutorial'],
    },
    {
      id: 'sandbox-2',
      url: 'https://stickle.app/onboarding',
      pageTitle: 'Interactive Sandbox',
      content: 'Notes survive React re-renders, page reloads, and tab closes.',
      color: 'lilac',
      anchor: { cssSelector: '#sandbox-el-2', offsetX: 0, offsetY: 0, tier: 'text-fragment' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: true,
      tags: ['sync', 'reload-safe'],
    },
  ]);

  // Drag position map for Sandbox notes
  const [sandboxPositions, setSandboxPositions] = useState<Record<string, { x: number; y: number }>>({});
  const sandboxDragRef = useRef<{ noteId: string; startX: number; startY: number } | null>(null);
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);

  const handleSandboxDragStart = (noteId: string) => {
    const current = sandboxPositions[noteId] || { x: 0, y: 0 };
    sandboxDragRef.current = { noteId, startX: current.x, startY: current.y };
    setActiveDraggingId(noteId);
  };

  const handleSandboxDrag = (noteId: string, dx: number, dy: number) => {
    if (!sandboxDragRef.current || sandboxDragRef.current.noteId !== noteId) return;
    const newX = sandboxDragRef.current.startX + dx;
    const newY = sandboxDragRef.current.startY + dy;
    setSandboxPositions(prev => ({
      ...prev,
      [noteId]: { x: newX, y: newY },
    }));
  };

  const handleSandboxDragEnd = () => {
    sandboxDragRef.current = null;
    setActiveDraggingId(null);
  };

  // Authentic Stickle Notes for Hero Section (matching actual extension NoteBubble)
  const [heroNote1, setHeroNote1] = useState<StickleNote>({
    id: 'hero-note-1',
    url: 'https://stickle.app/onboarding',
    pageTitle: 'Stickle Onboarding',
    content: 'Hold Alt and click anywhere on any webpage: a heading, code block, or image. Your note pins right there!',
    color: 'lime',
    anchor: {
      cssSelector: 'h1.displayXL',
      offsetX: 0,
      offsetY: 0,
      tier: 'selector',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    syncedToNotion: true,
    tags: ['alt-click', 'web-margins', 'v1.0'],
  });

  const [heroNote2, setHeroNote2] = useState<StickleNote>({
    id: 'hero-note-2',
    url: 'https://stickle.app/onboarding',
    pageTitle: 'Stickle Onboarding',
    content: 'Notes survive React re-renders, page reloads, and export straight to Notion with 1 click!',
    color: 'lilac',
    anchor: {
      cssSelector: 'p.bodyLg',
      offsetX: 0,
      offsetY: 0,
      tier: 'text-fragment',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    syncedToNotion: true,
    tags: ['notion', 'sync', 'local-first'],
  });

  // Position offsets for Hero notes dragging
  const [hero1Pos, setHero1Pos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hero2Pos, setHero2Pos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const heroDragRef = useRef<{ noteId: string; startX: number; startY: number } | null>(null);

  const handleHeroDragStart = (noteId: string) => {
    const start = noteId === 'hero-note-1' ? hero1Pos : hero2Pos;
    heroDragRef.current = { noteId, startX: start.x, startY: start.y };
    setActiveDraggingId(noteId);
  };

  const handleHeroDrag = (noteId: string, dx: number, dy: number) => {
    if (!heroDragRef.current || heroDragRef.current.noteId !== noteId) return;
    const newX = heroDragRef.current.startX + dx;
    const newY = heroDragRef.current.startY + dy;
    if (noteId === 'hero-note-1') {
      setHero1Pos({ x: newX, y: newY });
    } else {
      setHero2Pos({ x: newX, y: newY });
    }
  };

  const handleHeroDragEnd = () => {
    heroDragRef.current = null;
    setActiveDraggingId(null);
  };

  const [isHeroHovered, setIsHeroHovered] = useState<boolean>(false);

  const spawnSandboxNote = () => {
    const colorKeys: NoteColorBlock[] = ['lime', 'lilac', 'cream', 'mint', 'pink', 'coral'];
    const color = colorKeys[sandboxNotes.length % colorKeys.length];
    const newId = `sandbox-${Date.now()}`;
    const newNote: StickleNote = {
      id: newId,
      url: 'https://stickle.app/onboarding',
      pageTitle: 'Interactive Sandbox',
      content: 'Edit or drag this note — it stays right where you drop it!',
      color,
      anchor: { cssSelector: '.sandbox-item', offsetX: 0, offsetY: 0, tier: 'selector' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
      tags: ['sandbox', 'draggable'],
    };
    setSandboxNotes(prev => [...prev, newNote]);
  };

  const deleteSandboxNote = (id: string) => {
    setSandboxNotes(prev => prev.filter(n => n.id !== id));
  };

  const openLandingPage = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    } else {
      window.open('/', '_blank');
    }
  };

  const openPrivacyPage = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
    } else {
      window.open('/privacy.html', '_blank');
    }
  };

  return (
    <div style={s.page}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.logoLockup}>
            <div style={s.logoMark}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="14" cy="14" r="5" fill="white" opacity="0.9" />
                <circle cx="14" cy="14" r="2" fill="#111" />
              </svg>
            </div>
            <span style={s.wordmark}>stickle</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a href="https://github.com/BeeBombshell/stickle" target="_blank" rel="noreferrer" style={s.navLink}>
              GitHub ↗
            </a>
            <button style={s.btnSecondary} onClick={openPrivacyPage}>Privacy Policy</button>
            <button style={s.btnSecondary} onClick={openLandingPage}>Product page</button>
            <button style={s.btnPrimary} onClick={() => window.close()}>Start annotating</button>
          </div>
        </div>
      </nav>

      {/* ── HERO WITH AUTHENTIC PLAYFUL STICKLE NOTE STACK ──────────────── */}
      <section style={s.hero}>
        <div style={s.heroGrid}>
          {/* Left Column: Headline & Action */}
          <div style={s.heroContent}>
            <span style={s.eyebrow}>STICKLE • V1.0 • WELCOME</span>
            <h1 style={s.displayXL}>
              Leave notes in the<br />margins of the web.
            </h1>
            <p style={s.bodyLg}>
              You just installed Stickle. Hold <kbd style={s.kbd}>Alt</kbd> and click anything on any webpage:
              a heading, a code block, an image. A sticky note pins right there and stays,
              even when the page re-renders.
            </p>

            <div style={s.ctaRow}>
              <button style={s.btnPrimary} onClick={() => window.close()}>
                Start taking notes
              </button>
              <button style={s.btnSecondary} onClick={openLandingPage}>
                View product page
              </button>
            </div>
            <p style={s.trustLine}>
              100% local-first · No account needed · Works offline · Open source
            </p>
          </div>

          {/* Right Column: Playful Sticky Note Hero Graphic matching actual NoteBubble design */}
          <div style={s.heroVisual}>
            {/* Floating Pill Badge Top Right */}
            <div style={{
              position: 'absolute',
              top: -8,
              right: 12,
              zIndex: 10,
              backgroundColor: '#111111',
              color: '#ffffff',
              padding: '5px 14px',
              borderRadius: 50,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.6px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              userSelect: 'none',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#e4f579' }} />
              ALT + CLICK ANYWHERE
            </div>

            {/* Floating Pill Badge Bottom Left */}
            <div style={{
              position: 'absolute',
              bottom: 4,
              left: 4,
              zIndex: 10,
              backgroundColor: '#ffffff',
              color: '#111111',
              border: '1px solid #e5e5e0',
              padding: '5px 14px',
              borderRadius: 50,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.6px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
              userSelect: 'none',
            }}>
              ⚡️ 3-TIER ANCHORED
            </div>

            {/* Collage Note Stack */}
            <div
              onMouseEnter={() => setIsHeroHovered(true)}
              onMouseLeave={() => setIsHeroHovered(false)}
              style={{
                position: 'relative',
                width: 320,
                minHeight: 280,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* Background Stacked NoteBubble (Lilac, Tier 2 Fragment border) */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: activeDraggingId === 'hero-note-2' ? 50 : 1,
                transform: isHeroHovered
                  ? `rotate(-6.5deg) translate3d(${-20 + hero2Pos.x}px, ${12 + hero2Pos.y}px, 0)`
                  : `rotate(-5deg) translate3d(${-14 + hero2Pos.x}px, ${8 + hero2Pos.y}px, 0)`,
                transition: activeDraggingId === 'hero-note-2' ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                opacity: 0.94,
              }}>
                <NoteBubble
                  note={heroNote2}
                  onSave={(val) => setHeroNote2(prev => ({ ...prev, content: val }))}
                  onColorChange={(col) => setHeroNote2(prev => ({ ...prev, color: col }))}
                  onBorderStyleChange={(bs) => setHeroNote2(prev => ({ ...prev, borderStyle: bs }))}
                  onToggleCollapse={(coll) => setHeroNote2(prev => ({ ...prev, collapsed: coll }))}
                  onTagsChange={(tags) => setHeroNote2(prev => ({ ...prev, tags }))}
                  onDragStart={() => handleHeroDragStart('hero-note-2')}
                  onDrag={(dx, dy) => handleHeroDrag('hero-note-2', dx, dy)}
                  onDragEnd={handleHeroDragEnd}
                />
              </div>

              {/* Foreground NoteBubble (Lime, Tier 1 Selector border) */}
              <div style={{
                position: 'relative',
                zIndex: activeDraggingId === 'hero-note-1' ? 50 : 2,
                transform: isHeroHovered
                  ? `rotate(0deg) scale(1.03) translate3d(${12 + hero1Pos.x}px, ${-6 + hero1Pos.y}px, 0)`
                  : `rotate(3.5deg) translate3d(${16 + hero1Pos.x}px, ${4 + hero1Pos.y}px, 0)`,
                transition: activeDraggingId === 'hero-note-1' ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                filter: isHeroHovered ? 'drop-shadow(0 16px 36px rgba(0,0,0,0.2))' : 'drop-shadow(0 10px 24px rgba(0,0,0,0.12))',
              }}>
                <NoteBubble
                  note={heroNote1}
                  onSave={(val) => setHeroNote1(prev => ({ ...prev, content: val }))}
                  onColorChange={(col) => setHeroNote1(prev => ({ ...prev, color: col }))}
                  onBorderStyleChange={(bs) => setHeroNote1(prev => ({ ...prev, borderStyle: bs }))}
                  onToggleCollapse={(coll) => setHeroNote1(prev => ({ ...prev, collapsed: coll }))}
                  onTagsChange={(tags) => setHeroNote1(prev => ({ ...prev, tags }))}
                  onDragStart={() => handleHeroDragStart('hero-note-1')}
                  onDrag={(dx, dy) => handleHeroDrag('hero-note-1', dx, dy)}
                  onDragEnd={handleHeroDragEnd}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (white canvas) ─────────────────────────────────── */}
      <section style={s.section}>
        <div style={s.container}>
          <span style={{ ...s.eyebrow, color: '#111111' }}>STEP 1: CORE MECHANICS</span>
          <h2 style={s.displayLg}>Three ways to attach a stickle.</h2>
          <div style={s.threeGrid}>
            {[
              {
                num: '01',
                title: 'Alt + Click',
                body: 'Hold Alt (or Option on Mac) and click any element on the page. A note appears anchored to that exact spot.',
              },
              {
                num: '02',
                title: 'Text selection pill',
                body: 'Highlight any text. A floating pill appears above your selection: click it to turn your highlight into an attached note.',
              },
              {
                num: '03',
                title: 'Right-click menu',
                body: 'Right-click anywhere and choose "📌 Add Stickle Note Here" from the Chrome context menu.',
              },
            ].map(step => (
              <div key={step.num} style={s.stepCard}>
                <span style={s.stepNum}>{step.num}</span>
                <h3 style={s.cardTitle}>{step.title}</h3>
                <p style={s.bodyText}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SANDBOX (Dark Inverse #111 container) ───────────────────────── */}
      <section style={s.section}>
        <div style={s.container}>
          <div style={{ ...s.colorBlock, backgroundColor: '#111111', color: '#ffffff' }}>
            <span style={{ ...s.eyebrow, color: '#e4f579' }}>STEP 2: INTERACTIVE SANDBOX</span>
            <h2 style={{ ...s.displayLg, color: '#ffffff', maxWidth: 560 }}>
              Try creating &amp; placing notes.
            </h2>
            <p style={{ ...s.bodyText, color: '#a3a3a3', maxWidth: 560, marginBottom: 32 }}>
              Click the button to spawn live stickle notes. Grab any note by its header grip handle (⋮⋮) to drag and place it anywhere!
            </p>

            <div style={s.sandboxBar}>
              <button style={{ ...s.btnPrimary, backgroundColor: '#ffffff', color: '#111111' }} onClick={spawnSandboxNote}>
                + Spawn stickle
              </button>
              <span style={{ ...s.eyebrow, color: '#e4f579' }}>{sandboxNotes.length} active</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                color: '#a3a3a3',
                backgroundColor: 'rgba(255,255,255,0.08)',
                padding: '4px 12px',
                borderRadius: 50,
              }}>
                🖐 GRAB HEADER (⋮⋮) TO DRAG &amp; PLACE
              </span>
            </div>

            {sandboxNotes.length > 0 && (
              <div style={s.notesGrid}>
                {sandboxNotes.map(note => {
                  const pos = sandboxPositions[note.id] || { x: 0, y: 0 };
                  const isDragging = activeDraggingId === note.id;

                  return (
                    <div
                      key={note.id}
                      style={{
                        position: 'relative',
                        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                        transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                        zIndex: isDragging ? 50 : 1,
                      }}
                    >
                      <NoteBubble
                        note={note}
                        onSave={(val) => setSandboxNotes(prev => prev.map(n => n.id === note.id ? { ...n, content: val } : n))}
                        onColorChange={(col) => setSandboxNotes(prev => prev.map(n => n.id === note.id ? { ...n, color: col } : n))}
                        onBorderStyleChange={(bs) => setSandboxNotes(prev => prev.map(n => n.id === note.id ? { ...n, borderStyle: bs } : n))}
                        onToggleCollapse={(coll) => setSandboxNotes(prev => prev.map(n => n.id === note.id ? { ...n, collapsed: coll } : n))}
                        onTagsChange={(tags) => setSandboxNotes(prev => prev.map(n => n.id === note.id ? { ...n, tags } : n))}
                        onDelete={() => deleteSandboxNote(note.id)}
                        onDragStart={() => handleSandboxDragStart(note.id)}
                        onDrag={(dx, dy) => handleSandboxDrag(note.id, dx, dy)}
                        onDragEnd={handleSandboxDragEnd}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── ANCHORING (Monochrome off-white #f8f8f6 container) ─────────── */}
      <section style={s.section}>
        <div style={s.container}>
          <div style={{ ...s.colorBlock, backgroundColor: '#f8f8f6', border: '1px solid #e5e5e0' }}>
            <span style={{ ...s.eyebrow, color: '#111111' }}>STEP 3: ANCHORING ENGINE</span>
            <h2 style={{ ...s.displayLg, color: '#111111', maxWidth: 620 }}>
              Notes that stay even when pages change.
            </h2>
            <p style={{ ...s.bodyText, color: '#52514e', maxWidth: 600, marginBottom: 40 }}>
              Most annotation tools break silently when websites update. Stickle uses a
              3-tier fallback so your note always finds its way back.
            </p>
            <div style={s.tierGrid}>
              {[
                { num: '01', badge: 'TIER 1: STRUCTURAL', title: 'XPath + CSS selector', body: 'Exact structural match. Used on stable page content and documentation.' },
                { num: '02', badge: 'TIER 2: CONTEXTUAL', title: 'Neighbor content hash', body: 'Fingerprints surrounding text context. Survives React, Vue, Twitter re-renders.' },
                { num: '03', badge: 'TIER 3: FUZZY', title: 'Trigram similarity', body: 'Searches DOM text nodes when structure changes completely. Threshold ≥ 0.75.' },
                { num: '↩', badge: 'FALLBACK: RECOVERABLE', title: 'Orphaned note tray', body: 'If content is deleted entirely, your note lands in the tray: zero data loss.' },
              ].map(t => (
                <div key={t.badge} style={{ ...s.tierCard, backgroundColor: '#ffffff', border: '1px solid #e5e5e0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: '#111111', letterSpacing: '-0.8px', lineHeight: 1 }}>{t.num}</span>
                    <span style={{ ...s.eyebrow, fontSize: 9, color: '#111111', backgroundColor: '#e4f579', padding: '2px 8px', borderRadius: 50 }}>{t.badge}</span>
                  </div>
                  <h4 style={{ color: '#111111', fontWeight: 700, fontSize: 16, margin: '0 0 6px 0', lineHeight: 1.3 }}>{t.title}</h4>
                  <p style={{ color: '#52514e', fontSize: 13, lineHeight: 1.5, margin: 0, fontWeight: 330 }}>{t.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── NOTION (Dark Inverse #111 container) ────────────────────────── */}
      <section style={s.section}>
        <div style={s.container}>
          <div style={{ ...s.colorBlock, backgroundColor: '#111111', color: '#ffffff' }}>
            <span style={{ ...s.eyebrow, color: '#e4f579' }}>STEP 4: OPTIONAL NOTION SYNC</span>
            <h2 style={{ ...s.displayLg, color: '#ffffff', maxWidth: 580 }}>
              Push your research to Notion in one click.
            </h2>
            <p style={{ ...s.bodyText, color: '#a3a3a3', maxWidth: 560, marginBottom: 32 }}>
              Connect your Notion workspace once in Settings. Every note exports with source URL,
              page title, and timestamp: right into your existing knowledge base.
            </p>
            <ol style={{ ...s.bodyText, color: '#e5e5e5', paddingLeft: 20, margin: 0, lineHeight: 2.2 }}>
              <li>Go to <strong>notion.so/my-integrations</strong> → create an Internal Integration Token.</li>
              <li>Share your target database with the integration.</li>
              <li>Paste the token + database ID into Stickle → Settings → Notion.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* ── ROADMAP (Monochrome off-white #f8f8f6 container) ─────────────── */}
      <section style={s.section}>
        <div style={s.container}>
          <div style={{ ...s.colorBlock, backgroundColor: '#f8f8f6', border: '1px solid #e5e5e0' }}>
            <span style={{ ...s.eyebrow, color: '#111111' }}>PRODUCT ROADMAP</span>
            <h2 style={{ ...s.displayLg, color: '#111111', maxWidth: 620 }}>
              The cloud &amp; AI layer is being built next.
            </h2>
            <p style={{ ...s.bodyText, color: '#52514e', maxWidth: 560, marginBottom: 40 }}>
              v1.0 is 100% local-first and ships today. Here is what we're building next:
            </p>
            <div style={s.roadmapGrid}>
              {[
                {
                  badge: 'COMING SOON',
                  title: 'Cross-Device Cloud Sync',
                  body: 'Access your web sticky notes automatically across all your devices and Chromium browsers.',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                      <path d="M12 13l-3-3m0 0l3-3m-3 3h8" />
                    </svg>
                  ),
                },
                {
                  badge: 'IN DEVELOPMENT',
                  title: 'Team Shared Annotations',
                  body: 'Share annotated web pages with teammates. Discuss documentation, GitHub issues, and PRs in context.',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                },
                {
                  badge: 'PLANNED',
                  title: 'AI Assistant Context',
                  body: 'Connect your web notes to Claude, Cursor, or ChatGPT so your AI assistant remembers what you read.',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                      <path d="M5 3v4" />
                      <path d="M19 17v4" />
                      <path d="M3 5h4" />
                      <path d="M17 19h4" />
                    </svg>
                  ),
                },
                {
                  badge: 'PLANNED',
                  title: 'Central Web Dashboard',
                  body: 'Full web UI for searching, sorting, timeline views, and bulk exporting your annotations across all sites.',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  ),
                },
              ].map(item => (
                <div key={item.title} style={s.roadmapCard}>
                  <div style={s.roadmapTop}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#e4f579', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.icon}
                    </div>
                    <span style={{ ...s.eyebrow, fontSize: 9, color: '#111111' }}>{item.badge}</span>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: 17, margin: '12px 0 8px 0', color: '#111111' }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: '#52514e', lineHeight: 1.5, margin: 0 }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA (white canvas) ───────────────────────────────────── */}
      <section style={{ ...s.section, paddingBottom: 96 }}>
        <div style={{ ...s.container, textAlign: 'center' }}>
          <span style={s.eyebrow}>READY</span>
          <h2 style={{ ...s.displayLg, margin: '16px auto 20px', maxWidth: 520 }}>
            Go annotate the web.
          </h2>
          <p style={{ ...s.bodyText, maxWidth: 420, margin: '0 auto 32px', color: '#52514e' }}>
            Navigate to any page, hold <kbd style={s.kbd}>Alt</kbd> and click anything.
            Your first stickle is 10 seconds away.
          </p>
          <div style={s.ctaRow}>
            <button style={{ ...s.btnPrimary, padding: '12px 32px', fontSize: 17 }} onClick={() => window.close()}>
              Start taking notes →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Design tokens — strictly matching DESIGN.md ─────────────────────────────
const s = {
  page: {
    backgroundColor: '#ffffff',
    color: '#111111',
    fontFamily: "Inter, 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    margin: 0,
    padding: 0,
    WebkitFontSmoothing: 'antialiased' as const,
  },
  nav: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e5e0',
    height: 56,
    display: 'flex',
    alignItems: 'center',
  },
  navInner: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 24px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoLockup: { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 36,
    height: 36,
    backgroundColor: '#111111',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.8px', color: '#111' },
  navLink: { color: '#52514e', textDecoration: 'none', fontSize: 14, fontWeight: 500 },

  // Buttons — pill only (DESIGN.md §Components/Buttons)
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
    transition: 'background-color 0.15s',
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    color: '#111111',
    border: 'none',
    borderRadius: 50,
    padding: '8px 18px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 0 0 1px #e5e5e0',
    letterSpacing: '-0.1px',
    transition: 'background-color 0.15s',
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
    marginBottom: 0,
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
  cardTitle: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: 0,
    color: '#111111',
    margin: '12px 0 8px',
  },
  bodyLg: {
    fontSize: 20,
    fontWeight: 330,
    lineHeight: 1.4,
    letterSpacing: '-0.14px',
    color: '#52514e',
    maxWidth: 560,
    margin: '0 0 24px',
  },
  bodyText: {
    fontSize: 16,
    fontWeight: 330,
    lineHeight: 1.5,
    letterSpacing: '-0.14px',
    color: '#52514e',
    margin: '0 0 16px',
  },
  trustLine: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    color: '#b0b0a8',
    margin: '16px 0 0',
  },

  // Layout
  hero: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '72px 24px 88px',
  },
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
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' as const,
    padding: '30px 10px',
    minHeight: 340,
  },
  section: { padding: '0 0 96px' },
  container: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 24px',
  },
  ctaRow: { display: 'flex', gap: 12, flexWrap: 'wrap' as const },

  // Color block — DESIGN.md §Color-Block Sections
  // rounded-lg 24px, padding xxl 48px, NO shadows
  colorBlock: {
    borderRadius: 24,
    padding: 48,
  },

  // Grids
  threeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 1,
    marginTop: 40,
    border: '1px solid #e5e5e0',
    borderRadius: 24,
    overflow: 'hidden',
  },
  stepCard: {
    backgroundColor: '#ffffff',
    padding: '32px 28px',
    borderRight: '1px solid #e5e5e0',
  },
  stepNum: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.6px',
    color: '#b0b0a8',
    display: 'block',
    marginBottom: 16,
  },

  // Sandbox
  sandboxBar: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  notesGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 16,
    marginTop: 8,
  },
  stickyNote: {
    width: 240,
    borderRadius: 12,
    padding: 14,
    // Minimal shadow — Elevation 2 from DESIGN.md (soft, not on color block)
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
  noteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    color: '#111',
    padding: 0,
    lineHeight: 1,
  },
  noteArea: {
    width: '100%',
    height: 76,
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
  notePicker: {
    display: 'flex',
    gap: 6,
    marginTop: 8,
  },

  // Anchoring tiers (on pink block)
  tierGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  tierCard: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 16,
    padding: '20px 22px',
    border: '1px solid rgba(255,255,255,0.7)',
  },

  // Roadmap
  roadmapGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
  },
  roadmapCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: '22px 24px',
  },
  roadmapTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },

  kbd: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.85em',
    backgroundColor: '#f0f0eb',
    padding: '2px 7px',
    borderRadius: 6,
    border: '1px solid #e5e5e0',
    color: '#111',
    fontWeight: 600,
  },
};
