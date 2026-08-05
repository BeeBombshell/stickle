import { useState } from 'preact/hooks';

export default function OnboardingApp() {
  const [practiceNotes, setPracticeNotes] = useState<
    Array<{ id: number; text: string; color: string }>
  >([
    { id: 1, text: 'Click anywhere or press Alt+Click to attach a stickle!', color: '#e4f579' },
  ]);

  const addPracticeNote = () => {
    const colors = ['#e4f579', '#e8d5ff', '#fff7db', '#d1f7c4', '#ffd6e8'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setPracticeNotes((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: 'New practice stickle pinned to tutorial element!',
        color: randomColor,
      },
    ]);
  };

  return (
    <div style={styles.container}>
      {/* Top Banner Header */}
      <header style={styles.header}>
        <div style={styles.brandRow}>
          <div style={styles.logoMark}>
            <div style={styles.logoDot} />
          </div>
          <div>
            <h1 style={styles.brandTitle}>Stickle</h1>
            <span style={styles.badge}>v0.1.0 • Live Sandbox</span>
          </div>
        </div>
        <p style={styles.tagline}>
          Pin persistent floating sticky notes to dynamic web content using robust 3-tier DOM anchoring.
        </p>
      </header>

      <main style={styles.main}>
        {/* Step 1: Core Mechanics Card */}
        <section style={styles.card}>
          <div className="eyebrow">STEP 1 • CORE MECHANICS</div>
          <h2 style={styles.sectionTitle}>How to Attach Notes on Any Webpage</h2>
          <div style={styles.stepsGrid}>
            <div style={styles.stepBox}>
              <div style={styles.stepNum}>1</div>
              <h3 style={styles.stepHeading}>Alt + Click Shortcut</h3>
              <p style={styles.stepText}>
                Hold <code style={styles.code}>Alt</code> (or <code style={styles.code}>Option</code> on Mac) and click any element, paragraph, image, or header on a webpage.
              </p>
            </div>

            <div style={styles.stepBox}>
              <div style={styles.stepNum}>2</div>
              <h3 style={styles.stepHeading}>Right-Click Context Menu</h3>
              <p style={styles.stepText}>
                Right-click anywhere on a webpage and select <strong style={{ color: '#111' }}>📌 Add Stickle Note Here</strong> from the Chrome context menu.
              </p>
            </div>

            <div style={styles.stepBox}>
              <div style={styles.stepNum}>3</div>
              <h3 style={styles.stepHeading}>Extension Toolbar Popup</h3>
              <p style={styles.stepText}>
                Click the Stickle icon in your browser toolbar to search all your saved notes, filter by date, or jump back to any page.
              </p>
            </div>
          </div>
        </section>

        {/* Step 2: Interactive Sandbox */}
        <section style={{ ...styles.card, backgroundColor: '#fafafa' }}>
          <div className="eyebrow">STEP 2 • INTERACTIVE PRACTICE SANDBOX</div>
          <h2 style={styles.sectionTitle}>Try Creating Practice Stickles Below</h2>
          <p style={styles.descriptionText}>
            Click the practice button below to spawn sample anchored notes, drag them around, or test the note creation workflow right here on this tutorial page!
          </p>

          <div style={styles.sandboxArea}>
            <button className="btn-pill btn-primary" onClick={addPracticeNote}>
              ✨ Spawn Sample Stickle
            </button>
            <span style={{ fontSize: '13px', color: '#666' }}>
              Active practice notes: <strong>{practiceNotes.length}</strong>
            </span>
          </div>

          <div style={styles.practiceGrid}>
            {practiceNotes.map((note) => (
              <div
                key={note.id}
                style={{
                  ...styles.practiceBubble,
                  backgroundColor: note.color,
                }}
              >
                <div style={styles.bubbleHeader}>
                  <span className="eyebrow" style={{ color: '#111' }}>
                    PRACTICE NOTE
                  </span>
                  <button
                    style={styles.closeBtn}
                    onClick={() =>
                      setPracticeNotes((prev) => prev.filter((n) => n.id !== note.id))
                    }
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  style={styles.bubbleTextarea}
                  value={note.text}
                  onInput={(e) => {
                    const val = (e.target as HTMLTextAreaElement).value;
                    setPracticeNotes((prev) =>
                      prev.map((n) => (n.id === note.id ? { ...n, text: val } : n))
                    );
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Step 3: Visual 3-Tier Anchoring System */}
        <section style={styles.card}>
          <div className="eyebrow">STEP 3 • ROBUST ANCHORING ENGINE</div>
          <h2 style={styles.sectionTitle}>Understanding Anchor Confidence Tiers</h2>
          <p style={styles.descriptionText}>
            Stickle automatically adapts when websites update or re-render. Note borders dynamically display confidence tier badges so you always know how your note is anchored.
          </p>

          <div style={styles.tierGrid}>
            <div style={{ ...styles.tierCard, borderColor: '#e5e5e0', borderWidth: '2px', borderStyle: 'solid' }}>
              <span style={{ ...styles.tierBadge, backgroundColor: '#f0f0eb', color: '#111' }}>
                TIER 1 • SELECTOR
              </span>
              <h4 style={styles.tierTitle}>CSS Selector Match</h4>
              <p style={styles.tierText}>
                Exact DOM node match using resilient CSS selectors. High precision for static content.
              </p>
            </div>

            <div style={{ ...styles.tierCard, borderColor: '#4f46e5', borderWidth: '2px', borderStyle: 'dashed' }}>
              <span style={{ ...styles.tierBadge, backgroundColor: '#eeefbe', color: '#4f46e5' }}>
                TIER 2 • FRAGMENT
              </span>
              <h4 style={styles.tierTitle}>Text Fragment Match</h4>
              <p style={styles.tierText}>
                Survives DOM re-renders (React/Vue) by matching prefix, suffix, and exact text context.
              </p>
            </div>

            <div style={{ ...styles.tierCard, borderColor: '#d97706', borderWidth: '2px', borderStyle: 'dotted' }}>
              <span style={{ ...styles.tierBadge, backgroundColor: '#fef3c7', color: '#d97706' }}>
                TIER 3 • FUZZY
              </span>
              <h4 style={styles.tierTitle}>Trigram Fuzzy Match</h4>
              <p style={styles.tierText}>
                Uses character trigram similarity (&ge;0.75 threshold) to catch minor typos or copy edits.
              </p>
            </div>

            <div style={{ ...styles.tierCard, borderColor: '#dc2626', borderWidth: '2px', borderStyle: 'solid' }}>
              <span style={{ ...styles.tierBadge, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                TIER 4 • ORPHANED
              </span>
              <h4 style={styles.tierTitle}>Orphaned Tray</h4>
              <p style={styles.tierText}>
                If content is deleted, notes are safely preserved in the bottom corner tray without data loss.
              </p>
            </div>
          </div>
        </section>

        {/* Step 4: Notion Export Integration */}
        <section style={styles.card}>
          <div className="eyebrow">STEP 4 • OPTIONAL NOTION SYNC</div>
          <h2 style={styles.sectionTitle}>One-Click Export to Notion</h2>
          <p style={styles.descriptionText}>
            Export individual notes or batch export unsynced notes into your personal Notion database.
          </p>
          <ol style={styles.notionList}>
            <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" style={{ color: '#4f46e5' }}>Notion Integrations</a> and create an Internal Integration Token.</li>
            <li>Share your target Notion Database with your integration connection.</li>
            <li>Paste your Integration Token &amp; Database ID into the Stickle Settings tab.</li>
          </ol>
        </section>

        {/* Ready Footer */}
        <footer style={styles.footer}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#111' }}>You're All Set!</h3>
          <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>
            Navigate to any website, hold <code style={styles.code}>Alt</code> and click anywhere to leave your first stickle note.
          </p>
          <button
            className="btn-pill btn-primary"
            onClick={() => window.close()}
          >
            🚀 Start Exploring Web Notes
          </button>
        </footer>
      </main>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '880px',
    margin: '0 auto',
    padding: '40px 24px 80px 24px',
    boxSizing: 'border-box' as const,
  },
  header: {
    marginBottom: '40px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e5e5e0',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '12px',
  },
  logoMark: {
    width: '44px',
    height: '44px',
    backgroundColor: '#111111',
    borderRadius: '10px',
    position: 'relative' as const,
  },
  logoDot: {
    width: '18px',
    height: '18px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    position: 'absolute' as const,
    bottom: '4px',
    right: '4px',
  },
  brandTitle: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 800,
    letterSpacing: '-0.5px',
    color: '#111111',
    display: 'inline-block',
    marginRight: '12px',
  },
  badge: {
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    backgroundColor: '#e8d5ff',
    color: '#111',
    padding: '4px 10px',
    borderRadius: '50px',
    fontWeight: 600,
  },
  tagline: {
    margin: 0,
    fontSize: '16px',
    color: '#52514e',
    lineHeight: 1.5,
  },
  main: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e5e0',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
  },
  sectionTitle: {
    margin: '6px 0 12px 0',
    fontSize: '20px',
    fontWeight: 700,
    color: '#111',
  },
  descriptionText: {
    margin: '0 0 20px 0',
    fontSize: '14px',
    color: '#52514e',
    lineHeight: 1.5,
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '16px',
    marginTop: '20px',
  },
  stepBox: {
    backgroundColor: '#f5f5f3',
    borderRadius: '12px',
    padding: '18px',
  },
  stepNum: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: '#111',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    marginBottom: '12px',
  },
  stepHeading: {
    margin: '0 0 6px 0',
    fontSize: '15px',
    fontWeight: 600,
    color: '#111',
  },
  stepText: {
    margin: 0,
    fontSize: '13px',
    color: '#52514e',
    lineHeight: 1.4,
  },
  code: {
    fontFamily: 'var(--font-mono)',
    backgroundColor: '#e5e5e0',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  sandboxArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  practiceGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  practiceBubble: {
    width: '260px',
    borderRadius: '12px',
    padding: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid rgba(0,0,0,0.1)',
  },
  bubbleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    color: '#111',
  },
  bubbleTextarea: {
    width: '100%',
    height: '70px',
    border: 'none',
    background: 'transparent',
    resize: 'none' as const,
    fontFamily: 'var(--font-sans)',
    fontSize: '13px',
    color: '#111',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  tierGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginTop: '20px',
  },
  tierCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  tierBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '50px',
    alignSelf: 'flex-start',
  },
  tierTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#111',
  },
  tierText: {
    margin: 0,
    fontSize: '12px',
    color: '#52514e',
    lineHeight: 1.4,
  },
  notionList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '14px',
    color: '#52514e',
    lineHeight: 1.8,
  },
  footer: {
    textAlign: 'center' as const,
    padding: '32px 24px',
    backgroundColor: '#fff7db',
    borderRadius: '16px',
    border: '1px solid #e5e5e0',
  },
};
