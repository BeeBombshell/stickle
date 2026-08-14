"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardNote, NoteColorBlock } from "@/lib/types";
import { createBrowserClient } from "@/lib/supabase/client";

// ─── Lucide SVG icons ─────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconExternalLink() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function IconNotion() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v16H4z" />
      <path d="M8 8l4 8 4-8" />
    </svg>
  );
}

function IconAnchor() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="22" x2="12" y2="8" />
      <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    </svg>
  );
}

function IconRefreshCw() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

// ─── Sample Fallback Notes for Demo ───────────────────────────────────────

const SAMPLE_DEMO_NOTES: DashboardNote[] = [
  {
    id: "note-1",
    url: "https://en.wikipedia.org/wiki/Vector_graphics",
    domain: "wikipedia.org",
    page_title: "Vector graphics — Wikipedia",
    content:
      "Vector graphics are computer graphics images defined in terms of 2D points, connected by lines and curves to form polygons.",
    color: "lime",
    tags: ["research", "graphics", "math"],
    anchor: {
      cssSelector: "div.mw-parser-output > p:nth-of-type(2)",
      tier: "dom-index",
      domIndex: 2,
      offsetX: 40,
      offsetY: 120,
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    synced_to_notion: true,
  },
  {
    id: "note-2",
    url: "https://news.ycombinator.com/item?id=3912345",
    domain: "news.ycombinator.com",
    page_title: "Hacker News — Show HN: Stickle 3-Tier Anchoring Engine",
    content:
      "The 3-tier DOM anchor resolution keeps stickles pinned even when dynamic React trees re-render.",
    color: "lilac",
    tags: ["architecture", "web", "hn"],
    anchor: {
      cssSelector: "table.comment-tree > tr:nth-child(1)",
      tier: "text-fragment",
      offsetX: 15,
      offsetY: 45,
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "note-3",
    url: "https://github.com/facebook/react/issues/28000",
    domain: "github.com",
    page_title: "React 19 Server Actions & Optimistic State Updates",
    content:
      "Need to verify how useOptimistic handles rolled back mutations when offline sync re-connects to Supabase PostgreSQL delta stream.",
    color: "cream",
    tags: ["todo", "react", "sync"],
    anchor: {
      cssSelector: "div.comment-body",
      tier: "dom-index",
      domIndex: 0,
      offsetX: 20,
      offsetY: 60,
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
  },
];

const COLOR_CLASS_MAP: Record<NoteColorBlock, string> = {
  lime: "color-block-lime",
  blue: "color-block-blue",
  lilac: "color-block-lilac",
  cream: "color-block-cream",
  mint: "color-block-mint",
  pink: "color-block-pink",
  coral: "color-block-coral",
  navy: "color-block-navy",
};

function getColorClass(color?: NoteColorBlock) {
  return color ? COLOR_CLASS_MAP[color] : "color-block-cream";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type SortKey = "newest" | "oldest" | "domain";

export default function NotesExplorerPage() {
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Fetch actual notes from Supabase
  const fetchNotes = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: DashboardNote[] = data.map((item: any) => ({
          id: item.id || item.local_id,
          url: item.url,
          domain: item.domain || (item.url ? new URL(item.url).hostname : ""),
          page_title: item.page_title || item.url,
          content: item.content || "",
          anchor: item.anchor || { cssSelector: "body", tier: "selector", offsetX: 0, offsetY: 0 },
          color: item.color || "lime",
          border_style: item.border_style || "solid",
          tags: item.tags || [],
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
          synced_to_notion: Boolean(item.synced_to_notion),
          workspace_id: item.workspace_id || undefined,
        }));
        setNotes(mapped);
        setIsDemoMode(false);
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.warn("Could not fetch remote notes, showing empty state:", err);
      setNotes([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes(true);

    const supabase = createBrowserClient();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchNotes(false);
      }
    });

    const channel = supabase
      .channel("dashboard_notes_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
        },
        () => {
          fetchNotes(false);
        }
      )
      .subscribe();

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLoadSampleNotes = () => {
    setNotes(SAMPLE_DEMO_NOTES);
    setIsDemoMode(true);
  };

  const domains = useMemo(() => {
    const map = new Map<string, number>();
    notes.forEach((note) => {
      if (note.domain) {
        map.set(note.domain, (map.get(note.domain) || 0) + 1);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((note) => {
      note.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [notes]);

  const syncedCount = useMemo(
    () => notes.filter((n) => n.synced_to_notion).length,
    [notes]
  );

  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("all");

  const workspacesList = useMemo(() => {
    const map = new Map<string, number>();
    let personalCount = 0;
    notes.forEach((note) => {
      if (note.workspace_id) {
        map.set(note.workspace_id, (map.get(note.workspace_id) || 0) + 1);
      } else {
        personalCount++;
      }
    });
    return {
      personalCount,
      list: Array.from(map.entries()).map(([id, count]) => ({ id, count })),
    };
  }, [notes]);

  const colorCounts = useMemo(() => {
    const counts: Record<string, number> = {
      lime: 0,
      blue: 0,
      lilac: 0,
      cream: 0,
      mint: 0,
      pink: 0,
      coral: 0,
      navy: 0,
    };
    notes.forEach((n) => {
      if (n.color && counts[n.color] !== undefined) {
        counts[n.color]++;
      }
    });
    return counts;
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const result = notes.filter((note) => {
      const matchesSearch =
        searchQuery === "" ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.page_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags?.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesDomain =
        selectedDomain === "all" || note.domain === selectedDomain;
      const matchesTag =
        selectedTag === "all" || note.tags?.includes(selectedTag);
      const matchesColor =
        selectedColor === "all" || note.color === selectedColor;
      const matchesWorkspace =
        selectedWorkspace === "all" ||
        (selectedWorkspace === "personal"
          ? !note.workspace_id
          : note.workspace_id === selectedWorkspace);

      return matchesSearch && matchesDomain && matchesTag && matchesColor && matchesWorkspace;
    });

    if (sortKey === "newest")
      return [...result].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    if (sortKey === "oldest")
      return [...result].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    if (sortKey === "domain")
      return [...result].sort((a, b) => a.domain.localeCompare(b.domain));
    return result;
  }, [notes, searchQuery, selectedDomain, selectedTag, selectedColor, selectedWorkspace, sortKey]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <span className="eyebrow" style={{ marginBottom: "6px" }}>
            STICKLE • NOTES EXPLORER
          </span>
          <h1
            className="display-lg"
            style={{ marginBottom: "8px", lineHeight: 1.1 }}
          >
            All your web annotations.
          </h1>
          <p className="body-lg" style={{ maxWidth: "560px" }}>
            Search, filter by domain, or jump directly back to the anchored context
            on any webpage.
          </p>
        </div>

        <button
          onClick={() => fetchNotes()}
          className="btn-pill btn-secondary"
          style={{ fontSize: "12px", gap: "6px", padding: "6px 14px" }}
        >
          <IconRefreshCw />
          Refresh
        </button>
      </div>

      {isDemoMode && (
        <div className="color-block color-block-cream" style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", fontWeight: 600 }}>💡 Viewing sample demo notes</span>
          <button onClick={() => { setNotes([]); setIsDemoMode(false); }} className="btn-pill btn-secondary" style={{ fontSize: "11px", padding: "4px 12px" }}>Clear Demo Data</button>
        </div>
      )}

      {/* ── Stat tiles ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
        }}
      >
        <div className="stat-tile color-block-lime">
          <IconMapPin />
          <div className="stat-tile-value">{notes.length}</div>
          <div className="stat-tile-label">Total Notes</div>
        </div>
        <div className="stat-tile color-block-lilac">
          <IconGlobe />
          <div className="stat-tile-value">{domains.length}</div>
          <div className="stat-tile-label">Domains</div>
        </div>
        <div className="stat-tile color-block-mint">
          <IconTag />
          <div className="stat-tile-value">{allTags.length}</div>
          <div className="stat-tile-label">Unique Tags</div>
        </div>
        <div className="stat-tile color-block-cream">
          <IconNotion />
          <div className="stat-tile-value">{syncedCount}</div>
          <div className="stat-tile-label">Notion Synced</div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "20px" }}>
          <div style={{ height: "200px", background: "var(--color-surface-soft)", borderRadius: "var(--radius-lg)" }} />
          <div style={{ height: "300px", background: "var(--color-surface-soft)", borderRadius: "var(--radius-lg)" }} />
        </div>
      ) : notes.length === 0 ? (
        /* Dedicated No Content Screen */
        <div
          className="color-block color-block-lime"
          style={{ textAlign: "center", padding: "64px 32px", display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "9999px",
              background: "rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
              color: "var(--color-ink)",
            }}
          >
            <IconMapPin />
          </div>
          <h2 className="card-title" style={{ fontSize: "24px", marginBottom: "12px" }}>
            No web notes created yet
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "var(--color-ink-muted)",
              maxWidth: "460px",
              margin: "0 auto 28px",
              lineHeight: 1.6,
            }}
          >
            Leave notes in the margins of any website using the Stickle Browser Extension. Alt+Click or select text anywhere to drop your first sticky note!
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={handleLoadSampleNotes}
              className="btn-pill btn-primary"
              style={{ fontSize: "13px", padding: "10px 22px" }}
            >
              Load Sample Demo Notes
            </button>
            <button
              onClick={() => fetchNotes()}
              className="btn-pill btn-secondary"
              style={{ fontSize: "13px", padding: "10px 22px" }}
            >
              Check for Sync Again
            </button>
          </div>
        </div>
      ) : (
        /* ── Filter + Content Grid ── */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: "20px",
            alignItems: "start",
          }}
        >
          {/* ── Left filter panel ── */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Workspaces Filter */}
            <div className="color-block color-block-soft" style={{ padding: "16px" }}>
              <span className="eyebrow" style={{ marginBottom: "12px" }}>Workspaces</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <button
                  onClick={() => setSelectedWorkspace("all")}
                  className={`sidebar-link${selectedWorkspace === "all" ? " active" : ""}`}
                  style={{ fontSize: "12px", padding: "6px 10px" }}
                >
                  <span style={{ flex: 1 }}>All Workspaces</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "1px 6px", borderRadius: "9999px", background: "rgba(0,0,0,0.08)" }}>
                    {notes.length}
                  </span>
                </button>
                <button
                  onClick={() => setSelectedWorkspace("personal")}
                  className={`sidebar-link${selectedWorkspace === "personal" ? " active" : ""}`}
                  style={{ fontSize: "12px", padding: "6px 10px" }}
                >
                  <span style={{ flex: 1 }}>Personal Only</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "1px 6px", borderRadius: "9999px", background: "rgba(0,0,0,0.08)" }}>
                    {workspacesList.personalCount}
                  </span>
                </button>
                {workspacesList.list.map(({ id, count }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedWorkspace(id)}
                    className={`sidebar-link${selectedWorkspace === id ? " active" : ""}`}
                    style={{ fontSize: "12px", padding: "6px 10px" }}
                  >
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      WS: {id.slice(0, 10)}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "1px 6px", borderRadius: "9999px", background: "rgba(0,0,0,0.08)" }}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Colors Filter */}
            <div className="color-block color-block-soft" style={{ padding: "16px" }}>
              <span className="eyebrow" style={{ marginBottom: "12px" }}>Note Colors</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                <button
                  onClick={() => setSelectedColor("all")}
                  className="btn-pill"
                  style={{
                    fontSize: "11px",
                    padding: "3px 10px",
                    fontFamily: "var(--font-mono)",
                    background: selectedColor === "all" ? "var(--color-primary)" : "white",
                    color: selectedColor === "all" ? "var(--color-on-primary)" : "var(--color-ink)",
                    border: "1px solid var(--color-hairline)",
                  }}
                >
                  #all
                </button>
                {(["lime", "blue", "lilac", "cream", "mint", "pink", "coral", "navy"] as NoteColorBlock[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className="btn-pill"
                    style={{
                      fontSize: "11px",
                      padding: "3px 10px",
                      fontFamily: "var(--font-mono)",
                      background: c === "navy" ? "#111" : `var(--color-block-${c})`,
                      color: c === "navy" ? "white" : "#111",
                      border: selectedColor === c ? "2px solid #111" : "1px solid rgba(0,0,0,0.12)",
                      fontWeight: selectedColor === c ? 700 : 500,
                    }}
                  >
                    {c} ({colorCounts[c]})
                  </button>
                ))}
              </div>
            </div>

            {/* Domains */}
            <div className="color-block color-block-soft" style={{ padding: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <span className="eyebrow">Domains</span>
                <span className="eyebrow-lime" style={{ fontSize: "9px" }}>
                  {notes.length} notes
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <button
                  onClick={() => setSelectedDomain("all")}
                  className={`sidebar-link${selectedDomain === "all" ? " active" : ""}`}
                  style={{ fontSize: "12px", padding: "7px 12px" }}
                >
                  <span style={{ flex: 1 }}>All Domains</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      padding: "1px 6px",
                      borderRadius: "9999px",
                      background: "rgba(0,0,0,0.08)",
                    }}
                  >
                    {notes.length}
                  </span>
                </button>
                {domains.map(([domain, count]) => (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(domain)}
                    className={`sidebar-link${selectedDomain === domain ? " active" : ""}`}
                    style={{ fontSize: "12px", padding: "7px 12px" }}
                  >
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {domain}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        padding: "1px 6px",
                        borderRadius: "9999px",
                        background: "rgba(0,0,0,0.08)",
                      }}
                    >
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="color-block color-block-soft" style={{ padding: "16px" }}>
                <span className="eyebrow" style={{ marginBottom: "12px" }}>
                  Tags
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  <button
                    onClick={() => setSelectedTag("all")}
                    className="btn-pill"
                    style={{
                      fontSize: "11px",
                      padding: "4px 12px",
                      fontFamily: "var(--font-mono)",
                      background:
                        selectedTag === "all"
                          ? "var(--color-primary)"
                          : "var(--color-surface-soft)",
                      color:
                        selectedTag === "all"
                          ? "var(--color-on-primary)"
                          : "var(--color-ink-muted)",
                      border:
                        selectedTag === "all"
                          ? "none"
                          : "1px solid var(--color-hairline)",
                    }}
                  >
                    #all
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className="btn-pill"
                      style={{
                        fontSize: "11px",
                        padding: "4px 12px",
                        fontFamily: "var(--font-mono)",
                        background:
                          selectedTag === tag
                            ? "var(--color-block-lime)"
                            : "var(--color-surface-soft)",
                        color: "var(--color-ink)",
                        border:
                          selectedTag === tag
                            ? "none"
                            : "1px solid var(--color-hairline)",
                        fontWeight: selectedTag === tag ? 600 : 400,
                      }}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ── Main notes panel ── */}
          <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Search + Sort bar */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {/* Search input */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "0 16px",
                  height: "44px",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--color-hairline)",
                  background: "white",
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                <span style={{ color: "var(--color-ink-muted)", flexShrink: 0 }}>
                  <IconSearch />
                </span>
                <input
                  type="text"
                  placeholder="Search notes by keyword, title, domain, or #tag…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: "13px",
                    color: "var(--color-ink)",
                    fontFamily: "var(--font-sans)",
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-ink-muted)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <IconX />
                  </button>
                )}
              </div>

              {/* Sort select */}
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                style={{
                  height: "44px",
                  padding: "0 16px",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--color-hairline)",
                  background: "white",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-ink)",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="domain">By domain</option>
              </select>
            </div>

            {/* Result count */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 4px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--color-ink-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Showing{" "}
                <strong style={{ color: "var(--color-ink)" }}>
                  {filteredNotes.length}
                </strong>{" "}
                of {notes.length} notes
              </span>
              {selectedDomain !== "all" && (
                <span className="eyebrow-lime" style={{ fontSize: "9px" }}>
                  Domain: {selectedDomain}
                </span>
              )}
            </div>

            {/* Notes grid or Search empty state */}
            {filteredNotes.length === 0 ? (
              <div
                className="color-block color-block-soft"
                style={{ textAlign: "center", padding: "48px 24px" }}
              >
                <h3 className="card-title" style={{ fontSize: "18px", marginBottom: "8px" }}>
                  No matching notes found
                </h3>
                <p style={{ fontSize: "14px", color: "var(--color-ink-muted)" }}>
                  Try a different keyword or clear your active domain/tag filters.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px",
                }}
              >
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`color-block note-card ${getColorClass(note.color)} border-style-${note.border_style || 'solid'}`}
                    style={{
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: "200px",
                    }}
                  >
                    <div>
                      {/* Top row: domain eyebrow + date + notion badge */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                          marginBottom: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "10px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            background: "rgba(0,0,0,0.1)",
                            maxWidth: "160px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {note.domain}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {note.synced_to_notion && (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                                fontFamily: "var(--font-mono)",
                                fontSize: "9px",
                                padding: "2px 6px",
                                borderRadius: "9999px",
                                background: "rgba(0,0,0,0.12)",
                                fontWeight: 600,
                              }}
                            >
                              <IconCheck /> Notion
                            </span>
                          )}
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "10px",
                              opacity: 0.6,
                            }}
                          >
                            {relativeTime(note.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          lineHeight: 1.3,
                          marginBottom: "10px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {note.page_title}
                      </h3>

                      {/* Content preview */}
                      <p
                        style={{
                          fontSize: "13px",
                          lineHeight: 1.6,
                          opacity: 0.85,
                          marginBottom: "12px",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        &ldquo;{note.content}&rdquo;
                      </p>
                    </div>

                    <div>
                      {/* Tags */}
                      {note.tags && note.tags.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "4px",
                            marginBottom: "12px",
                          }}
                        >
                          {note.tags.map((t) => (
                            <span
                              key={t}
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "10px",
                                padding: "2px 8px",
                                borderRadius: "9999px",
                                background: "rgba(0,0,0,0.1)",
                              }}
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: anchor tier + CTA */}
                      <div
                        style={{
                          paddingTop: "12px",
                          borderTop: "1px solid rgba(0,0,0,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontFamily: "var(--font-mono)",
                            fontSize: "10px",
                            opacity: 0.65,
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                          }}
                        >
                          <IconAnchor />
                          {note.anchor?.tier || "dom-index"}
                        </span>
                        <a
                          href={note.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-pill btn-primary"
                          style={{
                            fontSize: "12px",
                            padding: "6px 14px",
                            gap: "5px",
                          }}
                        >
                          Jump to page
                          <IconExternalLink />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
