"use client";

import { useState } from "react";
import { DashboardNote } from "@/lib/types";

const TIMELINE_EVENTS: DashboardNote[] = [
  {
    id: "evt-1",
    url: "https://en.wikipedia.org/wiki/Vector_graphics",
    domain: "wikipedia.org",
    page_title: "Vector graphics — Wikipedia",
    content: "Vector graphics are computer graphics images that are defined in terms of 2D points...",
    color: "lime",
    tags: ["research"],
    anchor: { cssSelector: "p", tier: "dom-index", offsetX: 0, offsetY: 0 },
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "evt-2",
    url: "https://news.ycombinator.com/item?id=3912345",
    domain: "news.ycombinator.com",
    page_title: "Hacker News — Show HN: Stickle 3-Tier Anchoring Engine",
    content: "The 3-tier DOM anchor resolution keeps stickles pinned even when dynamic React trees re-render.",
    color: "lilac",
    tags: ["architecture"],
    anchor: { cssSelector: "table", tier: "text-fragment", offsetX: 0, offsetY: 0 },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "evt-3",
    url: "https://github.com/facebook/react/issues/28000",
    domain: "github.com",
    page_title: "React 19 Server Actions & Optimistic State Updates",
    content: "Need to verify how useOptimistic handles rolled back mutations when offline sync re-connects...",
    color: "mint",
    tags: ["todo", "react"],
    anchor: { cssSelector: "div", tier: "dom-index", offsetX: 0, offsetY: 0 },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export default function TimelinePage() {
  const [events] = useState<DashboardNote[]>(TIMELINE_EVENTS);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="color-block color-block-soft border border-[#e5e5e0] flex items-center justify-between">
        <div>
          <span className="eyebrow text-[#111111] mb-2">LIVE ACTIVITY STREAM</span>
          <h1 className="display-lg text-[#111111] mb-2">
            Timeline Feed
          </h1>
          <p className="body-lg text-[#52514e]">
            Real-time chronological feed of web annotations across all your browsers & devices.
          </p>
        </div>

        {/* Lime Live Pulse Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#e4f579] text-[#111111] font-mono text-xs uppercase font-semibold shadow-sm shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black"></span>
          </span>
          <span>Live Sync</span>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#e5e5e0]">
        {events.map((item) => (
          <div key={item.id} className="relative group">
            {/* Timeline dot */}
            <div className="absolute -left-6 top-6 w-3.5 h-3.5 rounded-full bg-[#e4f579] border-2 border-[#111111] shadow-sm group-hover:scale-125 transition-transform" />

            <div className="color-block color-block-soft border border-[#e5e5e0] !p-6 transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow-lime text-[10px]">
                  {item.domain}
                </span>
                <span className="font-mono text-xs text-[#52514e]">
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <h3 className="card-title text-xl mb-2 text-[#111111]">
                {item.page_title}
              </h3>

              <p className="text-sm font-sans text-[#111111] bg-white p-4 rounded-2xl border border-[#e5e5e0] mb-4">
                "{item.content}"
              </p>

              <div className="flex items-center justify-between text-xs">
                <div className="flex gap-2">
                  {item.tags?.map((t) => (
                    <span key={t} className="font-mono text-xs text-[#52514e]">
                      #{t}
                    </span>
                  ))}
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pill btn-primary text-xs !px-4 !py-1.5"
                >
                  View Webpage ↗
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
