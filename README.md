# Stickle — DOM-Anchored Web Sticky Notes

![Stickle Header Banner](./assets/banner.svg)

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-MV3-black?style=flat-square&logo=googlechrome" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/UI-Preact-673AB8?style=flat-square&logo=preact&logoColor=white" alt="Preact" />
  <img src="https://img.shields.io/badge/Storage-IndexedDB%20%2B%20Dexie.js-E4F579?style=flat-square&labelColor=111111&color=E4F579" alt="Dexie.js" />
  <img src="https://img.shields.io/badge/Protocol-MCP%20Server-E8D5FF?style=flat-square&labelColor=111111&color=E8D5FF" alt="MCP Server" />
  <img src="https://img.shields.io/badge/Privacy-Local--First-22c55e?style=flat-square" alt="Local First" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT License" />
</p>

> A local-first Chrome Extension (MV3) and Next.js Web Dashboard (`http://localhost:3001`) that lets you pin persistent floating sticky notes to dynamic web content using a resilient **5-Tier DOM Anchoring System**.

---

## 📌 Features Overview

- 🎯 **Robust 5-Tier DOM Anchoring**: Notes stay pinned across page refreshes, SPA re-renders, Wikipedia DOM shifts, layout refactors, and minor copy edits. Dragged sticky notes and highlighted text notes preserve pixel-accurate offsets.
- 🎨 **Figma-Inspired Color System**: Crisp monochrome frame paired with 7 signature color-block surfaces (`lime`, `lilac`, `cream`, `mint`, `pink`, `coral`, `blue`).
- 🏢 **Active Workspace Filtering**: Selecting a workspace (Personal Only, Team Workspace, or All) automatically filters rendered notes on webpages in real-time.
- 📐 **Collapsible Dashboard Sidebar**: Next.js 16 Web Dashboard features a collapsible side nav (64px collapsed strip with tooltips / 240px expanded) with state persisted across page reloads.
- ✍️ **Text Selection Highlighting**: Highlight text ranges on any webpage with sticky notes attached directly to `<mark>` text elements with exact offset retention.
- 🤖 **Model Context Protocol (MCP) Integration**: Stdio CLI server (`npx stickle mcp`) and Remote HTTP/SSE server on port `3001` allowing AI assistants (Claude Desktop, Cursor, Windsurf, ChatGPT) to query, search, create, and summarize notes.
- 🔒 **Local-First & Private**: Stored in Chrome Local Storage + IndexedDB via Dexie.js. Zero mandatory tracking or telemetry.
- 📦 **JSON Backup & Portable Import/Export**: Export full offline JSON backups (`stickle_export_YYYY-MM-DD.json`) and import/merge backup files via dashboard or extension.
- 🚀 **Notion Sync Integration**: Push web notes and highlighted snippets directly to a Notion database.
- 👥 **Team Shared In-Page Annotations**: Real-time shared team annotations overlaid on web pages with author avatar badges, read-only permissions enforcement, 0ms local IndexedDB caching, and background delta syncing.
- 💳 **Monetization & Localized Display Pricing**: Multi-currency pricing engine (auto-detecting USD, EUR, GBP, INR, CAD, AUD, BRL, JPY) with Dodo Payments checkout integration.
- 🌐 **Web Dashboard & Settings App**: Built-in Next.js App Router dashboard (`http://localhost:3001`) with Notes Explorer, Timeline Feed, Account Settings, Import/Export, Notion Setup, Connected MCPs, API Tokens, and Billing.

---

## 🏗️ 5-Tier DOM Anchoring System

Stickle solves the problem of brittle web annotations on dynamic modern web apps by using a multi-tiered fallback resolution pipeline.

![5-Tier DOM Anchoring Diagram](./assets/anchoring-diagram.svg)

0. **Tier 0 — DOM Element Fingerprint** *(primary)*: O(1) lookup by `domIndex` (absolute ordinal among all same-tag elements, e.g. the 47th `<p>`) validated against a 60-char `textFingerprint`. Uniquely identifies any element on Wikipedia-style pages with hundreds of repeated tags. Scans ±10 neighbours if index has shifted.
1. **Tier 1 — CSS Selector**: Tries exact DOM matching via optimized CSS selectors (`querySelector`). Fast and precise for stable DOM nodes.
2. **Tier 2 — Text Fragment Quote**: Uses W3C Text Quote matching with exact text, prefix, and suffix contexts. Survives HTML class changes, layout refactors, and framework DOM rebuilds.
3. **Tier 3 — Fuzzy Search**: Uses trigram Dice-coefficient similarity matching against page text nodes. Survives minor copy edits, typos, and phrasing tweaks.
4. **Tier 4 — Stored Page Coordinates**: Absolute `pageX`/`pageY` coords captured at creation time (scroll-independent). Used as a last resort and as the initial position before the DOM is painted.
5. **Tier 5 — Unanchored Fallback**: If element is deleted or page structure changes completely, the note degrades gracefully to a floating page-level note—never losing your content.

**Highlight & Drag Offset Retention**: When sticky notes are dragged or placed on text highlights, their relative `offsetX` and `offsetY` values are preserved relative to target elements and `<mark>` nodes, preventing stickies from snapping back to old positions.

---

## 💻 Running Locally & Dashboard

```bash
# Install dependencies
pnpm install

# Start Extension Dev Server (WXT on http://localhost:3000)
pnpm dev

# Start Web Dashboard Dev Server (Next.js on http://localhost:3001)
pnpm dev:dashboard

# Run Type Checks & Unit Test Suite
pnpm compile && pnpm test
```

---

## 🤖 Model Context Protocol (MCP) Integration

Stickle exposes a **6-Tool Suite** via Model Context Protocol:

| Tool Name | Description |
| :--- | :--- |
| `list_stickle_notes` | List saved notes filtered by domain, tag, or limit |
| `search_stickle_notes` | Full-text search across content, page titles, URLs & tags |
| `get_notes_for_url` | Retrieve all notes anchored to a specific webpage URL |
| `add_stickle_note` | Create and attach a new sticky note to a target webpage URL |
| `export_stickle_summary` | Generate a structured Markdown report grouped by site domain |
| `get_team_activity_timeline` | Retrieve activity timeline for shared workspace notes |

### Claude Desktop Configuration (`claude_desktop_config.json`)
Location: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "stickle": {
      "command": "npx",
      "args": ["-y", "stickle", "mcp"]
    }
  }
}
```

### Remote SSE Transport Configuration (Port `3001`)
```json
{
  "mcpServers": {
    "stickle-remote": {
      "url": "http://localhost:3001/sse",
      "headers": {
        "Authorization": "Bearer YOUR_STICKLE_API_TOKEN"
      }
    }
  }
}
```

---

## 📄 License

MIT © Stickle Team
