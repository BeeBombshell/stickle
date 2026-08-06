import { useState, useEffect, useRef } from 'preact/hooks';
import type { StickleNote, AnchorTier, NoteColorBlock } from '../lib/types';

export const COLOR_SWATCHES: Record<NoteColorBlock, { name: string; bg: string; text: string }> = {
  lime: { name: 'Lime', bg: '#e4f579', text: '#111111' },
  blue: { name: 'Sky Blue', bg: '#bfdbfe', text: '#111111' },
  lilac: { name: 'Lilac', bg: '#e8d5ff', text: '#111111' },
  cream: { name: 'Cream', bg: '#fff7db', text: '#111111' },
  mint: { name: 'Mint', bg: '#d1f7c4', text: '#111111' },
  pink: { name: 'Pink', bg: '#ffd6e8', text: '#111111' },
  coral: { name: 'Coral', bg: '#ffdbcc', text: '#111111' },
};

interface NoteBubbleProps {
  note: StickleNote;
  onSave?: (updatedContent: string) => void;
  onDelete?: () => void;
  onExportNotion?: () => void;
  onColorChange?: (color: NoteColorBlock) => void;
  onToggleCollapse?: (collapsed: boolean) => void;
  onTagsChange?: (tags: string[]) => void;
  onDragStart?: () => void;
  onDrag?: (dx: number, dy: number) => void;
  onDragEnd?: (clientX: number, clientY: number) => void;
}

export function NoteBubble({
  note,
  onSave,
  onDelete,
  onExportNotion,
  onColorChange,
  onToggleCollapse,
  onTagsChange,
  onDragStart,
  onDrag,
  onDragEnd,
}: NoteBubbleProps) {
  const borderStyle = getTierBorderStyle(note.anchor.tier);
  const [isDragging, setIsDragging] = useState(false);
  const [content, setContent] = useState(note.content);
  const [showPalette, setShowPalette] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const noteColor = note.color || 'lime';
  const theme = COLOR_SWATCHES[noteColor] || COLOR_SWATCHES.lime;

  useEffect(() => {
    setContent(note.content);
  }, [note.content]);

  useEffect(() => {
    setTags(note.tags || []);
  }, [note.tags]);

  const addTag = (rawTag: string) => {
    const clean = rawTag.trim().toLowerCase().replace(/^#+/, '');
    if (!clean || tags.includes(clean)) {
      setTagInput('');
      return;
    }
    const nextTags = [...tags, clean];
    setTags(nextTags);
    setTagInput('');
    onTagsChange?.(nextTags);
  };

  const removeTag = (tagToRemove: string) => {
    const nextTags = tags.filter((t) => t !== tagToRemove);
    setTags(nextTags);
    onTagsChange?.(nextTags);
  };

  const handleTagKeyDown = (e: any) => {
    e.stopPropagation();
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleInput = (e: Event) => {
    const val = (e.target as HTMLTextAreaElement).value;
    setContent(val);
    onSave?.(val);
  };

  const handlePointerDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('textarea') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    hasDraggedRef.current = false;

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
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDraggedRef.current = true;
    }
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

  // Collapsed compact pill chip view
  if (note.collapsed) {
    const snippet = content.trim()
      ? content.trim().length > 20
        ? content.trim().slice(0, 20) + '...'
        : content.trim()
      : 'Empty note';

    return (
      <div
        className={`stickle-note-chip stickle-bubble-${noteColor}`}
        style={{
          ...chipStyles.container,
          backgroundColor: theme.bg,
          color: theme.text,
          border: borderStyle,
          cursor: isDragging ? 'grabbing' : 'pointer',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => {
          if (!hasDraggedRef.current) {
            onToggleCollapse?.(false);
          }
        }}
        title="Click to expand note"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, opacity: 0.65 }}
        >
          <circle cx="12" cy="6" r="3" fill="currentColor" />
          <line x1="12" y1="9" x2="12" y2="20" />
          <path d="M6 14a6 6 0 0 0 12 0" />
        </svg>
        <span style={{ ...chipStyles.snippetText, color: theme.text }}>{snippet}</span>
        {tags.length > 0 && (
          <span style={{ fontSize: '10px', opacity: 0.8, fontFamily: 'monospace' }}>
            #{tags[0]}
          </span>
        )}
        {note.syncedToNotion && (
          <span style={chipStyles.notionDot} title="Synced to Notion" />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse?.(false);
          }}
          style={{ ...chipStyles.iconBtn, color: theme.text }}
          title="Expand note"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`stickle-note-bubble stickle-bubble-${noteColor}`}
      style={{
        ...bubbleStyles.container,
        backgroundColor: theme.bg,
        color: theme.text,
        border: borderStyle,
      }}
    >
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
          <span style={{ ...bubbleStyles.dragGrip, color: theme.text }} title="Drag to reposition note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="8" cy="5" r="2.2" />
              <circle cx="16" cy="5" r="2.2" />
              <circle cx="8" cy="12" r="2.2" />
              <circle cx="16" cy="12" r="2.2" />
              <circle cx="8" cy="19" r="2.2" />
              <circle cx="16" cy="19" r="2.2" />
            </svg>
          </span>
          {note.syncedToNotion && (
            <span
              style={bubbleStyles.syncedIndicator}
              title="Synced to Notion"
            >
              <span style={bubbleStyles.greenDot} />
              Synced
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            onClick={() => setShowPalette(!showPalette)}
            style={{ ...bubbleStyles.iconBtn, color: theme.text }}
            title="Change background color"
          >
            <span
              style={{
                display: 'block',
                width: '11px',
                height: '11px',
                borderRadius: '50%',
                backgroundColor: theme.bg,
                border: noteColor === 'navy' ? '1.5px solid #ffffff' : '1.5px solid rgba(0,0,0,0.35)',
                boxSizing: 'border-box',
              }}
            />
          </button>
          <button
            onClick={() => setConfirmDelete(!confirmDelete)}
            style={{
              ...bubbleStyles.iconBtn,
              color: confirmDelete ? '#ef4444' : theme.text,
              opacity: confirmDelete ? 1.0 : undefined,
            }}
            title="Delete note"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <button
            onClick={() => onToggleCollapse?.(true)}
            style={{ ...bubbleStyles.iconBtn, color: theme.text }}
            title="Minimize note"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div style={bubbleStyles.deleteConfirmBar}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: theme.text }}>
            Delete note?
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              style={bubbleStyles.deleteConfirmBtn}
            >
              Delete
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(false);
              }}
              style={{ ...bubbleStyles.cancelConfirmBtn, color: theme.text }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showPalette && (
        <div style={bubbleStyles.palettePopover}>
          {(Object.keys(COLOR_SWATCHES) as NoteColorBlock[]).map((key) => (
            <button
              key={key}
              onClick={() => {
                onColorChange?.(key);
                setShowPalette(false);
              }}
              title={COLOR_SWATCHES[key].name}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: COLOR_SWATCHES[key].bg,
                border: noteColor === key ? '2px solid #111111' : '1px solid rgba(0,0,0,0.15)',
                transform: noteColor === key ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.1s ease',
                cursor: 'pointer',
                padding: 0,
                boxSizing: 'border-box',
              }}
            />
          ))}
        </div>
      )}

      <textarea
        style={{
          ...bubbleStyles.textarea,
          color: theme.text,
          caretColor: theme.text,
        }}
        value={content}
        placeholder="Type note content..."
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      />

      <div style={bubbleStyles.tagSection}>
        {tags.map((tag) => (
          <span key={tag} style={{ ...bubbleStyles.tagBadge, color: theme.text }}>
            #{tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              style={{ ...bubbleStyles.tagRemoveBtn, color: theme.text }}
              title="Remove tag"
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder="+ tag"
          value={tagInput}
          onInput={(e) => setTagInput((e.target as HTMLInputElement).value)}
          onKeyDown={handleTagKeyDown}
          onKeyUp={(e) => e.stopPropagation()}
          style={{ ...bubbleStyles.tagInput, color: theme.text }}
        />
      </div>
    </div>
  );
}

function getTierBorderStyle(tier: AnchorTier): string {
  switch (tier) {
    case 'selector':
      return '1px solid rgba(0,0,0,0.15)';
    case 'text-fragment':
      return '2px dashed #4f46e5';
    case 'fuzzy':
      return '2px dotted #d97706';
    case 'unanchored':
      return '2px solid #dc2626';
  }
}

const chipStyles = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '500' as const,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const,
    boxSizing: 'border-box' as const,
  },
  snippetText: {
    maxWidth: '140px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '12px',
    fontWeight: '500' as const,
  },
  notionDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#15803d',
    display: 'inline-block',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: '18px',
    height: '18px',
    padding: '0',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.65,
  },
};

const bubbleStyles = {
  container: {
    width: '240px',
    borderRadius: '8px',
    padding: '10px 12px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
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
    gap: '6px',
  },
  dragGrip: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    cursor: 'grab',
    opacity: 0.65,
  },
  syncedIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: '600' as const,
    color: '#15803d',
    backgroundColor: '#dcfce7',
    padding: '2px 7px',
    borderRadius: '10px',
    letterSpacing: '0.2px',
    userSelect: 'none' as const,
  },
  greenDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#16a34a',
    display: 'inline-block',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: '20px',
    height: '20px',
    padding: '0',
    borderRadius: '4px',
    lineHeight: '1',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.65,
    transition: 'opacity 0.15s ease, background-color 0.15s ease',
  },
  palettePopover: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 8px',
    marginBottom: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(8px)',
    borderRadius: '50px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
  },
  deleteConfirmBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '5px 8px',
    marginBottom: '8px',
    borderRadius: '6px',
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
  },
  deleteConfirmBtn: {
    padding: '3px 10px',
    borderRadius: '50px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    fontSize: '11px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  },
  cancelConfirmBtn: {
    padding: '3px 8px',
    borderRadius: '50px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '11px',
    fontWeight: '500' as const,
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    minHeight: '65px',
    border: 'none',
    backgroundColor: 'transparent',
    resize: 'vertical' as const,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '13px',
    lineHeight: '1.4',
    outline: 'none',
    padding: '2px 0 0 0',
    boxSizing: 'border-box' as const,
  },
  tagSection: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '4px',
    alignItems: 'center',
    marginTop: '6px',
    paddingTop: '6px',
    borderTop: '1px dashed rgba(0, 0, 0, 0.12)',
  },
  tagBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '10px',
    fontFamily: 'var(--font-mono, monospace)',
    fontWeight: '600' as const,
    padding: '2px 6px',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
    userSelect: 'none' as const,
  },
  tagRemoveBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    lineHeight: '1',
    opacity: 0.65,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagInput: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '11px',
    fontFamily: 'var(--font-mono, monospace)',
    outline: 'none',
    width: '50px',
    padding: '1px 2px',
  },
};


