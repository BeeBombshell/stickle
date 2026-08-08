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

---

## Phase 12 — Positioning Accuracy & Multi-Tab Performance

### 36. DOM Element Fingerprint for Unique Anchor Identification
- **Decision:** Added `domIndex` (absolute ordinal among all same-tag elements) and `textFingerprint` (first 60 chars of normalized text) to `NoteAnchor`. Resolution uses `querySelectorAll(domTag)[domIndex]` as a new **Tier 0** before the existing CSS selector tier.
- **Rationale:** Pages like Wikipedia contain hundreds of `<p>` tags sharing the same `.mw-parser-output` container. The old CSS selector (`div.mw-parser-output > p:nth-of-type(3)`) was ambiguous and caused notes to snap to the wrong paragraph. `domIndex` provides an O(1) unambiguous lookup; `textFingerprint` cross-validates it and triggers a ±10 neighbour scan if the index has shifted due to content changes.

### 37. Absolute Page Coordinates (pageX/pageY)
- **Decision:** Added `pageX` and `pageY` to `NoteAnchor`, storing `scrollX + rect.left + offsetX` at creation time (scroll-independent).
- **Rationale:** The previous coordinate system stored only element-relative offsets and recomputed absolute position via `getBoundingClientRect()` on every resolve. On Wikipedia, body margin/padding caused `bodyLeft`/`bodyTop` to be non-zero, introducing drift on each recalculation. Storing absolute coords at creation time eliminates this drift and provides a reliable fallback (Tier 4) when all DOM-based tiers fail.

### 38. isDomPainted() Guard on resolveAnchor
- **Decision:** Added a `isDomPainted()` check at the top of `resolveAnchor()`. If the DOM is not yet fully laid out (readyState not complete/interactive, or probe element has zero dimensions), resolution skips `getBoundingClientRect()` and returns `pageX`/`pageY` directly.
- **Rationale:** `refreshNotes()` was called immediately on content script injection, before the browser had painted the page. All elements returned `getBoundingClientRect() = {0,0}`, placing every stickle at the top-left corner. They then redistributed after the first `MutationObserver` callback. The guard eliminates this accumulation artefact.

### 39. Deferred Initial Load via scheduleInitialRefresh
- **Decision:** Replaced `await refreshNotes()` on injection with `scheduleInitialRefresh()`, which calls `refreshNotes()` immediately if `readyState === 'complete'`, or waits for the `load` event otherwise.
- **Rationale:** Complements the `isDomPainted()` guard by ensuring the initial anchor resolution is not attempted before the DOM is available, without adding an arbitrary `setTimeout`.

### 40. Structural-Only MutationObserver (Remove characterData)
- **Decision:** Removed `characterData: true` from the `MutationObserver` options and changed the trigger condition from `!isInternalMutation` (all mutations) to `hasStructuralChange` (`childList` mutations only).
- **Rationale:** Wikipedia uses `characterData` DOM mutations to update its scrolling TOC section highlight on every scroll event. This caused `debouncedReanchor()` to fire constantly as the user scrolled, triggering unnecessary `getBoundingClientRect()` calls and producing coordinate drift mid-scroll. Filtering to structural changes only eliminates this noise.

### 41. In-Flight Guard & Visibility-Aware Refresh
- **Decision:** Added `refreshInFlight` boolean flag and `document.hidden` check to `refreshNotes()`. When a refresh is in-flight, subsequent calls are no-ops. When the tab is hidden, refresh is deferred until the next `visibilitychange` event.
- **Rationale:** With multiple tabs open, each tab's `MutationObserver` and `chrome.storage.onChanged` listener could stack up concurrent `refreshNotes()` calls. The in-flight guard prevents these from compounding. The visibility check prevents hidden tabs from performing expensive DOM traversal (Tiers 2 & 3) while the user is on a different tab, keeping background CPU usage near zero.

### 42. Removed Duplicate chrome.storage.onChanged Listener
- **Decision:** Removed the second `chrome.storage.onChanged` listener (lines 370–376) that was registered inside `main()` after `refreshNotes()` was already defined. The first listener (lines 33–39) remains.
- **Rationale:** Both listeners triggered `refreshNotes()` on `stickle_notes` changes, causing every storage write to fire two refreshes — doubling DOM traversal work and triggering the accumulation bug twice on each note create/update.

### 43. Removed Redundant resolveAnchor Call in renderNoteWrapper
- **Decision:** Removed the `resolveAnchor(note.anchor)` call inside `renderNoteWrapper()` and replaced the `initialX ?? resolved.x` pattern with `initialX ?? note.anchor.pageX ?? 60`.
- **Rationale:** `renderNoteWrapper()` received `initialX`/`initialY` from `refreshNotes()`, which had already called `resolveAnchor()`. The internal re-resolve was redundant and, when called during the not-yet-painted phase, returned `(0,0)` — overriding the correct coords passed in from the caller.

---

## Phase 13 — Feature Flags, Auth & Cross-Device Cloud Sync Engine

### 45. Open-Core Feature Flag Architecture
- **Decision:** Implemented `lib/flags.ts` with tier-based evaluation (`free`, `supporter`, `team_member`) covering `cloudSync`, `teamSharing`, `remoteMCP`, and `centralDashboard`. Popup UI displays crisp "Coming Soon — Pro" badges based on feature flag status adhering to `DESIGN.md`.
- **Rationale:** Keeps core offline web note anchoring 100% free and open-source while enforcing server-validated feature access for cloud sync and remote MCP capabilities.

### 46. Supabase Magic Link PKCE Authentication & Extension Callback
- **Decision:** Integrated Supabase Auth in `lib/auth.ts` with PKCE redirect flow pointing to a dedicated extension HTML entrypoint (`entrypoints/auth-callback/`).
- **Rationale:** Extension popup environments cannot process standard web OAuth redirects cleanly. Dedicated extension callback pages capture session tokens from the URL hash, store session tokens in extension-isolated storage, and close automatically.

### 47. Local-First Delta Cloud Sync & Last-Write-Wins (LWW) Resolution
- **Decision:** Built `lib/sync.ts` using a local-first architecture (Dexie / chrome.storage as local source of truth), delta push/pull sequence (`pushPendingNotes`, `pullRemoteNotes`), soft-delete tombstoning (`deletedAt`), and Supabase Realtime WebSocket subscriptions.
- **Rationale:** Ensures extension functions 100% offline without latency. When online, pending edits queue automatically and push to Supabase, merging changes across devices via Last-Write-Wins with explicit conflict flagging (`syncStatus: 'conflict'`).

### 48. Extension Popup UI Boundaries & Matrix Layout Design
- **Decision:** Adjusted popup container width to 390px with `overflowX: 'hidden'`, stacked the Magic Link sign-in form vertically with a full-width pill button (`{rounded.pill}`), and redesigned the 2x2 Feature Access Matrix grid to truncate cleanly (`text-overflow: ellipsis`) with short badges (`ON`, `PRO`, `TEAMS`).
- **Rationale:** Prevents text clipping and horizontal scrollbars in Chrome popup bounds while keeping UI strictly in accordance with `DESIGN.md`.

### 49. Official Anchor Pin Extension List Logo Generation
- **Decision:** Generated high-resolution, anti-aliased RGBA PNG icon assets for Chrome extension list and toolbar icons (`public/icon/16.png`, `public/icon/32.png`, `public/icon/48.png`, `public/icon/128.png`) matching the official Concept 3 Anchor Pin logo mark (`#111111` dark tile with `cx=31, cy=31` white outer & dark inner pin dot) via `scripts/generate-icons.js`. Updated popup header lockup in `entrypoints/popup/App.tsx` to match.
- **Rationale:** Ensures Chrome extension list (`chrome://extensions`) and Chrome browser toolbar display the crisp, authentic Stickle logo mark.

### 50. Dropped Magic Link & Password Auth → OAuth-Only (Google + GitHub)
- **Decision:** Removed `signInWithMagicLink`, `signUpWithPassword`, and all dead code from `lib/auth.ts`. Auth UI in `Settings.tsx` now shows stacked Google and GitHub OAuth buttons with official brand SVG logos (no emojis). Popup UX cleaned up: removed ambiguous green status dot from logo lockup, replaced 📌 emoji empty state with anchor-pin SVG, and added text-overflow protection to the "Add Note" CTA.
- **Rationale:** Magic link OTP hit Supabase's 2 req/hr/project free-tier limit immediately — non-starter for production. Email/password adds unnecessary complexity (password reset, verification emails) for a developer tool. OAuth-only (Google + GitHub) is rate-limit-free, frictionless, and appropriate for the target audience. `signInWithOAuth` was already correctly implemented for MV3 PKCE flow with `skipBrowserRedirect` + `chrome.tabs.create`. Brand SVG logos maintain visual consistency with the extension's icon-only design system.



---

## Phase 14 — Central Web Dashboard & Site Metadata

### 51. Standalone Next.js 15 App Router Architecture (`dashboard/`)
- **Decision:** Scaffolded the Central Web Dashboard in a separate top-level `dashboard/` directory using Next.js 15 App Router, TypeScript, and TailwindCSS with `@supabase/ssr`.
- **Rationale:** Ensures 100% decoupling between the Chrome extension bundle (`.output/chrome-mv3`, ~153KB) and the web app, maintaining zero bundle inflation or execution latency for extension users.

### 52. Strict Design Tokens & Holygrail Page Alignment
- **Decision:** Applied the exact `styles/design-tokens.css` system tokens across the dashboard (`display-lg`, `subhead`, `card-title`, `eyebrow`, `.color-block`, `.btn-pill`, `.btn-primary`, `.btn-secondary`, `.btn-lime`). Aligned navbar logo lockups, fonts (`Inter` + `JetBrains Mono`), and button pill radiuses with landing (`index.html`) and onboarding (`onboarding.html`) pages.
- **Rationale:** Guarantees a cohesive, editorial black-and-white marketing frame with signature pastel color blocks and signature Block Lime (`#e4f579`) active accents.

### 53. Signature Lime Accent Active States & Iconography
- **Decision:** Styled all active navigation pills, active domain filters, search result counters, active tag badges, and timeline live-pulse indicators with signature Block Lime (`#e4f579`).
- **Rationale:** Enforces `DESIGN.md` guidelines for active tab states and brand accent identity across the web dashboard UI.

### 54. SEO Metadata, OpenGraph Cards, and SVG Favicon Suite
- **Decision:** Added full site metadata (`title`, `description`, `keywords`, `themeColor: #111111`) with Next.js 15 App Router Metadata API, along with OpenGraph (`/og-image.svg`) preview cards and SVG favicons (`/icon.svg`) featuring the official white anchor pin dot on a dark tile (`#111111`).
- **Rationale:** Ensures high-converting social sharing cards on Twitter/LinkedIn and sharp icon branding in browser tabs.

---

## Phase 15 — Hosted Remote MCP Server (HTTP/SSE)

### 55. Hono-Based Standalone Remote MCP Architecture & Bearer API Key Auth
- **Decision:** Built `remote-mcp/` as a standalone Hono microservice supporting HTTP/SSE transport (`GET /sse`, `POST /message`) via `@modelcontextprotocol/sdk`. Authenticates Bearer API keys (`sk_stickle_...`) by validating SHA-256 hashes against `public.api_keys` in Supabase using the service role key. Implemented 6 MCP tools: `list_stickle_notes`, `search_stickle_notes`, `get_notes_for_url`, `add_stickle_note`, `export_stickle_summary`, and `get_team_activity_timeline`. Included Cloudflare Workers (`wrangler.toml`) and self-hosting documentation (`README.md`).
- **Rationale:** Enables AI assistants (Claude Desktop, Cursor, Antigravity) to query, search, create, and summarize web sticky notes over HTTPS without requiring the browser extension or a local stdio process to be running on the user's machine.


