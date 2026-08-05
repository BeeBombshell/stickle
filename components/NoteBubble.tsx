import { useState, useEffect, useRef } from 'preact/hooks';
import type { StickleNote, AnchorTier } from '../lib/types';

interface NoteBubbleProps {
  note: StickleNote;
  onSave?: (updatedContent: string) => void;
  onDelete?: () => void;
  onDragStart?: () => void;
  onDrag?: (dx: number, dy: number) => void;
  onDragEnd?: (clientX: number, clientY: number) => void;
}

export function NoteBubble({
  note,
  onSave,
  onDelete,
  onDragStart,
  onDrag,
  onDragEnd,
}: NoteBubbleProps) {
  const borderStyle = getTierBorderStyle(note.anchor.tier);
  const badgeStyle = getTierBadgeStyle(note.anchor.tier);
  const [isDragging, setIsDragging] = useState(false);
  const [content, setContent] = useState(note.content);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setContent(note.content);
  }, [note.content]);

  const handleInput = (e: Event) => {
    const val = (e.target as HTMLTextAreaElement).value;
    setContent(val);
    onSave?.(val);
  };

  const handlePointerDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('textarea')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    onDragStart?.();
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    onDrag?.(dx, dy);
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!isDragging) return;
    const target = e.currentTarget as HTMLElement;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch {}
    setIsDragging(false);
    onDragEnd?.(e.clientX, e.clientY);
    dragStartRef.current = null;
  };

  return (
    <div
      className={`stickle-note-bubble stickle-tier-${note.anchor.tier}`}
      style={{
        ...bubbleStyles.container,
        border: borderStyle,
      }}
    >
      <style>{`
        .stickle-note-bubble {
          color-scheme: light !important;
          color: #111111 !important;
          background-color: #fff7db !important;
        }
        .stickle-note-bubble textarea {
          color-scheme: light !important;
          color: #111111 !important;
        }
        .stickle-note-bubble textarea::placeholder {
          color: #71717a !important;
          opacity: 1 !important;
        }
      `}</style>

      <div
        style={{
          ...bubbleStyles.header,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div style={bubbleStyles.headerLeft}>
          <span style={bubbleStyles.dragGrip} title="Drag to reposition note">
            ⋮⋮
          </span>
          <span className="eyebrow" style={badgeStyle}>
            {getTierLabel(note.anchor.tier)}
          </span>
        </div>
        <button onClick={onDelete} style={bubbleStyles.closeBtn} title="Delete note">
          ✕
        </button>
      </div>
      <textarea
        style={bubbleStyles.textarea}
        value={content}
        placeholder="Type note content..."
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function getTierBorderStyle(tier: AnchorTier): string {
  switch (tier) {
    case 'selector':
      return '1px solid #e5e5e0';
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
    backgroundColor: '#fff7db',
    color: '#111111',
    colorScheme: 'light' as const,
    borderRadius: '8px',
    padding: '10px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    userSelect: 'none' as const,
    gap: '6px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  dragGrip: {
    color: '#71717a',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    letterSpacing: '1px',
    lineHeight: '1',
    cursor: 'grab',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#52514e',
    padding: '2px 4px',
    lineHeight: '1',
  },
  textarea: {
    width: '100%',
    minHeight: '65px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#111111',
    caretColor: '#111111',
    colorScheme: 'light' as const,
    resize: 'vertical' as const,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '13px',
    lineHeight: '1.4',
    outline: 'none',
    padding: '4px',
    boxSizing: 'border-box' as const,
  },
};
