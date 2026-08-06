# Stickle — Architectural & Design Decisions

This log records non-trivial decisions made during the development of Stickle.

---

## Phase 0 — Project Scaffolding & Initial Setup

### 1. Logo & Visual Branding
- **Decision:** Selected Concept 3 (Anchor Pin) from `stickle_logo_concepts.svg` as the official logo mark.
- **Rationale:** Symbolizes DOM anchoring — the core technical differentiator of Stickle. The mark features a dark rounded square (`#1a1a1a`, `rx=10`) with an offset white anchor pin dot in the bottom-right corner (`cx=31, cy=31`).

### 2. Design Tokens & Styling Strategy
- **Decision:** Implemented `styles/design-tokens.css` carrying Figma marketing-inspired monochrome core + oversized pastel color block surfaces (`block-lime`, `block-lilac`, `block-cream`, `block-mint`, `block-pink`, `block-coral`, `block-navy`).
- **Rationale:** Adheres strictly to `DESIGN.md` rules — pill CTAs (`rounded.pill`), 8px grid system, crisp typography hierarchy with Inter / system sans and JetBrains Mono for eyebrow headers.

### 3. Package Manager & Framework Choices
- **Decision:** WXT (Manifest V3, Chrome focused), TypeScript, Preact + `@preact/preset-vite`, Dexie.js for IndexedDB.
- **Rationale:** Strict adherence to locked-in decisions in `PLAN.md`.

### 4. Permissions Policy
- **Decision:** Restricted v1 manifest permissions to `["storage", "activeTab", "scripting"]`.
- **Rationale:** Minimizes extension permission footprint; avoids requesting `<all_urls>` until required by background sync features.

---

## Phase 2 — Robust DOM Anchoring Strategy

### 5. Fuzzy Match Algorithm & Similarity Threshold
- **Decision:** Implemented zero-dependency character trigram set matching in `lib/anchoring.ts` with a strict `0.75` acceptance threshold.
- **Rationale:** Keeps extension payload lightweight (< 100KB) without external heavy NLP packages while effectively catching minor copy edits and typo fixes.

### 6. Progressive Visual Confidence Indicators
- **Decision:** Styled note bubbles with tier-specific border patterns (solid for Tier 1, dashed indigo for Tier 2, dotted amber for Tier 3, solid red for Tier 4) and distinct eyebrow badges.
- **Rationale:** Provides transparent UX feedback to users regarding how confident the extension is in the note's anchored position.

### 7. Playwright E2E Test Suite
- **Decision:** Added `@playwright/test` for E2E verification against HTML test fixtures (`static-page.html`, `spa-rerender.html`, `infinite-scroll.html`).
- **Rationale:** Validates real browser DOM rendering, layout calculation, and element positioning under dynamic mutations.

---

## Phase 3 — Note Management UI

### 8. Popup Navigation & Multi-View Layout
- **Decision:** Structured popup UI (`App.tsx`) with a pill navigation bar supporting `All Notes`, `Active Tab Notes`, and `Settings` views.
- **Rationale:** Gives instant visibility into notes attached to the current page while maintaining a domain-grouped global view.

### 9. Substring Search & Relative Date Filtering
- **Decision:** Implemented zero-dependency substring matching (across `content`, `pageTitle`, and `url`) and date filters (`all`, `today`, `week`) in `NoteSidebar.tsx`.
- **Rationale:** Enables fast client-side filtering without heavy search dependencies.

### 10. Intelligent Tab Switching Logic
- **Decision:** Clicking a note card in `NoteSidebar.tsx` checks open tabs via `chrome.tabs.query` and focuses the matching tab/window if open, or creates a new tab if not.
- **Rationale:** Prevents tab duplication and delivers seamless navigation back to anchored context on any webpage.

### 11. Notion Credentials Storage Pattern & Security Hardening
- **Decision:** Saved Notion integration credentials (`notionApiKey`, `notionDatabaseId`) exclusively in extension-isolated `chrome.storage.local`. Completely eliminated `localStorage` API key storage fallback.
- **Rationale:** Prevents exposing sensitive Notion integration tokens in unencrypted web page `localStorage`. In standalone web/demo contexts, credentials remain in transient memory state only.

---

## Phase 4 — Notion Sync (Manual Export)

### 12. Notion Integration Token & Database URL Normalization
- **Decision:** Authenticated Notion requests using Internal Integration Tokens (`secret_...`) and automatically normalized database inputs (raw 32-character hex, UUIDs with hyphens, or full Notion database URLs via regex).
- **Rationale:** Minimizes user configuration friction when setting up Notion database exports.

### 13. Page Creation vs Patch Property Update Strategy
- **Decision:** Created new Notion pages via POST `/v1/pages` for unsynced notes, and updated properties via PATCH `/v1/pages/:id` plus block appends for re-synced notes, updating `syncedToNotion` and `notionPageId` in DB upon completion.
- **Rationale:** Prevents duplicate page generation in Notion databases when notes are re-exported after editing.

### 14. Exponential Backoff for Notion API Rate Limits (429)
- **Decision:** Wrapped all Notion API calls in `fetchWithRetry` with exponential backoff (`Math.pow(2, attempt) * 500ms`) and `Retry-After` header parsing up to 3 retries.
- **Rationale:** Ensures resilient batch exporting without failing user requests due to Notion rate limiting.

### 15. Background Service Worker Proxying for CORS Bypass
- **Decision:** Added `host_permissions: ['https://api.notion.com/*']` in manifest and routed content script / popup Notion API requests through `entrypoints/background.ts` via message passing.
- **Rationale:** Browsers block cross-origin `fetch` calls to `api.notion.com` from web page content script origins. Extension background service workers with host permissions execute external API fetches without CORS restrictions.

### 16. Dynamic Notion Database Schema & Property Inspection
- **Decision:** Inspected target Notion database schema (`GET /v1/databases/:id`) dynamically to auto-detect title property keys and optional `URL` properties before building page creation/update payloads. Always embedded URL as a clickable bookmark link inside the page callout body block.
- **Rationale:** Resolves `URL is not a property that exists` errors for user Notion databases that do not contain a property named `URL` of type `url`.

---

## Phase 5 — Polish & Packaging

### 17. Interactive Onboarding Sandbox Page
- **Decision:** Created an onboarding HTML entrypoint (`entrypoints/onboarding/`) that automatically launches via `chrome.tabs.create` on extension install (`details.reason === 'install'`).
- **Rationale:** Provides immediate visual guidance, interactive practice note creation, and 3-tier anchoring confidence tier explanations for first-time users.

### 18. PNG Icon Generation & Manifest Declaration
- **Decision:** Created 16x16, 32x32, 48x48, and 128x128 PNG icon assets in `public/icon/` matching the Stickle Anchor Pin logo mark and declared them under `icons` and `action.default_icon` in `wxt.config.ts`.
- **Rationale:** Ensures clean icon representation across Chrome toolbar, context menus, and extensions manager (`chrome://extensions`).

### 19. Human-Friendly Error State Mapping
- **Decision:** Standardized HTTP status codes (401 invalid token, 403 missing database access, 404 database not found) into clear actionable user messages, and added storage quota exception catching in `lib/db.ts`.
- **Rationale:** Prevents cryptic API exception dumps and gives users actionable resolution steps in the UI.

---

## Phase 6 — Note Customization & Collapsible UI

### 20. Signature Color Block Swatch Dictionary
- **Decision:** Defined `COLOR_SWATCHES` in `components/NoteBubble.tsx` mapping `lime`, `lilac`, `cream`, `mint`, `pink`, `coral`, and `navy` to exact hex codes and background/text contrast pairs.
- **Rationale:** Ensures strict adherence to `DESIGN.md` pastel block specs and guarantees text readability across light pastels and dark navy (`#1e2038`).

### 21. Collapsible Note Chip Pointer Handler
- **Decision:** Implemented drag vs click detection (`hasDraggedRef`) on compact pill chips.
- **Rationale:** Allows users to smoothly drag collapsed note chips across the screen to reposition them without accidentally triggering expansion on drop.

### 22. Default Color Preference Persistence
- **Decision:** Saved `defaultNoteColor` preference in `chrome.storage.local` with fallback to `localStorage`.
- **Rationale:** Allows user to configure their preferred default note theme in Settings and automatically applies it to newly created notes on Alt+Click.

---

## Phase 7 — Text Selection Highlights (Hypothesis-Style)

### 23. Range Path Serialization & Text Fallback Strategy
- **Decision:** Implemented `serializeRange` in `lib/highlighting.ts` storing `startContainerPath`, `startOffset`, `endContainerPath`, `endOffset`, and `selectedText`, backed by a fallback text search (`findTextRangeByContent`) if DOM structure shifts.
- **Rationale:** Ensures text highlights remain resilient to minor DOM structure alterations or re-renders across page reloads.

### 24. Floating Selection Pill Positioning & Triggering
- **Decision:** Attached `mouseup` and `selectionchange` event listeners to monitor text selection (>2 chars) outside the extension host container, positioning a floating `📌 Highlight & Note` action pill above the selection center point.
- **Rationale:** Delivers a seamless Hypothesis-style highlighting workflow without interfering with normal text copying or context menus.

---

## Phase 8 — Tags & Tag-Based Filtering

### 26. Inline Tag Input Normalization & Chip Management
- **Decision:** Implemented inline tag input editor in `NoteBubble.tsx` converting tag inputs to lowercase, stripping leading `#` symbols, and handling `Enter`/`Comma` key events to create tag chips.
- **Rationale:** Ensures clean, normalized tag strings without duplicate or malformed entries.

---

## Phase 9 — Sharable Notes (Import & Export JSON)

### 28. Standardized Export Package Schema (`stickle_export_YYYY-MM-DD.json`)
- **Decision:** Designed versioned export package wrapper (`version: 1`, `exportedAt`, `notesCount`, `notes`) and `generateExportFilename` helper producing `stickle_export_YYYY-MM-DD.json`.
- **Rationale:** Ensures backward/forward schema compatibility and clean automated file downloads in browser environments.

### 29. Smart Duplicate Resolution & Timestamp-Based Merge
- **Decision:** Implemented `importNotesFromJson` validating schema structure, creating new notes, and updating existing notes (`id` match) only if the imported note has a strictly newer `updatedAt` timestamp.
- **Rationale:** Prevents data duplication during backup restoration while avoiding accidental overwrites of newer local edits.

### 30. Dual-Environment Local Disk Sync & Bundle Hygiene Decoupling
- **Decision:** Maintained `formatLocalSyncJson` for pure string formatting and decoupled Node.js disk filesystem calls (`fs`/`path`/`os`) from browser export modules.
- **Rationale:** Ensures browser extension bundles (`wxt build`) remain lightweight, fast, and 100% free of Node.js polyfill stubs or dynamic `require` warnings.

---

## Phase 10 — Grouped Notion Sync Restructuring

### 31. Master Page per URL & Block Callout Appending Strategy
- **Decision:** Implemented `findExistingPageForUrl` querying Notion database (`POST /v1/databases/:id/query`) to locate master pages matching note URLs, appending individual notes as 📌 Callout blocks via `PATCH /v1/blocks/:id/children` instead of creating multiple pages per URL.
- **Rationale:** Prevents page sprawl in Notion databases by grouping all annotations for the same web page into a single master Notion document.

### 32. In-Memory Batch Export URL Cache
- **Decision:** Introduced an in-memory `pageCache: Map<string, string>` across batch export cycles (`exportUnsyncedNotesBatchDirect`).
- **Rationale:** Ensures multiple unsynced notes sharing the same URL immediately reuse the newly created master Notion page ID during a single batch sync without triggering redundant database query requests or race conditions.

---

## Phase 11 — Model Context Protocol (MCP) Server Integration

### 33. STDIO Transport MCP Server Architecture
- **Decision:** Built `mcp-server/index.ts` using `@modelcontextprotocol/sdk` configured with `StdioServerTransport` and `"mcp": "tsx mcp-server/index.ts"` script entrypoint.
- **Rationale:** Provides universal standard I/O communication compatible with AI tools (Claude Desktop, Antigravity, Cursor) without requiring a HTTP listener or network port allocation.

### 34. Decoupled Environment Data Resolution & Storage Fallback
- **Decision:** Designed `getNotesPath` targeting `~/.stickle/notes.json` with fallback to `STICKLE_NOTES_PATH` environment variable.
- **Rationale:** Allows unit tests to run isolated temporary directory tests without mutating production browser note storage.

### 35. Structured Domain Synthesis & 5-Tool MCP Suite
- **Decision:** Implemented `list_stickle_notes`, `search_stickle_notes`, `get_notes_for_url`, `add_stickle_note`, and `export_stickle_summary` returning Markdown reports and JSON data models.
- **Rationale:** Gives AI agents complete read, search, write, and summary capabilities over browser sticky notes.









