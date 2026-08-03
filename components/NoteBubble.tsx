import type { StickleNote } from '../lib/types';

interface NoteBubbleProps {
  note: StickleNote;
  onSave?: (updatedContent: string) => void;
  onDelete?: () => void;
}

export function NoteBubble({ note, onSave, onDelete }: NoteBubbleProps) {
  return (
    <div className="stickle-note-bubble" style={bubbleStyles.container}>
      <div style={bubbleStyles.header}>
        <span className="eyebrow" style={{ fontSize: '9px' }}>
          TIER: {note.anchor.tier.toUpperCase()}
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

const bubbleStyles = {
  container: {
    width: '240px',
    backgroundColor: 'var(--color-block-cream, #fff7db)',
    border: '1px solid var(--color-hairline, #e5e5e0)',
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
