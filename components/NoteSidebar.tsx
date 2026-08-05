import { useState } from 'preact/hooks';
import type { StickleNote } from '../lib/types';
import { updateNote, deleteNote } from '../lib/db';
import { loadSettings } from './Settings';
import { pushNoteToNotion, exportUnsyncedNotesBatch } from '../lib/notion';
import { COLOR_SWATCHES } from './NoteBubble';

export type DateFilter = 'all' | 'today' | 'week';

interface NoteSidebarProps {
  notes: StickleNote[];
  onNoteChange?: () => void;
  onSelectNote?: (note: StickleNote) => void;
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname || url;
  } catch {
    return url;
  }
}

export function filterNotes(
  notes: StickleNote[],
  searchQuery: string,
  dateFilter: DateFilter,
  referenceTime: number = Date.now()
): StickleNote[] {
  const query = searchQuery.trim().toLowerCase();

  return notes.filter((note) => {
    // Substring match on content, title, or url
    const matchesSearch =
      !query ||
      note.content.toLowerCase().includes(query) ||
      note.pageTitle.toLowerCase().includes(query) ||
      note.url.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Date range filter
    if (dateFilter === 'today') {
      const todayStart = new Date(referenceTime).setHours(0, 0, 0, 0);
      return note.createdAt >= todayStart;
    }

    if (dateFilter === 'week') {
      const sevenDaysAgo = referenceTime - 7 * 24 * 60 * 60 * 1000;
      return note.createdAt >= sevenDaysAgo;
    }

    return true;
  });
}

export function groupNotesByDomain(notes: StickleNote[]): { domain: string; notes: StickleNote[] }[] {
  const groups: Record<string, StickleNote[]> = {};

  for (const note of notes) {
    const domain = extractDomain(note.url);
    if (!groups[domain]) {
      groups[domain] = [];
    }
    groups[domain].push(note);
  }

  return Object.keys(groups)
    .sort()
    .map((domain) => ({
      domain,
      notes: groups[domain],
    }));
}

export function navigateToNote(note: StickleNote) {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({}, (tabs) => {
      const matchingTab = tabs.find(
        (tab) => tab.url && (tab.url === note.url || tab.url.startsWith(note.url))
      );
      if (matchingTab && matchingTab.id) {
        chrome.tabs.update(matchingTab.id, { active: true });
        if (matchingTab.windowId) {
          chrome.windows.update(matchingTab.windowId, { focused: true });
        }
      } else {
        chrome.tabs.create({ url: note.url });
      }
    });
  } else {
    window.open(note.url, '_blank');
  }
}

export function NoteSidebar({ notes, onNoteChange, onSelectNote }: NoteSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const filtered = filterNotes(notes, searchQuery, dateFilter);
  const grouped = groupNotesByDomain(filtered);
  const unsyncedCount = notes.filter((n) => !n.syncedToNotion).length;

  const handleStartEdit = (note: StickleNote, e: Event) => {
    e.stopPropagation();
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = async (noteId: string, e: Event) => {
    e.stopPropagation();
    if (editContent.trim()) {
      await updateNote(noteId, { content: editContent.trim() });
    }
    setEditingId(null);
    onNoteChange?.();
  };

  const handleCancelEdit = (e: Event) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = async (noteId: string, e: Event) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(noteId);
      onNoteChange?.();
    }
  };

  const handleExportNote = async (note: StickleNote, e: Event) => {
    e.stopPropagation();
    const config = await loadSettings();
    if (!config.apiKey || !config.databaseId) {
      setSyncStatusMsg('Configure Notion integration in Settings first.');
      return;
    }

    setExportingId(note.id);
    setSyncStatusMsg(null);

    try {
      await pushNoteToNotion(note, config);
      setSyncStatusMsg('Exported note to Notion!');
      onNoteChange?.();
    } catch (err: any) {
      setSyncStatusMsg(`Export failed: ${err.message}`);
    } finally {
      setExportingId(null);
    }
  };

  const handleBatchExport = async () => {
    const config = await loadSettings();
    if (!config.apiKey || !config.databaseId) {
      setSyncStatusMsg('Configure Notion integration in Settings first.');
      return;
    }

    setIsBatchExporting(true);
    setSyncStatusMsg('Exporting unsynced notes to Notion...');

    try {
      const result = await exportUnsyncedNotesBatch(notes, config, (current, total) => {
        setSyncStatusMsg(`Exporting note ${current} of ${total}...`);
      });
      setSyncStatusMsg(
        `Batch export complete: ${result.successCount} exported, ${result.failCount} failed.`
      );
      onNoteChange?.();
    } catch (err: any) {
      setSyncStatusMsg(`Batch export failed: ${err.message}`);
    } finally {
      setIsBatchExporting(false);
    }
  };

  const handleCardClick = (note: StickleNote) => {
    if (editingId === note.id) return;
    onSelectNote?.(note);
    navigateToNote(note);
  };

  return (
    <div style={sidebarStyles.container}>
      {/* Controls Bar: Search, Date Filters & Batch Notion Action */}
      <div style={sidebarStyles.controlsBar}>
        <input
          type="text"
          placeholder="Search notes or pages..."
          value={searchQuery}
          onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
          style={sidebarStyles.searchInput}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
          <div style={sidebarStyles.filterGroup}>
            <button
              style={dateFilter === 'all' ? sidebarStyles.filterPillActive : sidebarStyles.filterPill}
              onClick={() => setDateFilter('all')}
            >
              All
            </button>
            <button
              style={dateFilter === 'today' ? sidebarStyles.filterPillActive : sidebarStyles.filterPill}
              onClick={() => setDateFilter('today')}
            >
              Today
            </button>
            <button
              style={dateFilter === 'week' ? sidebarStyles.filterPillActive : sidebarStyles.filterPill}
              onClick={() => setDateFilter('week')}
            >
              This Week
            </button>
          </div>

          {unsyncedCount > 0 && (
            <button
              style={sidebarStyles.batchExportBtn}
              onClick={handleBatchExport}
              disabled={isBatchExporting}
            >
              {isBatchExporting ? 'Exporting...' : `Export All (${unsyncedCount})`}
            </button>
          )}
        </div>

        {syncStatusMsg && (
          <div style={sidebarStyles.syncStatusBanner}>{syncStatusMsg}</div>
        )}
      </div>

      {/* Main Notes List */}
      {filtered.length === 0 ? (
        <div style={sidebarStyles.emptyState}>
          <p style={sidebarStyles.emptyText}>
            {searchQuery || dateFilter !== 'all'
              ? 'No notes match your filter criteria.'
              : 'No notes saved yet. Alt + Click anywhere on any page to pin a note.'}
          </p>
        </div>
      ) : (
        <div style={sidebarStyles.groupList}>
          {grouped.map(({ domain, notes: domainNotes }) => (
            <div key={domain} style={sidebarStyles.domainGroup}>
              <div style={sidebarStyles.domainHeader}>
                <span className="eyebrow" style={{ color: 'var(--color-ink)' }}>
                  {domain}
                </span>
                <span style={sidebarStyles.domainBadge}>{domainNotes.length}</span>
              </div>

              <div style={sidebarStyles.cardList}>
                {domainNotes.map((note) => {
                  const isEditing = editingId === note.id;
                  const isExporting = exportingId === note.id;
                  const dateStr = new Date(note.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const colorTheme = COLOR_SWATCHES[note.color || 'cream'] || COLOR_SWATCHES.cream;

                  return (
                    <div
                      key={note.id}
                      style={sidebarStyles.card}
                      onClick={() => handleCardClick(note)}
                    >
                      <div style={sidebarStyles.cardHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                          <span
                            title={`Color theme: ${colorTheme.name}`}
                            style={{
                              display: 'inline-block',
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: colorTheme.bg,
                              border: '1px solid rgba(0,0,0,0.2)',
                              flexShrink: 0,
                            }}
                          />
                          <span style={sidebarStyles.pageTitle}>{note.pageTitle || 'Untitled Page'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                          {note.syncedToNotion && (
                            <span style={sidebarStyles.syncedTag} title="Synced to Notion">
                              ✓ Notion
                            </span>
                          )}
                          <span style={getTierBadgeStyle(note.anchor.tier)}>{note.anchor.tier}</span>
                        </div>
                      </div>


                      {isEditing ? (
                        <div style={sidebarStyles.editContainer} onClick={(e) => e.stopPropagation()}>
                          <textarea
                            value={editContent}
                            onInput={(e) => setEditContent((e.target as HTMLTextAreaElement).value)}
                            style={sidebarStyles.editTextarea}
                            rows={3}
                          />
                          <div style={sidebarStyles.editActions}>
                            <button
                              style={sidebarStyles.btnSave}
                              onClick={(e) => handleSaveEdit(note.id, e)}
                            >
                              Save
                            </button>
                            <button style={sidebarStyles.btnCancel} onClick={handleCancelEdit}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p style={sidebarStyles.content}>{note.content || '(Empty Note)'}</p>
                      )}

                      <div style={sidebarStyles.cardFooter}>
                        <span style={sidebarStyles.dateText}>{dateStr}</span>

                        <div style={sidebarStyles.actionGroup}>
                          {!isEditing && (
                            <>
                              <button
                                style={sidebarStyles.notionExportBtn}
                                onClick={(e) => handleExportNote(note, e)}
                                disabled={isExporting}
                              >
                                {isExporting ? 'Exporting...' : note.syncedToNotion ? 'Re-sync Notion' : 'Export Notion'}
                              </button>
                              <button
                                style={sidebarStyles.actionBtn}
                                onClick={(e) => handleStartEdit(note, e)}
                              >
                                Edit
                              </button>
                            </>
                          )}
                          <button
                            style={sidebarStyles.deleteBtn}
                            onClick={(e) => handleDelete(note.id, e)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function getTierBadgeStyle(tier: string) {
  const base = {
    fontSize: '9px',
    fontFamily: 'var(--font-mono)',
    padding: '2px 6px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  };

  switch (tier) {
    case 'selector':
      return { ...base, backgroundColor: 'var(--color-block-mint)', color: '#166534' };
    case 'text-fragment':
      return { ...base, backgroundColor: 'var(--color-block-lilac)', color: '#5b21b6' };
    case 'fuzzy':
      return { ...base, backgroundColor: 'var(--color-block-cream)', color: '#854d0e' };
    case 'unanchored':
    default:
      return { ...base, backgroundColor: 'var(--color-block-pink)', color: '#991b1b' };
  }
}

const sidebarStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  controlsBar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid var(--color-hairline)',
    backgroundColor: 'var(--color-surface-soft)',
    fontSize: '13px',
    boxSizing: 'border-box' as const,
    outline: 'none',
  },
  filterGroup: {
    display: 'flex',
    gap: '6px',
  },
  filterPill: {
    padding: '4px 10px',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid var(--color-hairline)',
    backgroundColor: 'var(--color-canvas)',
    fontSize: '11px',
    color: 'var(--color-ink-muted)',
    cursor: 'pointer',
  },
  filterPillActive: {
    padding: '4px 10px',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid var(--color-primary)',
    backgroundColor: 'var(--color-primary)',
    fontSize: '11px',
    color: 'var(--color-on-primary)',
    fontWeight: '600' as const,
    cursor: 'pointer',
  },
  emptyState: {
    padding: '24px 12px',
    textAlign: 'center' as const,
    backgroundColor: 'var(--color-surface-soft)',
    borderRadius: 'var(--radius-md)',
  },
  emptyText: {
    fontSize: '13px',
    color: 'var(--color-ink-muted)',
    margin: 0,
    lineHeight: '1.4',
  },
  groupList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  domainGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  domainHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '2px',
    borderBottom: '1px solid var(--color-hairline-soft)',
  },
  domainBadge: {
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    backgroundColor: 'var(--color-surface-soft)',
    padding: '1px 6px',
    borderRadius: 'var(--radius-pill)',
    color: 'var(--color-ink-muted)',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  card: {
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-canvas)',
    border: '1px solid var(--color-hairline)',
    boxShadow: 'var(--shadow-soft)',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '6px',
  },
  pageTitle: {
    fontSize: '12px',
    fontWeight: '600' as const,
    color: 'var(--color-ink)',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '200px',
  },
  content: {
    fontSize: '13px',
    color: 'var(--color-ink)',
    margin: '0 0 8px 0',
    lineHeight: '1.4',
    wordBreak: 'break-word' as const,
  },
  editContainer: {
    marginBottom: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  editTextarea: {
    width: '100%',
    padding: '6px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-hairline)',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
  },
  editActions: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'flex-end',
  },
  btnSave: {
    padding: '4px 10px',
    borderRadius: 'var(--radius-pill)',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    border: 'none',
    fontSize: '11px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  },
  btnCancel: {
    padding: '4px 10px',
    borderRadius: 'var(--radius-pill)',
    backgroundColor: 'var(--color-surface-soft)',
    color: 'var(--color-ink)',
    border: 'none',
    fontSize: '11px',
    cursor: 'pointer',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11px',
  },
  dateText: {
    fontSize: '10px',
    color: 'var(--color-ink-muted)',
    fontFamily: 'var(--font-mono)',
  },
  actionGroup: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    fontSize: '11px',
    color: 'var(--color-ink-muted)',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  deleteBtn: {
    fontSize: '11px',
    color: '#dc2626',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  batchExportBtn: {
    padding: '3px 8px',
    borderRadius: 'var(--radius-pill)',
    backgroundColor: 'var(--color-block-lime)',
    border: '1px solid var(--color-hairline)',
    fontSize: '10px',
    fontWeight: '600' as const,
    color: '#3d4400',
    cursor: 'pointer',
  },
  syncStatusBanner: {
    padding: '6px 10px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface-soft)',
    fontSize: '11px',
    color: 'var(--color-ink)',
    lineHeight: '1.3',
  },
  syncedTag: {
    fontSize: '9px',
    fontFamily: 'var(--font-mono)',
    padding: '2px 5px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: '#dcfce7',
    color: '#15803d',
    fontWeight: '600' as const,
  },
  notionExportBtn: {
    fontSize: '11px',
    color: '#2563eb',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: 0,
    fontWeight: '500' as const,
  },
};

