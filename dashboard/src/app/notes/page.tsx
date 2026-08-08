"use client";

import { useState, useMemo } from "react";
import { DashboardNote, NoteColorBlock } from "@/lib/types";

const INITIAL_NOTES: DashboardNote[] = [
  {
    id: "note-1",
    url: "https://en.wikipedia.org/wiki/Vector_graphics",
    domain: "wikipedia.org",
    page_title: "Vector graphics — Wikipedia",
    content: "Vector graphics are computer graphics images defined in terms of 2D points, connected by lines and curves to form polygons.",
    color: "lime",
    tags: ["research", "graphics", "math"],
    anchor: { cssSelector: "div.mw-parser-output > p:nth-of-type(2)", tier: "dom-index", domIndex: 2, offsetX: 40, offsetY: 120 },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    synced_to_notion: true,
  },
  {
    id: "note-2",
    url: "https://news.ycombinator.com/item?id=3912345",
    domain: "news.ycombinator.com",
    page_title: "Hacker News — Show HN: Stickle 3-Tier Anchoring Engine",
    content: "The 3-tier DOM anchor resolution keeps stickles pinned even when dynamic React trees re-render.",
    color: "lilac",
    tags: ["architecture", "web", "hn"],
    anchor: { cssSelector: "table.comment-tree > tr:nth-child(1)", tier: "text-fragment", offsetX: 15, offsetY: 45 },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "note-3",
    url: "https://github.com/facebook/react/issues/28000",
    domain: "github.com",
    page_title: "React 19 Server Actions & Optimistic State Updates",
    content: "Need to verify how useOptimistic handles rolled back mutations when offline sync re-connects to Supabase PostgreSQL delta stream.",
    color: "cream",
    tags: ["todo", "react", "sync"],
    anchor: { cssSelector: "div.comment-body", tier: "dom-index", domIndex: 0, offsetX: 20, offsetY: 60 },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
  },
  {
    id: "note-4",
    url: "https://docs.anthropic.com/claude/docs/mcp",
    domain: "docs.anthropic.com",
    page_title: "Model Context Protocol (MCP) Standard Specification",
    content: "Local STDIO server exposes search_stickle_notes and export_stickle_summary so Claude Desktop can synthesize notes directly from disk.",
    color: "mint",
    tags: ["mcp", "ai", "docs"],
    anchor: { cssSelector: "article > section:nth-of-type(3)", tier: "dom-index", domIndex: 3, offsetX: 50, offsetY: 90 },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
    synced_to_notion: true,
  },
  {
    id: "note-5",
    url: "https://nextjs.org/docs/app/building-your-application/routing",
    domain: "nextjs.org",
    page_title: "Next.js App Router Architecture & Parallel Routes",
    content: "Combine layout.tsx with client search state to render instant filtering across 1000+ web annotations.",
    color: "coral",
    tags: ["nextjs", "frontend"],
    anchor: { cssSelector: "main > div.content", tier: "fuzzy", offsetX: 30, offsetY: 100 },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 90).toISOString(),
  },
];

export default function NotesExplorerPage() {
  const [notes] = useState<DashboardNote[]>(INITIAL_NOTES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  const domains = useMemo(() => {
    const map = new Map<string, number>();
    notes.forEach((note) => {
      map.set(note.domain, (map.get(note.domain) || 0) + 1);
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

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        searchQuery === "" ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.page_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDomain = selectedDomain === "all" || note.domain === selectedDomain;
      const matchesTag = selectedTag === "all" || note.tags?.includes(selectedTag);

      return matchesSearch && matchesDomain && matchesTag;
    });
  }, [notes, searchQuery, selectedDomain, selectedTag]);

  const getColorClass = (color?: NoteColorBlock) => {
    switch (color) {
      case "lime":
        return "color-block-lime";
      case "lilac":
        return "color-block-lilac";
      case "cream":
        return "color-block-cream";
      case "mint":
        return "color-block-mint";
      case "pink":
        return "color-block-pink";
      case "coral":
        return "color-block-coral";
      case "navy":
        return "color-block-navy";
      default:
        return "color-block-cream";
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Intro Bar */}
      <div className="color-block color-block-soft border border-[#e5e5e0]">
        <span className="eyebrow text-[#111111] mb-2">STICKLE • NOTES EXPLORER</span>
        <h1 className="display-lg text-[#111111] max-w-3xl mb-3">
          All your web annotations in one place.
        </h1>
        <p className="body-lg text-[#52514e] max-w-2xl mb-0">
          Search, filter by domain, or jump directly back to the anchored context on any webpage.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar — Domains & Tags */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Domains list */}
          <div className="color-block color-block-soft border border-[#e5e5e0] !p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="eyebrow text-[#52514e]">DOMAINS ({domains.length})</span>
              <span className="eyebrow-lime text-[10px]">{notes.length} notes</span>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedDomain("all")}
                className={`w-full text-left px-4 py-2 rounded-full text-xs font-sans font-medium transition-all flex items-center justify-between ${
                  selectedDomain === "all"
                    ? "bg-[#e4f579] text-[#111111] font-semibold"
                    : "text-[#52514e] hover:bg-[#f5f5f3]"
                }`}
              >
                <span>All Domains</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-black/10">
                  {notes.length}
                </span>
              </button>

              {domains.map(([domain, count]) => (
                <button
                  key={domain}
                  onClick={() => setSelectedDomain(domain)}
                  className={`w-full text-left px-4 py-2 rounded-full text-xs font-sans font-medium transition-all flex items-center justify-between ${
                    selectedDomain === domain
                      ? "bg-[#e4f579] text-[#111111] font-semibold"
                      : "text-[#52514e] hover:bg-[#f5f5f3]"
                  }`}
                >
                  <span className="truncate max-w-[130px]">{domain}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-black/10">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags list */}
          {allTags.length > 0 && (
            <div className="color-block color-block-soft border border-[#e5e5e0] !p-6">
              <span className="eyebrow text-[#52514e] mb-4">TAGS</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedTag("all")}
                  className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all ${
                    selectedTag === "all"
                      ? "btn-primary"
                      : "bg-[#f5f5f3] text-[#52514e] hover:bg-gray-200"
                  }`}
                >
                  #all
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all ${
                      selectedTag === tag
                        ? "btn-lime"
                        : "bg-[#f5f5f3] text-[#52514e] hover:bg-gray-200"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Panel — Search & Cards */}
        <section className="lg:col-span-3 space-y-6">
          {/* Search Input */}
          <div className="bg-white rounded-full p-2 pl-6 border border-[#e5e5e0] shadow-sm flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52514e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search notes by keyword, title, domain, or #tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#111111] placeholder-[#52514e]/60 focus:outline-none font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="btn-pill btn-lime text-xs px-3 py-1 mr-2"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Status */}
          <div className="flex items-center justify-between text-xs font-mono text-[#52514e] px-2">
            <span>
              SHOWING <strong className="text-[#111111]">{filteredNotes.length}</strong> OF {notes.length} NOTES
            </span>
            {selectedDomain !== "all" && (
              <span className="eyebrow-lime text-[10px]">
                DOMAIN: {selectedDomain}
              </span>
            )}
          </div>

          {/* Notes Grid */}
          {filteredNotes.length === 0 ? (
            <div className="color-block color-block-soft text-center py-16">
              <div className="w-12 h-12 rounded-full bg-[#e4f579] text-[#111111] mx-auto mb-4 flex items-center justify-center font-bold text-xl">
                📌
              </div>
              <h3 className="card-title mb-2">No matching notes found</h3>
              <p className="body-lg text-[#52514e] text-base">
                Try searching for a different keyword or clearing active filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`color-block ${getColorClass(note.color)} !p-6 flex flex-col justify-between transition-transform hover:-translate-y-1 shadow-sm`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.6px] px-2.5 py-0.5 rounded-full bg-black/10 truncate max-w-[180px]">
                        {note.domain}
                      </span>
                      <span className="font-mono text-[10px] opacity-60">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="card-title text-lg leading-snug mb-3 line-clamp-2">
                      {note.page_title}
                    </h3>

                    <p className="text-sm font-sans opacity-90 mb-4 whitespace-pre-wrap leading-relaxed">
                      "{note.content}"
                    </p>
                  </div>

                  <div>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {note.tags.map((t) => (
                          <span
                            key={t}
                            className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-black/10"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-black/10 flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] opacity-70">
                        ANCHOR: {note.anchor?.tier || "dom-index"}
                      </span>
                      <a
                        href={note.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-pill btn-primary text-xs !px-3.5 !py-1 flex items-center gap-1"
                      >
                        <span>Jump to page</span>
                        <span>↗</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
