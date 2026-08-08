"use client";

import { useState, useMemo } from "react";
import { DashboardNote, NoteColorBlock } from "@/lib/types";

// Mock seed notes for demonstration & offline fallback
const INITIAL_NOTES: DashboardNote[] = [
  {
    id: "note-1",
    url: "https://en.wikipedia.org/wiki/Vector_graphics",
    domain: "wikipedia.org",
    page_title: "Vector graphics — Wikipedia",
    content: "Vector graphics are computer graphics images that are defined in terms of 2D points, which are connected by lines and curves to form polygons.",
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
    content: "The 3-tier DOM anchor resolution (CSS selector → exact text fragment → trigram edit-distance fuzzy match) keeps stickles pinned even when dynamic React trees re-render.",
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
    content: "Need to verify how useOptimistic handles rolled back mutations when offline sync re-connects to Supabase PostgreSQL delta stream.",
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
  {
    id: "note-4",
    url: "https://docs.anthropic.com/claude/docs/mcp",
    domain: "docs.anthropic.com",
    page_title: "Model Context Protocol (MCP) Standard Specification",
    content: "Local STDIO server exposes search_stickle_notes and export_stickle_summary so Claude Desktop can synthesize notes directly from disk.",
    color: "mint",
    tags: ["mcp", "ai", "docs"],
    anchor: {
      cssSelector: "article > section:nth-of-type(3)",
      tier: "dom-index",
      domIndex: 3,
      offsetX: 50,
      offsetY: 90,
    },
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
    anchor: {
      cssSelector: "main > div.content",
      tier: "fuzzy",
      offsetX: 30,
      offsetY: 100,
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 90).toISOString(),
  },
];

export default function NotesExplorerPage() {
  const [notes, setNotes] = useState<DashboardNote[]>(INITIAL_NOTES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedColor, setSelectedColor] = useState<string>("all");

  // Extract unique domains & tags
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

  // Filter notes based on search & domain selection
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        searchQuery === "" ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.page_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDomain =
        selectedDomain === "all" || note.domain === selectedDomain;

      const matchesTag =
        selectedTag === "all" || note.tags?.includes(selectedTag);

      const matchesColor =
        selectedColor === "all" || note.color === selectedColor;

      return matchesSearch && matchesDomain && matchesTag && matchesColor;
    });
  }, [notes, searchQuery, selectedDomain, selectedTag, selectedColor]);

  // Map color swatches to DESIGN.md palette classes
  const getColorStyles = (color?: NoteColorBlock) => {
    switch (color) {
      case "lime":
        return "bg-[#e4f579] text-[#111111] border-[#d4e569]";
      case "lilac":
        return "bg-[#e8d5ff] text-[#111111] border-[#d8c5ef]";
      case "cream":
        return "bg-[#fffbeb] text-[#111111] border-[#f5eed5]";
      case "mint":
        return "bg-[#d1f7c4] text-[#111111] border-[#c1e7b4]";
      case "pink":
        return "bg-[#ffd6e8] text-[#111111] border-[#efc6d8]";
      case "coral":
        return "bg-[#ffe4e6] text-[#111111] border-[#efd4d6]";
      case "navy":
        return "bg-[#111111] text-white border-black";
      default:
        return "bg-[#fffbeb] text-[#111111] border-[#f5eed5]";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Left Sidebar — Domains & Filters adhering to DESIGN.md */}
      <aside className="lg:col-span-1 space-y-6">
        {/* Domain Filter Header */}
        <div className="bg-white rounded-3xl p-6 border border-[#e5e5e5] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono tracking-wider uppercase text-gray-500">
              Domains ({domains.length})
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#e4f579] text-[#111111] font-mono font-medium">
              {notes.length} notes
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setSelectedDomain("all")}
              className={`w-full text-left px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center justify-between ${
                selectedDomain === "all"
                  ? "bg-[#e4f579] text-[#111111] shadow-sm"
                  : "text-gray-700 hover:bg-[#f0f0ed]"
              }`}
            >
              <span>All Domains</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-black/10">
                {notes.length}
              </span>
            </button>

            {domains.map(([domain, count]) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`w-full text-left px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center justify-between ${
                  selectedDomain === domain
                    ? "bg-[#e4f579] text-[#111111] shadow-sm"
                    : "text-gray-700 hover:bg-[#f0f0ed]"
                }`}
              >
                <span className="truncate max-w-[140px]">{domain}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-black/10">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tag Cloud */}
        {allTags.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-[#e5e5e5] shadow-sm">
            <h2 className="text-xs font-mono tracking-wider uppercase text-gray-500 mb-4">
              Tags
            </h2>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedTag("all")}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                  selectedTag === "all"
                    ? "bg-[#111111] text-white"
                    : "bg-[#f0f0ed] text-gray-700 hover:bg-gray-200"
                }`}
              >
                #all
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                    selectedTag === tag
                      ? "bg-[#e4f579] text-[#111111] font-semibold"
                      : "bg-[#f0f0ed] text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Panel — Search & Note Cards Grid */}
      <section className="lg:col-span-3 space-y-6">
        {/* Search Bar with Signature Lime Accent */}
        <div className="bg-white rounded-3xl p-4 border border-[#e5e5e5] shadow-sm flex items-center gap-3">
          {/* Search Icon */}
          <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search web notes by keyword, domain, or #tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#111111] placeholder-gray-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-3 py-1 rounded-full bg-[#e4f579] text-[#111111] text-xs font-medium hover:opacity-80"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Bar summary */}
        <div className="flex items-center justify-between text-xs font-mono text-gray-500 px-2">
          <span>
            Showing <strong className="text-[#111111]">{filteredNotes.length}</strong> of {notes.length} notes
          </span>
          {selectedDomain !== "all" && (
            <span className="bg-[#e4f579] text-[#111111] px-2.5 py-0.5 rounded-full font-medium">
              Filtered: {selectedDomain}
            </span>
          )}
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#e5e5e5] shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#e4f579] text-[#111111] mx-auto mb-4 flex items-center justify-center font-bold text-xl">
              📌
            </div>
            <h3 className="text-lg font-bold text-[#111111] mb-1">No notes found</h3>
            <p className="text-sm text-gray-500">
              Try adjusting your search query or clear the active domain filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`rounded-3xl p-6 border shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${getColorStyles(
                  note.color
                )}`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/10 text-current truncate max-w-[180px]">
                      {note.domain}
                    </span>
                    <span className="text-[11px] font-mono opacity-60">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Page Title */}
                  <h3 className="font-bold text-base leading-snug mb-3 line-clamp-2">
                    {note.page_title}
                  </h3>

                  {/* Note Body */}
                  <p className="text-sm opacity-90 mb-4 whitespace-pre-wrap leading-relaxed">
                    "{note.content}"
                  </p>
                </div>

                {/* Footer Actions & Tags */}
                <div>
                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {note.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/10"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action row */}
                  <div className="pt-3 border-t border-black/10 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] opacity-70">
                      Tier: {note.anchor?.tier || "dom-index"}
                    </span>
                    <a
                      href={note.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 rounded-full bg-black text-white text-xs font-medium hover:bg-black/80 transition-colors inline-flex items-center gap-1"
                    >
                      Jump to page ↗
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
