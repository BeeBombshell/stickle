# AGENTS.md — Stickle (Open Source Core)

## 📌 Project Overview

**`stickle`** is the open-source core browser extension (MV3) and local-first dashboard for anchoring floating sticky notes to dynamic web content.

- **Repository:** `BeeBombshell/stickle`
- **Scope:** 5-Tier DOM anchoring engine, text selection highlighting, Dexie.js (IndexedDB) local storage, Preact UI, local MCP server, basic JSON export/import.
- **License:** MIT

---

## 🏗️ Architecture & Technology Stack

- **Extension Framework:** [WXT](https://wxt.dev/) (Vite-based Manifest V3 extension bundler)
- **UI Framework:** Preact (with Tailwind CSS / CSS Modules in dashboard)
- **Storage Layer:** Local-first IndexedDB via `dexie`
- **Dashboard:** Next.js 16 (App Router) in `dashboard/`
- **Anchoring Engine:** 5-Tier DOM Anchoring System (`lib/anchoring.ts`)
  - Tier 0: DOM Element Fingerprint (`domIndex` + 60-char text hash)
  - Tier 1: Optimized CSS Selectors
  - Tier 2: W3C Text Quote Match (prefix, quote, suffix)
  - Tier 3: Trigram Fuzzy Matching
  - Tier 4: Page Absolute Coordinates (`pageX`, `pageY`)
  - Tier 5: Floating Fallback
- **AI & Context:** Model Context Protocol (MCP) servers (`mcp-server/` stdio & `remote-mcp/` SSE)
- **Testing:** Vitest + Playwright (E2E)

---

## 📁 Codebase Layout

```
├── assets/             # Extension icons, diagrams, banners
├── components/         # Preact UI components (StickyNote, ColorPicker, etc.)
├── dashboard/          # Next.js 16 Web Dashboard & Settings App
├── entrypoints/        # WXT entrypoints (content script, background, popup)
│   ├── background.ts   # MV3 service worker
│   ├── content.ts      # In-page DOM injection & highlight anchors
│   └── popup/          # Extension popup UI
├── lib/                # Core business logic & utilities
│   ├── anchoring.ts    # 5-Tier DOM anchoring pipeline
│   ├── auth.ts         # Authentication & token handlers
│   ├── db.ts           # Dexie IndexedDB models & queries
│   ├── highlighting.ts # DOM text range selection & <mark> injection
│   ├── sync.ts         # Sync manager (Local vs Remote)
│   ├── types.ts        # Shared TypeScript interfaces & types
│   └── workspace.ts    # Workspace filtering & state
├── mcp-server/         # Local stdio MCP server for Claude/Cursor
├── remote-mcp/         # Remote SSE MCP endpoint
├── public/             # Static public assets
├── scripts/            # Database migration & utility scripts
├── styles/             # Global CSS and themes
└── wxt.config.ts       # WXT Extension configuration
```

---

## 🛠️ Common Commands

```bash
# Install dependencies
pnpm install

# Start extension in development mode (Chromium)
pnpm dev

# Start extension in Firefox mode
pnpm dev:firefox

# Build extension for production
pnpm build

# Start Next.js dashboard
pnpm dev:dashboard

# Run type check & unit tests
pnpm compile
pnpm test
```
