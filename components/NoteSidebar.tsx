import type { StickleNote } from '../lib/types';

interface NoteSidebarProps {
  notes: StickleNote[];
  onSelectNote?: (note: StickleNote) => void;
  onDeleteNote?: (id: string) => void;
}

export function NoteSidebar({ notes, onSelectNote, onDeleteNote }: NoteSidebarProps) {
  return (
    <div style={sidebarStyles.container}>
      <h2 style={sidebarStyles.title}>All Notes ({notes.length})</h2>
      {notes.length === 0 ? (
        <p style={sidebarStyles.empty}>No notes saved yet. Click anywhere on a page to pin a note.</p>
      ) : (
        <div style={sidebarStyles.list}>
          {notes.map((note) => (
            <div key={note.id} style={sidebarStyles.card} onClick={() => onSelectNote?.(note)}>
              <div style={sidebarStyles.cardHeader}>
                <span className="eyebrow">{note.pageTitle || 'Untitled Page'}</span>
                <button
                  style={sidebarStyles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote?.(note.id);
                  }}
                >
                  Delete
                </button>
              </div>
              <p style={sidebarStyles.content}>{note.content || '(Empty Note)'}</p>
              <div style={sidebarStyles.footer}>
                <span style={sidebarStyles.url}>{new URL(note.url).hostname}</span>
                <span style={sidebarStyles.badge}>{note.anchor.tier}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const sidebarStyles = {
  container: {
    padding: '16px',
    backgroundColor: 'var(--color-canvas)',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600' as const,
    marginBottom: '12px',
  },
  empty: {
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  card: {
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface-soft)',
    border: '1px solid var(--color-hairline)',
    cursor: 'pointer',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  deleteBtn: {
    fontSize: '11px',
    color: '#dc2626',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
  },
  content: {
    fontSize: '13px',
    margin: '0 0 8px 0',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: 'var(--color-ink-muted)',
  },
  url: {
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  badge: {
    backgroundColor: 'var(--color-hairline)',
    padding: '2px 6px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '10px',
  },
};
