# Stickle — Agent Execution Plan

> **Purpose of this doc:** This is written so an AI coding agent (e.g. Claude Code) can execute it phase-by-phase with minimal clarification needed. Each phase has: goal, exact scope, file/folder structure, step-by-step tasks, acceptance criteria, and edge cases to explicitly handle. Do not skip ahead to a later phase until the current phase's acceptance criteria are met. If a decision isn't covered here, make the most conventional choice for a WXT + TypeScript + Preact project and note the decision in a `DECISIONS.md` file at the repo root.

---

## Locked-in architectural decisions (do not re-litigate these)
- **Extension framework:** WXT, Manifest V3, **Chrome only** for v1
- **Language:** TypeScript throughout
- **Storage:** IndexedDB via Dexie.js
- **Anchoring:** 3-tier fallback — CSS selector → text prefix/suffix fragment match → fuzzy match → "unanchored" degrade
- **Sync:** Manual export button to Notion for v1 (no background auto-sync yet)
- **UI stack:** Preact for popup/sidebar
- **Package manager:** pnpm (fallback to npm if pnpm unavailable)
- **Testing:** Vitest for unit tests, Playwright for anchoring/e2e tests against real pages
- **Design files:** ./DESIGN.md, ./stickle_logo_concepts.svg

---

## Repo structure (create this exact layout in Phase 0)
```
stickle/
├── DECISIONS.md          # agent logs any judgment calls made along the way here
├── README.md
├── package.json
├── tsconfig.json
├── wxt.config.ts
├── entrypoints/
│   ├── background.ts
│   ├── content.ts          # injected into all pages
│   └── popup/
│       ├── index.html
│       ├── main.tsx
│       └── App.tsx
├── lib/
│   ├── db.ts               # Dexie schema + CRUD
│   ├── anchoring.ts         # 3-tier anchor create/resolve logic
│   ├── notion.ts            # Notion API client + mapping
│   └── types.ts             # StickleNote and related types
├── components/
│   ├── NoteBubble.tsx        # in-page floating note UI
│   ├── NoteSidebar.tsx        # popup note list/manager
│   └── Settings.tsx
├── tests/
│   ├── anchoring.test.ts
│   ├── db.test.ts
│   └── e2e/
│       └── anchoring.spec.ts   # Playwright, runs against saved HTML fixtures
└── test-fixtures/
    ├── static-page.html
    ├── spa-rerender.html
    └── infinite-scroll.html
```

---

## Phase 0 — Project scaffolding

**Goal:** Empty extension loads in Chrome; background/content/popup can message each other.

**Tasks (in order):**
1. `pnpm dlx wxt@latest init stickle` — choose TypeScript + Preact template. If the CLI doesn't offer Preact directly, scaffold with the vanilla TS template and manually add `preact` + `@preact/preset-vite`.
2. Set up ESLint + Prettier with a standard TS config (`eslint:recommended`, `@typescript-eslint/recommended`).
3. In `wxt.config.ts`, declare permissions: `["storage", "activeTab", "scripting"]`. Do NOT request `<all_urls>` host permission yet — start with `activeTab` and widen only if a real feature needs it in a later phase.
4. Implement a trivial message-passing test:
   - `content.ts` sends `{type: "PING"}` to background on load.
   - `background.ts` responds `{type: "PONG"}`.
   - Log both sides to console so it's verifiable in Chrome DevTools.
5. Confirm popup renders a basic Preact "Hello Stickle" component.
6. Add `pnpm dev` (wxt dev server), `pnpm build`, `pnpm test` scripts to `package.json`.
7. Write a short README section: "How to load this extension in Chrome" (chrome://extensions → Developer mode → Load unpacked → select `.output/chrome-mv3`).

**Acceptance criteria:**
- [ ] `pnpm dev` runs without errors
- [ ] Extension loads as unpacked in Chrome with no manifest errors
- [ ] Console shows PING/PONG round trip on any page load
- [ ] Popup opens and renders Preact content

**Do not proceed to Phase 1 until all boxes are checked.**

---

## Phase 1 — Core note creation & local persistence

**Goal:** Click anywhere on a page → type a note → it persists across reloads (naive anchoring only, no fallback tiers yet).

**Tasks:**
1. Define `StickleNote` type in `lib/types.ts`:
   ```ts
   export interface StickleNote {
     id: string;              // crypto.randomUUID()
     url: string;              // location.href, normalized (strip query params + hash by default — log this choice in DECISIONS.md)
     pageTitle: string;
     content: string;
     anchor: NoteAnchor;
     createdAt: number;
     updatedAt: number;
     syncedToNotion: boolean;
     notionPageId?: string;
   }

   export interface NoteAnchor {
     cssSelector: string;
     textPrefix?: string;
     textSuffix?: string;
     exactText?: string;
     offsetX: number;
     offsetY: number;
     tier: "selector" | "text-fragment" | "fuzzy" | "unanchored";
   }
   ```
2. Set up Dexie in `lib/db.ts`:
   - Table `notes`, indexed by `id`, `url`, `createdAt`.
   - CRUD functions: `createNote`, `getNotesForUrl`, `getAllNotes`, `updateNote`, `deleteNote`.
3. Content script: on a designated trigger (e.g. `Alt+Click`, or a small floating "+ add note" button that appears near the cursor on any click — pick one, document choice in DECISIONS.md), spawn a `NoteBubble` component at the click location with an editable textarea.
4. On save (blur or explicit save button):
   - Compute a **naive CSS selector** for the clicked element (use an existing minimal algorithm: nth-child chain from `body` down to the target element — a small utility function, no external library needed yet).
   - Store `offsetX`/`offsetY` as the click position relative to the target element's bounding box.
   - Persist via `createNote`.
5. On content script load for any page: query `getNotesForUrl(currentUrl)`, and for each note, resolve `cssSelector` via `document.querySelector`, then render a `NoteBubble` positioned at `elementRect + offset`.
6. Note UI: draggable (updates offset on drag end), resizable textarea, a close/delete button, auto-save on edit (debounced, ~500ms).

**Edge cases to handle explicitly:**
- Element no longer exists (`querySelector` returns null) → render note in a small "orphaned notes" tray in the corner rather than silently dropping it (this becomes real fallback logic in Phase 2 — for now just don't lose data).
- Multiple notes on the same page — must not visually collide; simple approach is fine (z-index stacking, slight offset if overlapping).
- Very long note content — cap visible height, allow scroll within the note bubble.

**Acceptance criteria:**
- [ ] Can create a note on a static page (test on Wikipedia or similar), reload, note reappears in the same place
- [ ] Can edit and delete notes
- [ ] Notes for different URLs don't leak into each other
- [ ] Orphaned notes (selector no longer resolves) are visible somewhere, not silently lost

---

## Phase 2 — Robust anchoring (the core hard problem — do not shortcut this)

**Goal:** Notes survive dynamic pages, layout shifts, SPA re-renders, and revisits weeks later.

**Tasks:**
1. Extend `lib/anchoring.ts` with a `createAnchor(element, offsetX, offsetY)` function that captures ALL of:
   - CSS selector (existing, from Phase 1)
   - `textPrefix`: ~40 chars of text immediately before the click point in the DOM text flow
   - `textSuffix`: ~40 chars immediately after
   - `exactText`: the nearest word/phrase at the click point (~10–20 chars)
2. Implement `resolveAnchor(anchor: NoteAnchor): {element: Element, x: number, y: number} | null` with this exact fallback order:
   - **Tier 1:** Try `document.querySelector(anchor.cssSelector)`. If found, use it.
   - **Tier 2:** If Tier 1 fails, search the page's text content for `textPrefix + exactText + textSuffix` as a contiguous match. If found, locate the containing element and compute position.
   - **Tier 3:** If Tier 2 fails, do a fuzzy search: use a simple edit-distance or trigram similarity check (a small local implementation is fine — do not pull in a heavy NLP library) against `exactText` across page text nodes, accept the best match above a similarity threshold (start at 0.75, tune empirically).
   - **Tier 4:** If all fail, return null → caller marks the note `tier: "unanchored"` and it goes into the orphaned notes tray from Phase 1.
3. Update the note's stored `tier` field whenever `resolveAnchor` succeeds, so you can show a subtle visual indicator (e.g. a dashed border) when a note is running on a lower-confidence tier — this is good UX and a good talking point for your portfolio write-up.
4. Build `test-fixtures/`:
   - `static-page.html` — plain HTML, no JS, control case
   - `spa-rerender.html` — a tiny React/Preact page that re-renders its DOM tree on a timer or interaction, to simulate SPA behavior
   - `infinite-scroll.html` — a page that appends content dynamically as you scroll, to simulate Reddit/Twitter-style feeds
5. Write Playwright tests in `tests/e2e/anchoring.spec.ts`:
   - Place a note on each fixture, trigger the fixture's dynamic behavior (re-render / scroll / content change), reload, assert the note re-anchors (check tier reported).
6. Manually test against 3 real-world pages (not fixtures): a Wikipedia article, a Reddit thread, and any React-heavy marketing site. Document results (which tier each landed on) in `DECISIONS.md` or a `TESTING.md`.
7. **Write up the anchoring strategy** in `README.md` or a standalone `ARCHITECTURE.md` — this is explicitly a deliverable, not optional. Include: why 3 tiers, what each catches, what still fails, and the similarity threshold chosen and why.

**Acceptance criteria:**
- [ ] All 3 Playwright fixture tests pass, each demonstrating a different tier resolving correctly
- [ ] Manual test results against 3 real-world pages documented
- [ ] Orphaned/low-confidence notes are visually distinguishable in the UI
- [ ] `ARCHITECTURE.md` write-up exists and explains the anchoring design

**This phase is the core of the project. Do not rush it to reach a "shippable" state faster.**

---

## Phase 3 — Note management UI

**Goal:** See and manage all notes across all sites from one place.

**Tasks:**
1. Build `components/NoteSidebar.tsx`, rendered inside the popup (`popup/App.tsx`).
2. Fetch `getAllNotes()` from Dexie, group by domain/page.
3. Implement search (substring match on `content` and `pageTitle`) and a simple date filter (today / this week / all time).
4. Allow edit/delete directly from the sidebar (writes go through the same `lib/db.ts` functions as the in-page UI — no duplicate logic).
5. Clicking a note in the sidebar opens/focuses that page's tab if open, or opens a new tab to `note.url` if not (use `chrome.tabs` API).
6. Add a placeholder `Settings.tsx` tab (empty for now, Notion config lands here in Phase 4).

**Acceptance criteria:**
- [ ] Popup lists every note across every domain
- [ ] Search and date filter work correctly
- [ ] Edits/deletes in the sidebar reflect immediately in the on-page note (and vice versa) — verify no state drift between content script and popup (both read/write the same Dexie DB, so this should hold, but explicitly test it)

---

## Phase 4 — Notion sync (manual export)

**Goal:** One-click export of a note (or all unsynced notes) into a Notion database.

**Tasks:**
1. Start with a **Notion internal integration token** (user pastes a token + database ID into Settings) rather than full OAuth — faster to build, fine for a personal project; document in DECISIONS.md that OAuth is a stretch item if this becomes a real product.
2. Build `lib/notion.ts`:
   - `pushNoteToNotion(note: StickleNote, config: NotionConfig): Promise<string>` — creates a Notion page in the configured database, maps `content` → page body, `pageTitle`/`url`/`createdAt` → properties. Returns the created `notionPageId`.
   - Handle Notion API 429s with exponential backoff (max ~3 retries).
3. Add "Export to Notion" button per note (in sidebar and/or in-page bubble) and a batch "Export all unsynced" action in the sidebar.
4. On successful export, set `syncedToNotion: true` and store `notionPageId` — re-exporting an already-synced note should update the existing Notion page (via `notionPageId`), not create a duplicate.
5. Settings UI: fields for integration token + database ID, with a "Test connection" button that does a cheap read-only API call to confirm the token/database are valid before saving.

**Acceptance criteria:**
- [ ] A note taken on any page exports correctly to the configured Notion database with correct title/URL/content/timestamp
- [ ] Re-exporting a synced note updates rather than duplicates
- [ ] Rate limit errors are retried, not surfaced as failures to the user unless retries are exhausted
- [ ] Invalid token/database ID is caught by "Test connection" with a clear error message

---

## Phase 5 — Polish & packaging

**Goal:** Ready to submit to Chrome Web Store or show off / link publicly.

**Tasks:**
1. First-run onboarding: on install, open a tab with a short interactive tutorial ("click anywhere on this page to try it").
2. Icon set (16/32/48/128px) and consistent branding colors for the note bubble UI.
3. Error states to handle explicitly: Notion token expired/revoked, IndexedDB quota exceeded, content script failing to inject on a restricted page (chrome:// pages, some PDFs).
4. Finalize `README.md`: what it does, install instructions (until published, "load unpacked" steps), screenshots/gif.
5. Finalize `ARCHITECTURE.md` from Phase 2 into a complete write-up covering data model, anchoring, and sync design — this is the primary artifact for a portfolio/interview conversation.
6. Package for Chrome Web Store submission (`pnpm build`, zip `.output/chrome-mv3`) — actual store submission optional, agent should get the build packaging-ready regardless.

**Acceptance criteria:**
- [ ] Fresh install → onboarding → first note created, no confusion
- [ ] All explicit error states handled gracefully (no silent failures, no uncaught exceptions in console)
- [ ] README and ARCHITECTURE.md complete and accurate
- [ ] Production build succeeds and loads correctly as unpacked extension

---

## Phase 6 — Note Customization & Collapsible UI

**Goal:** Allow users to customize note color themes based on Figma pastel blocks and collapse note bubbles into compact floating chips.

**Tasks:**
1. Update `StickleNote` interface in `lib/types.ts` with `color?: NoteColorBlock` and `collapsed?: boolean`.
2. Add color block CSS utility classes to `styles/design-tokens.css` (`.stickle-bubble-lime`, `.stickle-bubble-lilac`, `.stickle-bubble-cream`, `.stickle-bubble-mint`, `.stickle-bubble-pink`, `.stickle-bubble-coral`, `.stickle-bubble-navy`).
3. Add collapse toggle button `–` to `NoteBubble.tsx`. When collapsed, render a compact pastel pill chip (`📌 Note snippet...`) anchored to the DOM node. Click chip to expand back.
4. Add inline color palette popover (🎨) in `NoteBubble.tsx` header for picking pastel background themes.
5. Add Default Note Color preference setting in `Settings.tsx`.

**Acceptance criteria:**
- [ ] Users can toggle note background colors across all 7 Figma pastel color blocks
- [ ] Notes can be collapsed into compact floating pill chips and expanded back smoothly
- [ ] Note theme color and collapsed state persist across page reloads in IndexedDB/storage

---

## Phase 7 — Text Selection Highlights (Hypothesis-Style)

**Goal:** Select text on any webpage to trigger a floating "📌 Highlight & Note" action and create anchored DOM text highlight overlays.

**Tasks:**
1. Define `NoteHighlightRange` in `lib/types.ts` storing `selectedText`, `startContainerPath`, `startOffset`, `endContainerPath`, `endOffset`.
2. Add text selection listener in `entrypoints/content.ts` (`mouseup`/`selectionchange`) to display a floating action pill near the selection cursor when text (>2 chars) is selected.
3. Clicking "📌 Highlight & Note" wraps the DOM text range in a `<mark class="stickle-highlight-mark">` pastel overlay and attaches the stickle.
4. On page load, resolve saved highlights and apply DOM `<mark>` overlays.

**Acceptance criteria:**
- [ ] Selecting text on any webpage shows floating "📌 Highlight & Note" action chip
- [ ] Clicking creates a sticky note tied to the highlighted text range with visual DOM highlight overlay
- [ ] Text highlights persist and re-render accurately on page reload

---

## Phase 8 — Tags & Tag-Based Filtering

**Goal:** Tag notes directly in the bubble and filter by tags in the popup sidebar.

**Tasks:**
1. Add `tags?: string[]` field to `StickleNote` interface in `lib/types.ts`.
2. Add inline tag editor & chip badges to `NoteBubble.tsx` (`#research`, `#todo`, `#important`).
3. Build interactive horizontal tag filter bar (`#all`, `#research`, `#todo`, etc.) in `NoteSidebar.tsx`.
4. Update `getNotesForUrl` and `getAllNotes` search filtering in `lib/db.ts` to support multi-tag filtering.

**Acceptance criteria:**
- [ ] Users can add, edit, and remove tags on notes in the floating bubble UI
- [ ] NoteSidebar/Popup displays active tag chips and filters notes by selected tag
- [ ] Substring search matches tag names as well as note content

---

## Phase 9 — Sharable Notes (Import & Export JSON)

**Goal:** Export notes to a portable JSON format and import JSON notes into Stickle.

**Tasks:**
1. Build `lib/export-import.ts`:
   - `exportNotesToJson(notes: StickleNote[], filename?: string)`
   - `importNotesFromJson(jsonString: string)` with schema version validation and duplicate merge logic.
2. Add "Export Notes (.json)" and "Import Notes (.json)" buttons in `NoteSidebar.tsx` and `Settings.tsx`.
3. Continuously sync notes to local data file `~/.stickle/notes.json` for MCP server access.

**Acceptance criteria:**
- [ ] Exporting produces a clean, valid `stickle_export_YYYY-MM-DD.json` file containing all note anchors, colors, tags, and timestamps
- [ ] Importing a JSON export restores all notes without duplicate conflicts
- [ ] Writes notes to `~/.stickle/notes.json`

---

## Phase 10 — Grouped Notion Sync Restructuring

**Goal:** Group all notes for the same Web Page URL into a single Notion Page, eliminating duplicate Notion page entries.

**Tasks:**
1. Update `lib/notion.ts` to query Notion database for an existing page matching the web page `URL`.
2. If page exists, append a formatted Callout block / Toggle block inside that single Notion page instead of creating a new page.
3. If page does not exist, create 1 master Notion page for the web URL and append the note block inside it.
4. Update `tests/notion.test.ts` to verify page grouping behavior.

**Acceptance criteria:**
- [ ] Multiple notes on the same URL export into 1 single Notion page with nested callouts
- [ ] Re-exporting or batch exporting does not create duplicate Notion database pages

---

## Phase 11 — Model Context Protocol (MCP) Server Integration

**Goal:** Enable AI agents (Claude Desktop, Antigravity, Cursor) to query, search, create, and summarize browser notes via Model Context Protocol.

**Tasks:**
1. Create `mcp-server/index.ts` using `@modelcontextprotocol/sdk` with STDIO transport.
2. Implement MCP tools:
   - `list_stickle_notes`: List notes filtered by `domain`, `tag`, or `limit`.
   - `search_stickle_notes`: Keyword & tag search.
   - `get_notes_for_url`: Notes pinned to a specific URL.
   - `add_stickle_note`: Create new web note.
   - `export_stickle_summary`: Generate Markdown synthesis report of web notes grouped by site.
3. Add `"mcp": "ts-node mcp-server/index.ts"` script to `package.json`.

**Acceptance criteria:**
- [ ] MCP server starts cleanly and responds to standard STDIO RPC requests
- [ ] AI agents can execute `search_stickle_notes` and `export_stickle_summary` to query browser notes

---

## Rules for the agent executing this plan
1. Work through phases strictly in order. Do not begin a phase whose predecessor's acceptance criteria are unchecked.
2. Log every non-trivial judgment call in `DECISIONS.md` with a one-line rationale.
3. Do not introduce new external dependencies beyond what's named in this doc without noting the reason in `DECISIONS.md`.
4. If an acceptance criterion cannot be met, stop and surface the blocker.