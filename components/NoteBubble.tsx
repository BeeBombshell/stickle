import type { StickleNote, AnchorTier } from '../lib/types';

interface NoteBubbleProps {
  note: StickleNote;
  onSave?: (updatedContent: string) => void;
  onDelete?: () => void;
}

export function NoteBubble({ note, onSave, onDelete }: NoteBubbleProps) {
  const borderStyle = getTierBorderStyle(note.anchor.tier);
  const badgeStyle = getTierBadgeStyle(note.anchor.tier);

  return (
    <div
      className={`stickle-note-bubble stickle-tier-${note.anchor.tier}`}
      style={{
        ...bubbleStyles.container,
        border: borderStyle,
      }}
    >
      <div style={bubbleStyles.header}>
        <span className="eyebrow" style={badgeStyle}>
          {getTierLabel(note.anchor.tier)}
        </span>
        <button onClick={onDelete} style={bubbleStyles.closeBtn} title="Delete note">
          ✕
        </button>
      </div>
      <textarea
        style={bubbleStyles.textarea}
        value={note.content}
        placeholder="Type note content..."
        onBlur={(e) => onSave?.((e.target as HTMLTextAreaElement).value)}
      />
    </div>
  );
}

function getTierBorderStyle(tier: AnchorTier): string {
  switch (tier) {
    case 'selector':
      return '1px solid var(--color-hairline, #e5e5e0)';
    case 'text-fragment':
      return '2px dashed #4f46e5';
    case 'fuzzy':
      return '2px dotted #d97706';
    case 'unanchored':
      return '2px solid #dc2626';
  }
}

function getTierBadgeStyle(tier: AnchorTier) {
  const base = {
    fontSize: '9px',
    fontWeight: 'bold' as const,
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase' as const,
  };
  switch (tier) {
    case 'selector':
      return { ...base, color: '#166534', backgroundColor: '#dcfce7' };
    case 'text-fragment':
      return { ...base, color: '#3730a3', backgroundColor: '#e0e7ff' };
    case 'fuzzy':
      return { ...base, color: '#92400e', backgroundColor: '#fef3c7' };
    case 'unanchored':
      return { ...base, color: '#991b1b', backgroundColor: '#fee2e2' };
  }
}

function getTierLabel(tier: AnchorTier): string {
  switch (tier) {
    case 'selector':
      return 'TIER 1: SELECTOR';
    case 'text-fragment':
      return 'TIER 2: TEXT-FRAGMENT';
    case 'fuzzy':
      return 'TIER 3: FUZZY MATCH';
    case 'unanchored':
      return 'TIER 4: ORPHANED';
  }
}

const bubbleStyles = {
  container: {
    width: '240px',
    backgroundColor: 'var(--color-block-cream, #fff7db)',
    borderRadius: 'var(--radius-md, 8px)',
    padding: '10px',
    boxShadow: 'var(--shadow-soft, 0 4px 16px rgba(0,0,0,0.06))',
    fontFamily: 'var(--font-sans)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    color: 'var(--color-ink-muted)',
  },
  textarea: {
    width: '100%',
    minHeight: '60px',
    border: 'none',
    background: 'transparent',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    fontSize: '13px',
    outline: 'none',
  },
};

