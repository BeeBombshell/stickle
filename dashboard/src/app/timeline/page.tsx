"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardNote, NoteColorBlock } from "@/lib/types";
import { createBrowserClient } from "@/lib/supabase/client";

// ─── Lucide SVG icons ─────────────────────────────────────────────────────

function IconArrowUpRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
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

function IconWifi() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ─── Color dot mapping ────────────────────────────────────────────────────

const DOT_COLOR: Record<NoteColorBlock, string> = {
  lime: "#e4f579",
  blue: "#bfdbfe",
  lilac: "#e8d5ff",
  cream: "#fff7db",
  mint: "#d1f7c4",
  pink: "#ffd6e8",
  coral: "#ffdbcc",
  navy: "#111111",
};

function getDotColor(color?: NoteColorBlock): string {
  return color ? DOT_COLOR[color] : "#e4f579";
}

function getGroupLabel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "Earlier this week";
  return "Older";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function TimelinePage() {
  const [events, setEvents] = useState<DashboardNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = async (showLoading = true) => {
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
          tags: item.tags || [],
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
          synced_to_notion: Boolean(item.synced_to_notion),
        }));
        setEvents(mapped);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.warn("Could not fetch remote timeline events:", err);
      setEvents([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline(true);

    const supabase = createBrowserClient();
    const channel = supabase
      .channel("dashboard_timeline_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
        },
        () => {
          fetchTimeline(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const grouped = useMemo(() => {
    const groups: { label: string; items: DashboardNote[] }[] = [];
    const seen = new Map<string, number>();
    for (const event of events) {
      const label = getGroupLabel(event.created_at);
      if (!seen.has(label)) {
        seen.set(label, groups.length);
        groups.push({ label, items: [] });
      }
      groups[seen.get(label)!].items.push(event);
    }
    return groups;
  }, [events]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "720px" }}>
      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <span className="eyebrow" style={{ marginBottom: "6px" }}>
            LIVE ACTIVITY STREAM
          </span>
          <h1 className="display-lg" style={{ marginBottom: "8px" }}>
            Timeline
          </h1>
          <p className="body-lg">
            Chronological feed of web annotations across all your browsers &amp; devices.
          </p>
        </div>

        {/* Live sync badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "var(--radius-pill)",
            background: "var(--color-block-lime)",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <span style={{ position: "relative", display: "flex", width: "10px", height: "10px" }}>
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "9999px",
                background: "#111",
                opacity: 0.7,
                animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
              }}
            />
            <span
              style={{
                position: "relative",
                width: "10px",
                height: "10px",
                borderRadius: "9999px",
                background: "#111",
              }}
            />
          </span>
          <IconWifi />
          Live Sync
        </div>
      </div>

      {loading ? (
        <div style={{ height: "240px", background: "var(--color-surface-soft)", borderRadius: "var(--radius-lg)" }} />
      ) : events.length === 0 ? (
        /* Dedicated No Content Screen */
        <div
          className="color-block color-block-soft"
          style={{ textAlign: "center", padding: "64px 32px", display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "9999px",
              background: "var(--color-block-lime)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              color: "var(--color-ink)",
            }}
          >
            <IconClock />
          </div>
          <h2 className="card-title" style={{ fontSize: "22px", marginBottom: "8px" }}>
            No activity stream yet
          </h2>
          <p style={{ fontSize: "14px", color: "var(--color-ink-muted)", maxWidth: "400px", lineHeight: 1.6 }}>
            As you pin web annotations across your browsers, your activity feed will update here in real time.
          </p>
        </div>
      ) : (
        /* ── Grouped timeline ── */
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {grouped.map(({ label, items }) => (
            <div key={label}>
              {/* Group separator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.7px",
                    color: "var(--color-ink-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "var(--color-hairline)",
                  }}
                />
              </div>

              {/* Timeline track */}
              <div
                style={{
                  position: "relative",
                  paddingLeft: "28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* Vertical line */}
                <div
                  style={{
                    position: "absolute",
                    left: "6px",
                    top: "8px",
                    bottom: "8px",
                    width: "1px",
                    background: "var(--color-hairline)",
                  }}
                />

                {items.map((item) => (
                  <div key={item.id} style={{ position: "relative" }}>
                    {/* Color-coded dot */}
                    <div
                      style={{
                        position: "absolute",
                        left: "-25px",
                        top: "20px",
                        width: "13px",
                        height: "13px",
                        borderRadius: "9999px",
                        background: getDotColor(item.color),
                        border: "2px solid #111111",
                        boxShadow: "0 0 0 2px white",
                        transition: "transform 0.15s ease",
                        zIndex: 1,
                      }}
                    />

                    {/* Event card */}
                    <div
                      className="color-block color-block-soft note-card"
                      style={{ padding: "20px" }}
                    >
                      {/* Card top row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "10px",
                        }}
                      >
                        <span className="eyebrow-lime" style={{ fontSize: "10px" }}>
                          {item.domain}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {item.synced_to_notion && (
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "9px",
                                padding: "2px 6px",
                                borderRadius: "9999px",
                                background: "var(--color-block-lime)",
                                fontWeight: 600,
                              }}
                            >
                              Notion
                            </span>
                          )}
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "11px",
                              color: "var(--color-ink-muted)",
                            }}
                          >
                            {relativeTime(item.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Page title */}
                      <h3
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          lineHeight: 1.3,
                          marginBottom: "10px",
                          color: "var(--color-ink)",
                        }}
                      >
                        {item.page_title}
                      </h3>

                      {/* Content block */}
                      <p
                        style={{
                          fontSize: "13px",
                          lineHeight: 1.6,
                          color: "var(--color-ink)",
                          background: "white",
                          padding: "12px 16px",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--color-hairline)",
                          marginBottom: "12px",
                          fontStyle: "italic",
                        }}
                      >
                        &ldquo;{item.content}&rdquo;
                      </p>

                      {/* Footer */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", gap: "8px" }}>
                          {item.tags?.map((t) => (
                            <span
                              key={t}
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "11px",
                                color: "var(--color-ink-muted)",
                              }}
                            >
                              #{t}
                            </span>
                          ))}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {/* Anchor tier badge */}
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontFamily: "var(--font-mono)",
                              fontSize: "10px",
                              color: "var(--color-ink-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.3px",
                            }}
                          >
                            <IconAnchor />
                            {item.anchor?.tier}
                          </span>

                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-pill btn-primary"
                            style={{ fontSize: "12px", padding: "6px 14px", gap: "5px" }}
                          >
                            View page
                            <IconArrowUpRight />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ping keyframe */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
