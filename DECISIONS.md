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

### 11. Notion Credentials Storage Pattern
- **Decision:** Saved Notion integration credentials (`notionApiKey`, `notionDatabaseId`) in `chrome.storage.local` with fallback to `localStorage`.
- **Rationale:** Prepares credential persistence for Phase 4 Notion export integration.

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



