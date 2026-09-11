import { useState, useEffect, useMemo } from 'preact/hooks';
import { LayoutDashboard, Cloud, FileText, Palette, Bot, Globe, RefreshCw, Info, BookOpen, Zap, Lock } from 'lucide-preact';
import { Github } from '../../components/icons/Github';
import { loadSettings, saveSettings, type NotionSettings } from '../../components/Settings';
import { testNotionConnection } from '../../lib/notion';
import { COLOR_SWATCHES } from '../../components/NoteBubble';
import { getAllNotes } from '../../lib/db';
import { exportNotesToJson, importNotesFromJson } from '../../lib/export-import';
import { getProfile, signInWithOAuth, signOut } from '../../lib/auth';
import { isEnabled, FEATURE_NAMES, ENABLE_CLOUD_AUTH, type FeatureFlag } from '../../lib/flags';
import { fullSync } from '../../lib/sync';
import type { NoteColorBlock, NoteBorderStyle, UserProfile, StickleNote } from '../../lib/types';
import { LocalizedPricing } from '../../components/LocalizedPricing';
import { STICKLE_LINKS } from '../../lib/constants';
import posthog from '../../lib/posthog';

type NavTab = 'dashboard' | 'account' | 'notion' | 'defaults' | 'mcp' | 'about';
type SortKey = 'newest' | 'oldest' | 'domain';

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── DashboardTab component ───────────────────────────────────────────────────

interface DashboardTabProps {
  allNotes: StickleNote[];
  loading: boolean;
  search: string;
  setSearch: (v: string) => void;
  domain: string;
  setDomain: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  tag: string;
  setTag: (v: string) => void;
  sort: SortKey;
  setSort: (v: SortKey) => void;
  expandedId: string | null;
  setExpandedId: (v: string | null) => void;
  onRefresh: () => void;
  onExport: () => void;
  onImport: (e: Event) => void;
  totalNotesCount: number;
}

function DashboardTab({
  allNotes, loading,
  search, setSearch,
  domain, setDomain,
  color, setColor,
  tag, setTag,
  sort, setSort,
  expandedId, setExpandedId,
  onRefresh, onExport, onImport, totalNotesCount,
}: DashboardTabProps) {
  // Derived
  const domains = useMemo(() => {
    const map = new Map<string, number>();
    allNotes.forEach((n) => {
      try {
        const host = new URL(n.url).hostname;
        map.set(host, (map.get(host) || 0) + 1);
      } catch {}
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [allNotes]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    allNotes.forEach((n) => n.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [allNotes]);

  const colorCounts = useMemo(() => {
    const counts: Record<string, number> = { lime: 0, blue: 0, lilac: 0, cream: 0, mint: 0, pink: 0, coral: 0 };
    allNotes.forEach((n) => { if (n.color && counts[n.color] !== undefined) counts[n.color]++; });
    return counts;
  }, [allNotes]);

  const syncedCount = useMemo(() => allNotes.filter((n) => n.syncedToNotion).length, [allNotes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = allNotes.filter((n) => {
      const host = (() => { try { return new URL(n.url).hostname; } catch { return ''; } })();
      const matchSearch = q === '' || n.content.toLowerCase().includes(q) || n.pageTitle.toLowerCase().includes(q) || host.includes(q) || n.tags?.some((t) => t.toLowerCase().includes(q));
      const matchDomain = domain === 'all' || host === domain;
      const matchColor  = color === 'all' || n.color === color;
      const matchTag    = tag === 'all' || n.tags?.includes(tag);
      return matchSearch && matchDomain && matchColor && matchTag;
    });
    if (sort === 'newest') return [...result].sort((a, b) => b.createdAt - a.createdAt);
    if (sort === 'oldest') return [...result].sort((a, b) => a.createdAt - b.createdAt);
    if (sort === 'domain') return [...result].sort((a, b) => {
      const ha = (() => { try { return new URL(a.url).hostname; } catch { return ''; } })();
      const hb = (() => { try { return new URL(b.url).hostname; } catch { return ''; } })();
      return ha.localeCompare(hb);
    });
    return result;
  }, [allNotes, search, domain, color, tag, sort]);

  const clearFilters = () => { setSearch(''); setDomain('all'); setColor('all'); setTag('all'); };

  const NOTE_COLORS: Record<string, { bg: string; border: string }> = {
    lime:  { bg: '#e4f579', border: '#c8d94a' },
    lilac: { bg: '#e8d5ff', border: '#c4a8e8' },
    cream: { bg: '#fff7db', border: '#e8d68a' },
    mint:  { bg: '#d1f7c4', border: '#8fd67a' },
    pink:  { bg: '#ffd6e8', border: '#f4a0c0' },
    coral: { bg: '#ffdbcc', border: '#f0a882' },
    blue:  { bg: '#bfdbfe', border: '#7ab4f0' },
  };

  const getNoteBg = (c?: string) => NOTE_COLORS[c || 'cream']?.bg || '#fff7db';
  const getNoteBorder = (c?: string, bs?: string) => {
    const col = NOTE_COLORS[c || 'cream']?.border || '#e8d68a';
    if (bs === 'none') return 'none';
    return `2px ${bs === 'dashed' ? 'dashed' : 'solid'} ${col}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <span style={{ ...styles.eyebrow, marginBottom: '4px' }}>MY STICKLES</span>
          <h2 style={{ ...styles.cardTitle, marginTop: '2px', marginBottom: '4px' }}>Notes Dashboard</h2>
          <p style={{ ...styles.cardDesc, margin: 0 }}>
            Search, filter, and browse all {allNotes.length} notes saved locally.
          </p>
        </div>
        {/* Action row: Export / Import / Refresh */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onExport}
            className="btn-pill btn-secondary"
            style={{ fontSize: '11px', padding: '6px 13px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            title={`Export ${totalNotesCount} notes as JSON`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
          <label
            className="btn-pill btn-secondary"
            style={{ fontSize: '11px', padding: '6px 13px', display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
            title="Import notes from JSON backup"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import
            <input type="file" accept=".json" onChange={onImport} style={{ display: 'none' }} />
          </label>
          <button onClick={onRefresh} style={{ fontSize: '11px', padding: '6px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', borderRadius: '8px' }} title="Refresh notes">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {[
          { label: 'TOTAL NOTES', value: allNotes.length, bg: '#e4f579' },
          { label: 'DOMAINS',     value: domains.length,  bg: '#e8d5ff' },
          { label: 'UNIQUE TAGS', value: allTags.length,  bg: '#d1f7c4' },
          { label: 'NOTION SYNCED', value: syncedCount,   bg: '#fff7db' },
        ].map(({ label, value, bg }) => (
          <div key={label} style={{ backgroundColor: bg, borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-1px', color: '#111' }}>{value}</div>
            <div style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#52514e', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '80px', borderRadius: '14px', backgroundColor: '#f0f0eb', opacity: 0.7 }} />
          ))}
        </div>
      ) : allNotes.length === 0 ? (
        /* Empty state */
        <div style={{ backgroundColor: '#e4f579', borderRadius: '20px', padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📌</div>
          <h3 style={{ ...styles.cardTitle, marginBottom: '8px', fontSize: '18px' }}>No stickles yet</h3>
          <p style={{ ...styles.cardDesc, margin: '0 auto', maxWidth: '340px' }}>
            Alt+Click or select text on any webpage to drop your first sticky note.
          </p>
        </div>
      ) : (
        /* Filter + notes grid */
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '16px', alignItems: 'start' }}>

          {/* ── Left filter panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Colors */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e0', borderRadius: '14px', padding: '12px' }}>
              <div style={{ ...styles.eyebrow, marginBottom: '8px' }}>Colors</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                <button onClick={() => setColor('all')} style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", padding: '2px 8px', borderRadius: '50px', border: '1px solid #e5e5e0', background: color === 'all' ? '#111' : 'transparent', color: color === 'all' ? '#fff' : '#52514e', cursor: 'pointer', fontWeight: color === 'all' ? 700 : 400 }}>all</button>
                {(Object.keys(NOTE_COLORS) as NoteColorBlock[]).map((c) => (
                  <button key={c} onClick={() => setColor(c)} title={`${c} (${colorCounts[c] ?? 0})`} style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", padding: '2px 8px', borderRadius: '50px', background: NOTE_COLORS[c].bg, color: '#111', border: color === c ? '2px solid #111' : '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', fontWeight: color === c ? 700 : 400 }}>{c}</button>
                ))}
              </div>
            </div>

            {/* Domains */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e0', borderRadius: '14px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={styles.eyebrow}>Domains</span>
                <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', backgroundColor: '#e4f579', padding: '1px 6px', borderRadius: '50px' }}>{allNotes.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button onClick={() => setDomain('all')} style={{ ...styles.navItem, fontSize: '11px', padding: '5px 8px', ...(domain === 'all' ? styles.navItemActive : {}) }}>
                  <span style={{ flex: 1, textAlign: 'left' }}>All</span>
                  <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", backgroundColor: 'rgba(0,0,0,0.08)', padding: '0 5px', borderRadius: '9999px' }}>{allNotes.length}</span>
                </button>
                {domains.map(([d, cnt]) => (
                  <button key={d} onClick={() => setDomain(d)} style={{ ...styles.navItem, fontSize: '11px', padding: '5px 8px', ...(domain === d ? styles.navItemActive : {}) }}>
                    <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d}</span>
                    <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", backgroundColor: 'rgba(0,0,0,0.08)', padding: '0 5px', borderRadius: '9999px', flexShrink: 0 }}>{cnt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e0', borderRadius: '14px', padding: '12px' }}>
                <div style={{ ...styles.eyebrow, marginBottom: '8px' }}>Tags</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  <button onClick={() => setTag('all')} style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", padding: '2px 8px', borderRadius: '50px', border: '1px solid #e5e5e0', background: tag === 'all' ? '#111' : 'transparent', color: tag === 'all' ? '#fff' : '#52514e', cursor: 'pointer', fontWeight: tag === 'all' ? 700 : 400 }}>#all</button>
                  {allTags.map((t) => (
                    <button key={t} onClick={() => setTag(t)} style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", padding: '2px 8px', borderRadius: '50px', background: tag === t ? '#e4f579' : '#f0f0eb', color: '#111', border: tag === t ? '1px solid #c8d94a' : '1px solid transparent', cursor: 'pointer', fontWeight: tag === t ? 700 : 400 }}>#{t}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Notes area ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Search + sort */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', height: '38px', borderRadius: '50px', border: '1px solid #e5e5e0', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ color: '#9ca3af', flexShrink: 0, display: 'flex' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input
                  type="text"
                  placeholder="Search notes…"
                  value={search}
                  onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '12px', color: '#111', fontFamily: 'Inter, sans-serif' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
              <select value={sort} onChange={(e) => setSort((e.target as HTMLSelectElement).value as SortKey)} style={{ height: '38px', padding: '0 10px', borderRadius: '50px', border: '1px solid #e5e5e0', background: '#ffffff', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#111', cursor: 'pointer', outline: 'none' }}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="domain">Domain</option>
              </select>
            </div>

            {/* Result count */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Showing <strong style={{ color: '#111' }}>{filtered.length}</strong> of {allNotes.length}
              </span>
              {(domain !== 'all' || color !== 'all' || tag !== 'all' || search) && (
                <button onClick={clearFilters} style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', textDecoration: 'underline', padding: 0 }}>
                  Clear filters
                </button>
              )}
            </div>

            {/* Filtered empty state */}
            {filtered.length === 0 ? (
              <div style={{ ...styles.card, textAlign: 'center', padding: '32px 20px' }}>
                <p style={{ ...styles.cardTitle, fontSize: '15px', marginBottom: '6px' }}>No matching notes</p>
                <p style={{ ...styles.cardDesc, margin: '0 0 16px 0' }}>Try a different keyword or clear your filters.</p>
                <button onClick={clearFilters} className="btn-pill btn-secondary" style={{ fontSize: '12px', padding: '7px 16px' }}>Clear all filters</button>
              </div>
            ) : (
              /* Note cards */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {filtered.map((note) => {
                  const host = (() => { try { return new URL(note.url).hostname; } catch { return note.url; } })();
                  const isExpanded = expandedId === note.id;
                  return (
                    <div key={note.id} style={{ backgroundColor: getNoteBg(note.color), border: getNoteBorder(note.color, note.borderStyle), borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '175px', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}>
                      <div>
                        {/* Top meta row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '8px' }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '2px 7px', borderRadius: '50px', background: 'rgba(0,0,0,0.1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{host}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                            {note.syncedToNotion && (
                              <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', padding: '2px 6px', borderRadius: '50px', background: 'rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> N
                              </span>
                            )}
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', opacity: 0.55 }}>{relativeTime(note.createdAt)}</span>
                          </div>
                        </div>

                        {/* Page title */}
                        <h3 style={{ fontSize: '13px', fontWeight: '700', lineHeight: 1.3, marginBottom: '7px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>{note.pageTitle}</h3>

                        {/* Content */}
                        <p style={{ fontSize: '12px', lineHeight: 1.55, opacity: 0.82, marginBottom: '6px', display: isExpanded ? 'block' : '-webkit-box', WebkitLineClamp: isExpanded ? undefined : 3, WebkitBoxOrient: isExpanded ? undefined : 'vertical', overflow: isExpanded ? 'visible' : 'hidden' } as any}>
                          &ldquo;{note.content}&rdquo;
                        </p>
                        {note.content.length > 120 && (
                          <button onClick={() => setExpandedId(isExpanded ? null : note.id)} style={{ background: 'none', border: 'none', padding: '0 0 6px', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, cursor: 'pointer', opacity: 0.6 }}>
                            {isExpanded ? 'Show less ↑' : 'Read more ↓'}
                          </button>
                        )}
                      </div>

                      <div>
                        {/* Tags */}
                        {note.tags && note.tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '8px' }}>
                            {note.tags.map((t) => (
                              <span key={t} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', padding: '2px 7px', borderRadius: '50px', background: 'rgba(0,0,0,0.1)' }}>#{t}</span>
                            ))}
                          </div>
                        )}

                        {/* Footer */}
                        <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>
                            {note.anchor?.tier || 'dom-index'}
                          </span>
                          <a href={note.url} target="_blank" rel="noopener noreferrer" className="btn-pill btn-primary" style={{ fontSize: '10px', padding: '4px 11px', gap: '4px', display: 'inline-flex', alignItems: 'center' }}>
                            Jump
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function OptionsApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Auth & Cloud Sync
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<'google' | 'github' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Settings
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [defaultNoteColor, setDefaultNoteColor] = useState<NoteColorBlock>('lime');
  const [defaultBorderStyle, setDefaultBorderStyle] = useState<NoteBorderStyle>('solid');
  const [enabled, setEnabled] = useState<boolean>(true);

  // Testing & Toast status
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [totalNotesCount, setTotalNotesCount] = useState<number>(0);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Dashboard state
  const [allNotes, setAllNotes] = useState<StickleNote[]>([]);
  const [dashSearch, setDashSearch] = useState('');
  const [dashDomain, setDashDomain] = useState('all');
  const [dashColor, setDashColor] = useState('all');
  const [dashTag, setDashTag] = useState('all');
  const [dashSort, setDashSort] = useState<SortKey>('newest');
  const [dashExpandedId, setDashExpandedId] = useState<string | null>(null);
  const [dashLoading, setDashLoading] = useState(false);

  // Sidebar
  const [navCollapsed, setNavCollapsed] = useState(true);

  const refreshNotesCount = async () => {
    try {
      const notes = await getAllNotes();
      setTotalNotesCount(notes.length);
    } catch {
      setTotalNotesCount(0);
    }
  };

  const loadDashboardNotes = async () => {
    setDashLoading(true);
    try {
      const notes = await getAllNotes();
      setAllNotes(notes);
      setTotalNotesCount(notes.length);
    } catch {
      setAllNotes([]);
    } finally {
      setDashLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const p = await getProfile();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    loadSettings().then((s) => {
      setApiKey(s.apiKey);
      setDatabaseId(s.databaseId);
      if (s.defaultNoteColor) setDefaultNoteColor(s.defaultNoteColor);
      if (s.defaultBorderStyle) setDefaultBorderStyle(s.defaultBorderStyle);
      if (s.enabled !== undefined) setEnabled(s.enabled);
    });
    loadDashboardNotes();
    refreshProfile();

    const handleFocus = () => {
      refreshProfile();
      loadDashboardNotes();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    let storageListener: ((changes: any, areaName: string) => void) | null = null;
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      storageListener = (changes, areaName) => {
        if (areaName === 'local' && (changes.stickle_user_session || changes.stickle_user_profile || changes.stickle_auth_updated_at)) {
          refreshProfile();
          refreshNotesCount();
        }
      };
      chrome.storage.onChanged.addListener(storageListener);
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      if (storageListener && typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(storageListener);
      }
    };
  }, []);

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsSigningIn(provider);
    setStatus(null);
    const res = await signInWithOAuth(provider);
    setIsSigningIn(null);
    if (!res.success) {
      setStatus({
        type: 'error',
        message: `Sign-in failed: ${res.error || 'Unknown error'}`,
      });
    } else {
      await refreshProfile();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setProfile(null);
    setStatus({ type: 'success', message: 'Signed out successfully.' });
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fullSync();
      setStatus({
        type: 'success',
        message: `Cloud sync complete: ${res.pushed} pushed, ${res.pulled} pulled${res.conflicts > 0 ? `, ${res.conflicts} conflicts resolved` : ''}.`,
      });
      refreshNotesCount();
    } catch (err: any) {
      setStatus({ type: 'error', message: `Sync failed: ${err?.message || 'Network error'}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveNotion = async (e: Event) => {
    e.preventDefault();
    setIsTesting(true);
    setStatus(null);

    const config: NotionSettings = {
      apiKey: apiKey.trim(),
      databaseId: databaseId.trim(),
      defaultNoteColor,
      defaultBorderStyle,
      enabled,
    };
    await saveSettings(config);

    if (apiKey.trim() && databaseId.trim()) {
      const testRes = await testNotionConnection({ apiKey: apiKey.trim(), databaseId: databaseId.trim() });
      setIsTesting(false);
      if (testRes.success) {
        setStatus({
          type: 'success',
          message: '✓ Notion connection verified and settings saved successfully!',
        });
      } else {
        setStatus({
          type: 'error',
          message: `Settings saved, but Notion test failed: ${testRes.error}`,
        });
      }
    } else {
      setIsTesting(false);
      setStatus({
        type: 'success',
        message: 'Settings saved successfully.',
      });
    }
  };

  const handleColorSelect = async (key: NoteColorBlock) => {
    setDefaultNoteColor(key);
    await saveSettings({
      apiKey: apiKey.trim(),
      databaseId: databaseId.trim(),
      defaultNoteColor: key,
      defaultBorderStyle,
      enabled,
    });
  };

  const handleBorderStyleSelect = async (bStyle: NoteBorderStyle) => {
    setDefaultBorderStyle(bStyle);
    await saveSettings({
      apiKey: apiKey.trim(),
      databaseId: databaseId.trim(),
      defaultNoteColor,
      defaultBorderStyle: bStyle,
      enabled,
    });
  };

  const handleExportJson = async () => {
    const notes = await getAllNotes();
    if (notes.length === 0) {
      setStatus({ type: 'error', message: 'No notes available to export.' });
      return;
    }
    const { filename } = exportNotesToJson(notes);
    posthog.capture('notes_backup_exported', { note_count: notes.length });
    setStatus({ type: 'success', message: `Exported ${notes.length} notes to ${filename}` });
  };

  const handleImportJsonFile = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const res = await importNotesFromJson(text);
      if (res.success) {
        posthog.capture('notes_backup_imported', {
          imported_count: res.imported,
          updated_count: res.updated,
          skipped_count: res.skipped,
        });
        setStatus({
          type: 'success',
          message: `Import complete: ${res.imported} imported, ${res.updated} updated (${res.skipped} skipped).`,
        });
        refreshNotesCount();
        loadDashboardNotes();
      } else {
        setStatus({ type: 'error', message: `Import failed: ${res.error}` });
      }
      input.value = '';
    };
    reader.readAsText(file);
  };

  const handleOpenDashboard = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: STICKLE_LINKS.dashboard });
    } else {
      window.open(STICKLE_LINKS.dashboard, '_blank');
    }
  };

  const handleCopySnippet = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const handleOpenLanding = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: STICKLE_LINKS.landing });
    } else {
      window.open(STICKLE_LINKS.landing, '_blank');
    }
  };

  const handleOpenDocs = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: STICKLE_LINKS.docs });
    } else {
      window.open(STICKLE_LINKS.docs, '_blank');
    }
  };

  const userTier = profile?.tier || 'free';

  const mcpCursorJson = JSON.stringify(
    {
      mcpServers: {
        stickle: {
          command: 'npx',
          args: ['-y', 'tsx', '/path/to/stickle/mcp-server/index.ts'],
        },
      },
    },
    null,
    2
  );

  const mcpClaudeJson = JSON.stringify(
    {
      mcpServers: {
        stickle: {
          command: 'node',
          args: ['/path/to/stickle/mcp-server/dist/index.js'],
        },
      },
    },
    null,
    2
  );

  return (
    <div style={styles.pageWrap}>
      {/* Header Bar — DESIGN.md Editorial Lockup */}
      <header style={styles.topHeader}>
        <div style={styles.headerContainer}>
          <div style={styles.headerTopRow}>
            <div style={styles.logoRow}>
              <svg width="32" height="32" viewBox="0 0 44 44" fill="none">
                <rect width="44" height="44" rx="10" fill="#111111" />
                <circle cx="31" cy="31" r="9" fill="#ffffff" />
                <circle cx="31" cy="31" r="3.5" fill="#111111" />
              </svg>
              <span style={styles.logoText}>stickle</span>
              <span style={styles.badgePill}>v1.0 PREFERENCES</span>
            </div>

            {ENABLE_CLOUD_AUTH && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={handleOpenDashboard}
                  className="btn-pill btn-primary"
                  style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <LayoutDashboard size={14} />
                    Open Dashboard
                  </span>
                </button>
              </div>
            )}
          </div>

          <div style={styles.headerSub}>
            {ENABLE_CLOUD_AUTH
              ? 'Extension preferences, Cloud authentication, Notion integration, and Model Context Protocol (MCP) configuration.'
              : 'Extension preferences, Notion integration, and Model Context Protocol (MCP) configuration.'}
          </div>
        </div>
      </header>

      {/* Main Content Layout with Sidebar */}
      <div className="options-grid" style={{ ...styles.bodyContainer, gridTemplateColumns: navCollapsed ? '52px 1fr' : '220px 1fr', transition: 'grid-template-columns 0.22s ease' }}>
        {/* Left Nav Sidebar */}
        <aside style={{ ...styles.sidebar, width: navCollapsed ? '52px' : '220px', minWidth: navCollapsed ? '52px' : '220px', overflow: 'hidden', transition: 'width 0.22s ease, min-width 0.22s ease' }}>
          {/* Collapse toggle */}
          <button
            onClick={() => setNavCollapsed((v) => !v)}
            title={navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: navCollapsed ? 'center' : 'flex-end',
              gap: '6px',
              width: '100%',
              padding: navCollapsed ? '8px' : '6px 10px 6px 14px',
              marginBottom: '4px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: '10px',
              color: '#9ca3af',
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: '600',
              transition: 'all 0.15s ease',
            }}
          >
            {!navCollapsed && <span style={{ flex: 1, textAlign: 'left' }}>MENU</span>}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s ease', transform: navCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', flexShrink: 0 }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <nav className="options-nav" style={styles.navStack}>
            <button
              onClick={() => setActiveTab('dashboard')}
              title="My Stickles"
              style={navCollapsed
                ? { ...styles.navItem, justifyContent: 'center', padding: '10px', gap: 0, ...(activeTab === 'dashboard' ? { backgroundColor: '#111', color: '#fff' } : {}) }
                : (activeTab === 'dashboard' ? styles.navItemActive : styles.navItem)
              }
            >
              <span style={{ ...styles.navIcon, flexShrink: 0 }}><LayoutDashboard size={15} /></span>
              <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: navCollapsed ? 0 : '200px', opacity: navCollapsed ? 0 : 1, transition: 'max-width 0.22s ease, opacity 0.15s ease', flex: 'none' }}>My Stickles</span>
            </button>

            {ENABLE_CLOUD_AUTH && (
              <button
                onClick={() => setActiveTab('account')}
                title="Account & Tier"
                style={navCollapsed
                  ? { ...styles.navItem, justifyContent: 'center', padding: '10px', gap: 0, ...(activeTab === 'account' ? { backgroundColor: '#111', color: '#fff' } : {}) }
                  : (activeTab === 'account' ? styles.navItemActive : styles.navItem)
                }
              >
                <span style={{ ...styles.navIcon, flexShrink: 0 }}><Cloud size={15} /></span>
                <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: navCollapsed ? 0 : '200px', opacity: navCollapsed ? 0 : 1, transition: 'max-width 0.22s ease, opacity 0.15s ease', flex: 'none' }}>Account &amp; Tier</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('notion')}
              title="Notion Integration"
              style={navCollapsed
                ? { ...styles.navItem, justifyContent: 'center', padding: '10px', gap: 0, ...(activeTab === 'notion' ? { backgroundColor: '#111', color: '#fff' } : {}) }
                : (activeTab === 'notion' ? styles.navItemActive : styles.navItem)
              }
            >
              <span style={{ ...styles.navIcon, flexShrink: 0 }}><FileText size={15} /></span>
              <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: navCollapsed ? 0 : '200px', opacity: navCollapsed ? 0 : 1, transition: 'max-width 0.22s ease, opacity 0.15s ease', flex: 'none' }}>Notion Integration</span>
            </button>

            <button
              onClick={() => setActiveTab('defaults')}
              title="Note Defaults"
              style={navCollapsed
                ? { ...styles.navItem, justifyContent: 'center', padding: '10px', gap: 0, ...(activeTab === 'defaults' ? { backgroundColor: '#111', color: '#fff' } : {}) }
                : (activeTab === 'defaults' ? styles.navItemActive : styles.navItem)
              }
            >
              <span style={{ ...styles.navIcon, flexShrink: 0 }}><Palette size={15} /></span>
              <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: navCollapsed ? 0 : '200px', opacity: navCollapsed ? 0 : 1, transition: 'max-width 0.22s ease, opacity 0.15s ease', flex: 'none' }}>Note Defaults</span>
            </button>

            <button
              onClick={() => setActiveTab('mcp')}
              title="Data & MCP Setup"
              style={navCollapsed
                ? { ...styles.navItem, justifyContent: 'center', padding: '10px', gap: 0, ...(activeTab === 'mcp' ? { backgroundColor: '#111', color: '#fff' } : {}) }
                : (activeTab === 'mcp' ? styles.navItemActive : styles.navItem)
              }
            >
              <span style={{ ...styles.navIcon, flexShrink: 0 }}><Bot size={15} /></span>
              <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: navCollapsed ? 0 : '200px', opacity: navCollapsed ? 0 : 1, transition: 'max-width 0.22s ease, opacity 0.15s ease', flex: 'none' }}>Data &amp; MCP Setup</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              title="Product & Links"
              style={navCollapsed
                ? { ...styles.navItem, justifyContent: 'center', padding: '10px', gap: 0, ...(activeTab === 'about' ? { backgroundColor: '#111', color: '#fff' } : {}) }
                : (activeTab === 'about' ? styles.navItemActive : styles.navItem)
              }
            >
              <span style={{ ...styles.navIcon, flexShrink: 0 }}><Globe size={15} /></span>
              <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: navCollapsed ? 0 : '200px', opacity: navCollapsed ? 0 : 1, transition: 'max-width 0.22s ease, opacity 0.15s ease', flex: 'none' }}>Product &amp; Links</span>
            </button>
          </nav>

          {!navCollapsed && (
            <div style={styles.sidebarFooter}>
              <div style={styles.eyebrow}>LOCAL STORAGE</div>
              <div style={styles.sidebarStatValue}>{totalNotesCount} Notes Saved</div>
              {ENABLE_CLOUD_AUTH && (
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Tier: <strong style={{ color: '#111' }}>{userTier.toUpperCase()}</strong>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Right Main Pane */}
        <main style={styles.mainContent}>
          {status && (
            <div
              style={{
                ...styles.statusBanner,
                backgroundColor: status.type === 'success' ? '#e4f579' : '#ffd6e8',
                borderColor: status.type === 'success' ? '#d4ee42' : '#f43f5e',
              }}
            >
              <span>{status.message}</span>
              <button onClick={() => setStatus(null)} style={styles.statusCloseBtn}>✕</button>
            </div>
          )}

          {/* TAB 0: My Stickles Dashboard */}
          {activeTab === 'dashboard' && (
            <DashboardTab
              allNotes={allNotes}
              loading={dashLoading}
              search={dashSearch}
              setSearch={setDashSearch}
              domain={dashDomain}
              setDomain={setDashDomain}
              color={dashColor}
              setColor={setDashColor}
              tag={dashTag}
              setTag={setDashTag}
              sort={dashSort}
              setSort={setDashSort}
              expandedId={dashExpandedId}
              setExpandedId={setDashExpandedId}
              onRefresh={loadDashboardNotes}
              onExport={handleExportJson}
              onImport={handleImportJsonFile}
              totalNotesCount={totalNotesCount}
            />
          )}

          {/* TAB 1: Account & Cloud Sync */}
          {ENABLE_CLOUD_AUTH && activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <section style={{ ...styles.card, backgroundColor: '#111111', color: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={styles.eyebrowInverse}>STICKLE CLOUD AUTHENTICATION</span>
                    <h2 style={{ ...styles.cardTitle, color: '#ffffff', marginTop: '4px' }}>
                      {profile ? `Welcome back, ${profile.email.split('@')[0]}!` : 'Sign in to Stickle Cloud'}
                    </h2>
                    <p style={{ ...styles.cardDesc, color: '#9ca3af', marginBottom: 0 }}>
                      {profile
                        ? 'Your notes and workspaces are configured to sync across devices.'
                        : 'Sign in with Google or GitHub to enable real-time cloud sync and team workspaces.'}
                    </p>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      padding: '4px 12px',
                      borderRadius: '50px',
                      backgroundColor: userTier === 'supporter' ? '#e4f579' : userTier === 'team_member' ? '#e8d5ff' : '#374151',
                      color: userTier === 'free' ? '#d1d5db' : '#111111',
                    }}
                  >
                    {userTier === 'supporter' ? 'PRO SUPPORTER' : userTier === 'team_member' ? 'TEAMS' : 'FREE TIER'}
                  </span>
                </div>

                <div style={{ marginTop: '20px' }}>
                  {profile ? (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        onClick={handleTriggerSync}
                        disabled={isSyncing}
                        className="btn-pill btn-primary"
                        style={{ backgroundColor: '#e4f579', color: '#111111', padding: '10px 20px', fontSize: '13px', fontWeight: '700' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <RefreshCw size={14} />
                          {isSyncing ? 'Syncing...' : 'Sync Cloud Notes Now'}
                        </span>
                      </button>

                      <button
                        onClick={handleOpenDashboard}
                        className="btn-pill btn-secondary"
                        style={{ padding: '10px 20px', fontSize: '13px' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <LayoutDashboard size={14} />
                          Open Web Dashboard
                        </span>
                      </button>

                      <button
                        onClick={handleSignOut}
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid #4b5563',
                          color: '#e5e7eb',
                          borderRadius: '50px',
                          padding: '9px 18px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleOAuthSignIn('google')}
                        disabled={isSigningIn !== null}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 20px',
                          borderRadius: '50px',
                          border: 'none',
                          backgroundColor: '#ffffff',
                          color: '#111111',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        {isSigningIn === 'google' ? 'Connecting...' : 'Continue with Google'}
                      </button>

                      <button
                        onClick={() => handleOAuthSignIn('github')}
                        disabled={isSigningIn !== null}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 20px',
                          borderRadius: '50px',
                          border: 'none',
                          backgroundColor: '#24292e',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                        </svg>
                        {isSigningIn === 'github' ? 'Connecting...' : 'Continue with GitHub'}
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Feature Availability & Plan Tier Matrix */}
              <section style={styles.card}>
                <span style={styles.eyebrow}>ENTITLEMENT DOCUMENTATION</span>
                <h2 style={styles.cardTitle}>Feature Availability &amp; Plan Matrix</h2>
                <p style={styles.cardDesc}>
                  Summary of extension, cloud, and MCP capabilities accessible based on your current account tier.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(Object.keys(FEATURE_NAMES) as FeatureFlag[]).map((flag) => {
                    const active = isEnabled(flag, userTier);
                    const info = FEATURE_NAMES[flag];

                    return (
                      <div
                        key={flag}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#111111' }}>
                            {info.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {info.description}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '10px',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            padding: '4px 10px',
                            borderRadius: '50px',
                            backgroundColor: active ? '#e4f579' : '#f3f4f6',
                            color: active ? '#111111' : '#6b7280',
                            border: active ? '1px solid #d4ee42' : '1px solid #e5e7eb',
                            flexShrink: 0,
                            marginLeft: '16px',
                          }}
                        >
                          {active ? '✓ ACTIVE' : `Requires ${info.minTier}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Localized Pricing & Upgrade Section */}
              <section style={styles.card}>
                <div style={{ marginBottom: '16px' }}>
                  <span style={styles.eyebrow}>LOCALIZED PLANS & PRICING</span>
                  <h2 style={styles.cardTitle}>Upgrade Plan &amp; Supporter Tiers</h2>
                  <p style={styles.cardDesc}>
                    Support open source development and unlock real-time cloud sync, central web dashboard access, and remote MCP server integrations.
                  </p>
                </div>
                <LocalizedPricing userEmail={profile?.email} userId={profile?.id} />
              </section>
            </div>
          )}

          {/* TAB 2: Notion Integration */}
          {activeTab === 'notion' && (
            <section style={styles.card}>
              <span style={styles.eyebrow}>EXTERNAL SYNC</span>
              <h2 style={styles.cardTitle}>Notion Integration</h2>
              <p style={styles.cardDesc}>
                Sync stickle notes directly to a Notion database in real time. Works 100% locally with zero account requirements.
              </p>

              <form onSubmit={handleSaveNotion}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Internal Integration Token</label>
                  <input
                    type="password"
                    style={styles.input}
                    placeholder="secret_..."
                    value={apiKey}
                    onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
                  />
                  <span style={styles.helpText}>
                    Obtain a secret token from <a href={STICKLE_LINKS.notionIntegrations} target="_blank" rel="noreferrer" style={{ color: '#111', fontWeight: '600' }}>notion.so/my-integrations</a>.
                  </span>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notion Database ID</label>
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="32-character database ID"
                    value={databaseId}
                    onInput={(e) => setDatabaseId((e.target as HTMLInputElement).value)}
                  />
                  <span style={styles.helpText}>
                    Copy the 32-character ID from your database URL and share the page with your Notion integration.
                  </span>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button
                    type="submit"
                    className="btn-pill btn-primary"
                    disabled={isTesting}
                    style={{ padding: '10px 24px', fontSize: '13px', fontWeight: '600' }}
                  >
                    {isTesting ? 'Testing Connection...' : 'Save & Test Notion Connection'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* TAB 3: Note Defaults */}
          {activeTab === 'defaults' && (
            <section style={styles.card}>
              <span style={styles.eyebrow}>APPEARANCE PREFERENCES</span>
              <h2 style={styles.cardTitle}>Note Creation Defaults</h2>
              <p style={styles.cardDesc}>
                Choose default swatches and border styles for new sticky notes created across webpages.
              </p>

              <div style={{ marginBottom: '28px' }}>
                <label style={styles.label}>Default Swatch Color</label>
                <div style={styles.swatchRow}>
                  {(Object.keys(COLOR_SWATCHES) as NoteColorBlock[]).map((key) => {
                    const isSelected = defaultNoteColor === key;
                    const sw = COLOR_SWATCHES[key];
                    return (
                      <button
                        key={key}
                        onClick={() => handleColorSelect(key)}
                        title={sw.name}
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor: sw.bg,
                          border: isSelected ? '3px solid #111111' : '1px solid rgba(0,0,0,0.15)',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxSizing: 'border-box',
                          transition: 'transform 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: sw.border,
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={styles.label}>Default Border Style</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'solid', label: 'Solid Border' },
                    { id: 'dashed', label: 'Dashed Border' },
                    { id: 'none', label: 'No Border' },
                  ].map((bOpt) => {
                    const isSelected = defaultBorderStyle === bOpt.id;
                    return (
                      <button
                        key={bOpt.id}
                        onClick={() => handleBorderStyleSelect(bOpt.id as NoteBorderStyle)}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '50px',
                          fontSize: '12px',
                          fontWeight: isSelected ? '700' : '500',
                          backgroundColor: isSelected ? '#111111' : '#f3f4f6',
                          color: isSelected ? '#ffffff' : '#374151',
                          border: isSelected ? '1px solid #111111' : '1px solid #e5e7eb',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {bOpt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Card */}
              <div style={{ marginTop: '20px', padding: '16px', borderRadius: '16px', backgroundColor: COLOR_SWATCHES[defaultNoteColor].bg, border: defaultBorderStyle === 'none' ? 'none' : `2px ${defaultBorderStyle} ${COLOR_SWATCHES[defaultNoteColor].border}`, color: '#111111' }}>
                <div style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', uppercase: 'true' as any }}>
                  PREVIEW STICKLE NOTE
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px' }}>
                  Default note theme &amp; border preview
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                  This is how your notes will look when dropped onto web pages.
                </div>
              </div>
            </section>
          )}

          {/* TAB 4: Data & MCP Setup */}
          {activeTab === 'mcp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Data Backup Card */}
              <section style={styles.card}>
                <span style={styles.eyebrow}>DATA PORTABILITY</span>
                <h2 style={styles.cardTitle}>Data Backup &amp; Import/Export</h2>
                <p style={styles.cardDesc}>
                  Export your notes as portable JSON files or restore notes from a backup. Your data remains 100% under your control.
                </p>

                <div style={styles.cloudSyncComingSoonBanner}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={15} />
                    <span><strong>Cloud sync coming soon</strong> — export lets you back up or move your notes in the meantime.</span>
                  </span>
                </div>

                <div className="options-backup-grid" style={styles.backupCardRow}>
                  <div style={styles.backupBox}>
                    <div style={styles.backupBoxTitle}>Export Backup</div>
                    <p style={styles.backupBoxDesc}>
                      Download all your local stickle notes, coordinates, anchors, and metadata into a single JSON file.
                    </p>
                    <button
                      onClick={handleExportJson}
                      className="btn-pill btn-primary"
                      style={{ padding: '9px 18px', fontSize: '12px', width: '100%' }}
                    >
                      Export {totalNotesCount} Notes (.json)
                    </button>
                  </div>

                  <div style={styles.backupBox}>
                    <div style={styles.backupBoxTitle}>Import Backup</div>
                    <p style={styles.backupBoxDesc}>
                      Restore or merge notes from a previously exported JSON backup file into your local database.
                    </p>
                    <label
                      className="btn-pill btn-secondary"
                      style={{ padding: '9px 18px', fontSize: '12px', width: '100%', cursor: 'pointer', display: 'inline-flex', justifyContent: 'center' }}
                    >
                      Select JSON File...
                      <input type="file" accept=".json" onChange={handleImportJsonFile} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              </section>

              {/* MCP Integration Setup & Documentation Card */}
              <section style={styles.card}>
                <span style={styles.eyebrow}>AI INTEGRATION ENGINE</span>
                <h2 style={styles.cardTitle}>Model Context Protocol (MCP) Setup</h2>
                <p style={styles.cardDesc}>
                  Connect AI coding assistants (Claude Desktop, Cursor, Windsurf) directly to your web notes via MCP.
                </p>

                {/* Local MCP Server Configuration */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>1. Local MCP Server Setup</h3>
                  <p style={{ fontSize: '12.5px', color: '#6b7280', lineHeight: '1.4', margin: '0 0 12px 0' }}>
                    Stickle provides an official MCP server located in <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>mcp-server/index.ts</code>.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Cursor config */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700' }}>Cursor Configuration (~/.cursor/mcp.json)</span>
                        <button
                          onClick={() => handleCopySnippet(mcpCursorJson, 'cursor')}
                          style={styles.copyBtn}
                        >
                          {copiedSnippet === 'cursor' ? '✓ Copied!' : 'Copy Config'}
                        </button>
                      </div>
                      <pre style={styles.codeBlock}>{mcpCursorJson}</pre>
                    </div>

                    {/* Claude Desktop config */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700' }}>Claude Desktop Configuration (claude_desktop_config.json)</span>
                        <button
                          onClick={() => handleCopySnippet(mcpClaudeJson, 'claude')}
                          style={styles.copyBtn}
                        >
                          {copiedSnippet === 'claude' ? '✓ Copied!' : 'Copy Config'}
                        </button>
                      </div>
                      <pre style={styles.codeBlock}>{mcpClaudeJson}</pre>
                    </div>
                  </div>
                </div>

                {/* MCP Tools List */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Available MCP Tools</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    <div style={styles.mcpToolCard}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', fontSize: '11px' }}>get_stickle_notes</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Fetch all web notes anchored across sites.</div>
                    </div>
                    <div style={styles.mcpToolCard}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', fontSize: '11px' }}>create_stickle_note</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Create a new note pinned to any URL.</div>
                    </div>
                    <div style={styles.mcpToolCard}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', fontSize: '11px' }}>search_stickle_notes</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Search note contents, titles, or #tags.</div>
                    </div>
                    <div style={styles.mcpToolCard}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', fontSize: '11px' }}>get_notes_for_url</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Get notes anchored to a specific webpage.</div>
                    </div>
                  </div>
                </div>

                {/* Remote MCP Endpoint Info (Feature-flagged) */}
                {ENABLE_CLOUD_AUTH && (
                  <div style={{ marginTop: '20px', padding: '12px 14px', borderRadius: '12px', backgroundColor: '#e8d5ff', border: '1px solid #c084fc', color: '#111111' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Globe size={14} />
                      Remote MCP Endpoint (HTTPS / SSE)
                    </div>
                    <div style={{ fontSize: '11.5px', marginTop: '4px', lineHeight: '1.4' }}>
                      Remote MCP access allows cloud AI agents to connect over secure HTTPS. Requires a <strong>Pro Supporter</strong> or <strong>Teams</strong> subscription. Manage remote MCP tokens on the Web Dashboard!
                    </div>
                  </div>
                )}

                {/* Soft placeholder for future features */}
                <div style={styles.futurePlaceholder}>
                  Team workspaces &amp; cloud sync — coming soon
                </div>
              </section>
            </div>
          )}

          {/* TAB 5: Product & Resources */}
          {/* TAB 5: Product & Resources */}
          {activeTab === 'about' && (
            <section style={styles.card}>
              <span style={styles.eyebrow}>DOCUMENTATION &amp; LINKS</span>
              <h2 style={styles.cardTitle}>Product &amp; Resources</h2>
              <p style={styles.cardDesc}>
                Explore comprehensive guides, local MCP setup, interactive onboarding, and open source repositories.
              </p>

              <div style={styles.resourceGrid}>
                <a
                  href={STICKLE_LINKS.docs}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...styles.resourceCard, backgroundColor: '#111111', color: '#ffffff', borderColor: '#e4f579' }}
                >
                  <div style={{ ...styles.resourceIcon, backgroundColor: '#e4f579', color: '#111111', borderColor: '#d4ee42' }}>
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <div style={{ ...styles.resourceTitle, color: '#ffffff' }}>Documentation &amp; Setup Guides ↗</div>
                    <div style={{ ...styles.resourceDesc, color: '#d1d5db' }}>Complete guides for 5-tier anchoring, Notion sync, and Local MCP server setup.</div>
                  </div>
                </a>

                <a
                  href={STICKLE_LINKS.github}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.resourceCard}
                >
                  <div style={styles.resourceIcon}>
                    <Github size={18} />
                  </div>
                  <div>
                    <div style={styles.resourceTitle}>GitHub Repository ↗</div>
                    <div style={styles.resourceDesc}>View the open source codebase, report issues, submit PRs, and star the project.</div>
                  </div>
                </a>

                <a
                  href={STICKLE_LINKS.landing}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.resourceCard}
                >
                  <div style={styles.resourceIcon}>
                    <Globe size={18} />
                  </div>
                  <div>
                    <div style={styles.resourceTitle}>Landing Page ↗</div>
                    <div style={styles.resourceDesc}>Overview of features, architecture, and extension capabilities.</div>
                  </div>
                </a>

                <a
                  href={STICKLE_LINKS.onboarding}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.resourceCard}
                >
                  <div style={styles.resourceIcon}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <div style={styles.resourceTitle}>Interactive Sandbox ↗</div>
                    <div style={styles.resourceDesc}>Practice anchoring stickles and testing shortcuts in a live tutorial environment.</div>
                  </div>
                </a>

                <a
                  href={STICKLE_LINKS.privacy}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.resourceCard}
                >
                  <div style={styles.resourceIcon}>
                    <Lock size={18} />
                  </div>
                  <div>
                    <div style={styles.resourceTitle}>Privacy Policy ↗</div>
                    <div style={styles.resourceDesc}>Learn about local-first storage, permissions, and zero tracking commitments.</div>
                  </div>
                </a>

                <a
                  href={STICKLE_LINKS.chromeWebStore}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.resourceCard}
                >
                  <div style={styles.resourceIcon}>
                    <Globe size={18} />
                  </div>
                  <div>
                    <div style={styles.resourceTitle}>Chrome Web Store ↗</div>
                    <div style={styles.resourceDesc}>View the extension listing, share Stickle with friends, or leave a review.</div>
                  </div>
                </a>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  pageWrap: {
    minHeight: '100vh',
    backgroundColor: '#f8f8f6',
    color: '#111111',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  topHeader: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e5e0',
    padding: '24px 32px',
  },
  headerContainer: {
    maxWidth: '980px',
    margin: '0 auto',
  },
  headerTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.8px',
  },
  badgePill: {
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '50px',
    backgroundColor: '#e4f579',
    color: '#111111',
    border: '1px solid #d4ee42',
  },
  headerSub: {
    fontSize: '14px',
    color: '#52514e',
  },
  bodyContainer: {
    maxWidth: '980px',
    margin: '32px auto',
    padding: '0 16px',
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    gap: '32px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignSelf: 'start',
    position: 'sticky' as const,
    top: '32px',
  },
  navStack: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#52514e',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.15s ease',
  },
  navItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#111111',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left' as const,
    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
  },
  navIcon: {
    fontSize: '16px',
  },
  navLabel: {
    flex: 1,
  },
  sidebarFooter: {
    padding: '16px',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e5e0',
    marginTop: '20px',
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10.5px',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  eyebrowInverse: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10.5px',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
    color: '#9ca3af',
    marginBottom: '4px',
  },
  sidebarStatValue: {
    fontSize: '14px',
    fontWeight: '700',
    marginTop: '2px',
  },
  mainContent: {
    minWidth: 0,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '28px 32px',
    border: '1px solid #e5e5e0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 6px 0',
    letterSpacing: '-0.4px',
  },
  cardDesc: {
    fontSize: '13px',
    color: '#52514e',
    margin: '0 0 24px 0',
    lineHeight: '1.5',
  },
  formGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    boxSizing: 'border-box' as const,
    outline: 'none',
  },
  helpText: {
    display: 'block',
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '4px',
  },
  statusBanner: {
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '12.5px',
    fontWeight: '600',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: 0,
  },
  swatchRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  backupCardRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  backupBox: {
    backgroundColor: '#f9fafb',
    borderRadius: '14px',
    padding: '18px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  },
  backupBoxTitle: {
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  backupBoxDesc: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.4',
    margin: '0 0 16px 0',
  },
  resourceGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  resourceCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 18px',
    borderRadius: '14px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all 0.15s ease',
  },
  resourceIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    color: '#111111',
    flexShrink: 0,
  },
  resourceTitle: {
    fontSize: '14px',
    fontWeight: '700',
  },
  resourceDesc: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  codeBlock: {
    backgroundColor: '#111111',
    color: '#e4f579',
    padding: '14px',
    borderRadius: '10px',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
    overflowX: 'auto' as const,
    margin: 0,
  },
  copyBtn: {
    padding: '3px 9px',
    borderRadius: '50px',
    backgroundColor: '#111111',
    color: '#ffffff',
    border: 'none',
    fontSize: '10px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  mcpToolCard: {
    backgroundColor: '#f9fafb',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
  },
  cloudSyncComingSoonBanner: {
    padding: '10px 14px',
    borderRadius: '10px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    fontSize: '12px',
    color: '#374151',
    marginBottom: '16px',
    lineHeight: '1.4',
  },
  futurePlaceholder: {
    marginTop: '24px',
    padding: '12px 16px',
    textAlign: 'center' as const,
    fontSize: '12px',
    color: '#6b7280',
    borderTop: '1px dashed #e5e7eb',
    letterSpacing: '0.2px',
  },
};
