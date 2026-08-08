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
      {/* Header with Live Pulse Badge */}
      <div className="bg-white rounded-3xl p-8 border border-[#e5e5e5] shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111111] mb-1">
            Activity Timeline
          </h1>
          <p className="text-sm text-gray-500">
            Real-time chronological feed of web annotations across all your browsers & devices.
          </p>
        </div>

        {/* Lime Live Pulse Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#e4f579] text-[#111111] font-mono text-xs uppercase font-medium shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black"></span>
          </span>
          <span>Live Sync</span>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
        {events.map((item) => (
          <div key={item.id} className="relative group">
            {/* Timeline dot */}
            <div className="absolute -left-6 top-5 w-3 h-3 rounded-full bg-[#e4f579] border-2 border-[#111111] shadow-sm group-hover:scale-125 transition-transform" />

            <div className="bg-white rounded-3xl p-6 border border-[#e5e5e5] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#e4f579] text-[#111111] font-medium">
                  {item.domain}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <h3 className="font-bold text-base text-[#111111] mb-2">
                {item.page_title}
              </h3>

              <p className="text-sm text-gray-700 bg-[#f8f8f6] p-4 rounded-2xl border border-gray-100 mb-4">
                "{item.content}"
              </p>

              <div className="flex items-center justify-between text-xs">
                <div className="flex gap-1.5">
                  {item.tags?.map((t) => (
                    <span key={t} className="font-mono text-gray-500">
                      #{t}
                    </span>
                  ))}
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 rounded-full bg-[#111111] text-white text-xs font-medium hover:bg-black/90 transition-colors"
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
