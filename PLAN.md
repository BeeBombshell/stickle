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
- [x] Exporting produces a clean, valid `stickle_export_YYYY-MM-DD.json` file containing all note anchors, colors, tags, and timestamps
- [x] Importing a JSON export restores all notes without duplicate conflicts
- [x] Writes notes to `~/.stickle/notes.json`

---

## Phase 10 — Grouped Notion Sync Restructuring

**Goal:** Group all notes for the same Web Page URL into a single Notion Page, eliminating duplicate Notion page entries.

**Tasks:**
1. Update `lib/notion.ts` to query Notion database for an existing page matching the web page `URL`.
2. If page exists, append a formatted Callout block / Toggle block inside that single Notion page instead of creating a new page.
3. If page does not exist, create 1 master Notion page for the web URL and append the note block inside it.
4. Update `tests/notion.test.ts` to verify page grouping behavior.

**Acceptance criteria:**
- [x] Multiple notes on the same URL export into 1 single Notion page with nested callouts
- [x] Re-exporting or batch exporting does not create duplicate Notion database pages

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
- [x] MCP server starts cleanly and responds to standard STDIO RPC requests
- [x] AI agents can execute `search_stickle_notes` and `export_stickle_summary` to query browser notes

---

## Rules for the agent executing this plan
1. Work through phases strictly in order. Do not begin a phase whose predecessor's acceptance criteria are unchecked.
2. Log every non-trivial judgment call in `DECISIONS.md` with a one-line rationale.
3. Do not introduce new external dependencies beyond what's named in this doc without noting the reason in `DECISIONS.md`.
4. If an acceptance criterion cannot be met, stop and surface the blocker.

---

---

# Stickle v2 — Backend, Cloud Sync, Team Workspaces, Web Dashboard & Remote MCP

> **Philosophy**: The core extension (local-first notes, 3-tier anchoring, Notion export, local MCP) remains **free and open source forever**. Cloud backend features are gated behind an Open-Core subscription model.

## Locked-in v2 architectural decisions

- **Backend / Database**: Supabase (PostgreSQL + Row-Level Security + Realtime WebSockets)
- **Auth**: Supabase Auth with PKCE flow (Chrome MV3 extension-compatible)
- **Web Dashboard**: Next.js 15 (App Router) + TailwindCSS + Shadcn/UI, hosted on Vercel
- **Remote MCP**: HTTP/SSE transport via `@modelcontextprotocol/sdk`, hosted on Cloudflare Workers or Railway
- **Payments**: LemonSqueezy (handles global merchant of record, VAT, license key generation) or Stripe Checkout
- **Sync Strategy**: Local-first (Dexie remains source of truth), delta sync to Supabase on changes; Last-Write-Wins conflict resolution keyed on `updatedAt`
- **Feature Flag evaluation**: Client-side for UX (show "Coming Soon" UI); server-side RLS and API key checks for enforcement — extension codebase stays fully open source

## Open-Core feature scope

| Feature | Free | Pro ($29 one-time) | Teams ($9/user/mo) |
|---|:---:|:---:|:---:|
| Local Web Notes (3-Tier Anchoring) | ✅ | ✅ | ✅ |
| Local Notion Export | ✅ | ✅ | ✅ |
| Offline Storage (IndexedDB) | ✅ | ✅ | ✅ |
| Local STDIO MCP Server | ✅ | ✅ | ✅ |
| Cross-Device Cloud Sync | ❌ | ✅ | ✅ |
| Central Web Dashboard | ❌ | ✅ | ✅ |
| Personal Remote MCP (HTTPS/SSE) | ❌ | ✅ | ✅ |
| Team Shared In-Page Annotations | ❌ | ❌ | ✅ |
| Team Timeline & Author Badges | ❌ | ❌ | ✅ |
| Workspace Roles & Audit Log | ❌ | ❌ | ✅ |

---

## Phase 12 — Standalone Waitlist Page & Lead Capture

**Goal:** Add a dedicated standalone Waitlist page (`/waitlist` mapped to `entrypoints/waitlist/` -> `waitlist.html`) and homepage lead capture to collect early-access signups for Stickle Pro & Cloud Sync, persisting leads to a Supabase database (with local fallback/caching) and tracking conversion events via PostHog.

**New & modified files:**
```
entrypoints/waitlist/
├── index.html          # HTML entrypoint for /waitlist route
├── main.tsx            # Preact entry point
└── App.tsx             # Standalone Waitlist page with Hero, Form, 4-card feature teasers, FAQ & Footer
entrypoints/landing/
├── App.tsx             # Add hero waitlist CTA & navigation link to /waitlist.html
├── WaitlistForm.tsx    # Standalone Preact waitlist component with email validation & success toast
lib/
└── waitlist.ts         # Supabase client / REST API integration for waitlist persistence & localStorage caching
supabase/
└── schema.sql          # Add waitlist table & public RLS insert policy
vercel.json             # Added rewrite rule: { "source": "/waitlist", "destination": "/waitlist.html" }
```

**Tasks:**
1. **Supabase Schema for Waitlist**:
   - Add `waitlist` table definition to `supabase/schema.sql`:
     ```sql
     CREATE TABLE IF NOT EXISTS public.waitlist (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       email TEXT UNIQUE NOT NULL,
       use_case TEXT,
       source TEXT DEFAULT 'homepage',
       created_at TIMESTAMPTZ DEFAULT now()
     );
     ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
     CREATE POLICY "Enable public insert for waitlist" ON public.waitlist FOR INSERT WITH CHECK (true);
     ```
2. **Waitlist Persistence Service (`lib/waitlist.ts`)**:
   - `submitWaitlistEmail({ email: string, useCase?: string, source?: string })`:
     - Validate email format using standard regex.
     - Send `POST` to Supabase REST endpoint (`/rest/v1/waitlist`) using `SUPABASE_URL` and `SUPABASE_ANON_KEY` or Supabase client.
     - Store waitlist submission state in `localStorage` (`stickle_waitlist_email` & `stickle_waitlist_joined_at`).
     - Track conversion event in PostHog (`posthog.capture('waitlist_submitted', { email, source })`).
3. **Waitlist UI Component (`entrypoints/landing/WaitlistForm.tsx`)**:
   - Create a clean Preact waitlist form component with:
     - Email text input field with inline validation.
     - Role / Use-case selector pills ("Researcher", "Developer / AI", "Product / Design", "Other").
     - Submit button with dynamic loading state ("Joining...").
     - Animated success state ("🎉 You're on the list! We'll reach out soon.").
     - Error banner for invalid formats or network issues (with retry).
4. **Homepage Integration (`entrypoints/landing/App.tsx`)**:
   - **Hero Section**: Add an inline email waitlist input right in the Hero CTA area next to "Add to Chrome" / "Sandbox".
   - **Dedicated Waitlist Section (`#waitlist`)**: Insert a full-width high-converting pastel callout section before the footer with the `WaitlistForm` component, social proof badges ("Join 500+ researchers on the waitlist"), and feature teaser bullets.
   - **Nav Link**: Add "Waitlist" link in the navbar that smooth-scrolls to `#waitlist`.
5. **Returning Visitor State**:
   - Check `localStorage` on load; if user already submitted their email, display "✓ You're on the early access waitlist!" instead of re-showing an empty form.

**Acceptance criteria:**
- [ ] Homepage `/` displays the Waitlist form in both the Hero section and the dedicated `#waitlist` section.
- [ ] Validating email format works with instant inline UI feedback.
- [ ] Email submissions successfully save to Supabase `waitlist` table.
- [ ] Duplicate emails return a friendly "Already on the waitlist" response without throwing an error.
- [ ] PostHog captures `waitlist_submitted` event with source and use_case parameters.
- [ ] Returning visitors see their waitlist confirmation badge via `localStorage`.
- [ ] Mobile & desktop layouts render cleanly with no layout overflow.

---

## Phase 13 — Feature Flags, Auth & Supabase Project Setup

**Goal:** Wire Supabase Auth into the extension, implement feature flag evaluation from user tier, and show "Coming Soon" gating in the popup UI for Pro/Team features.

**New files / folders:**
```
lib/flags.ts         # Feature flag definitions + isEnabled() evaluator
lib/auth.ts          # Supabase client init + signIn / signOut / getSession
lib/types.ts         # Extend StickleNote: add userId, workspaceId, syncStatus fields
supabase/
├── schema.sql       # Full PostgreSQL schema (profiles, workspaces, workspace_members, notes, api_keys)
└── seed.sql         # Dev seed data for local testing
```

**Tasks:**
1. Create a Supabase project. Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY` into `.env` (already gitignored). Add them to `.env.example` with placeholder values.
2. Apply `supabase/schema.sql`:
   - `profiles` — extends `auth.users` with `tier` (`'free' | 'supporter' | 'team_member'`), `license_key`
   - `workspaces` — `id`, `name`, `slug`, `owner_id`
   - `workspace_members` — `workspace_id`, `user_id`, `role` (`'owner' | 'admin' | 'member' | 'viewer'`)
   - `notes` — mirrors `StickleNote` plus `user_id`, `workspace_id`, `domain`, `anchor` (JSONB), `deleted_at` (soft delete)
   - `api_keys` — `user_id`, `key_hash`, `name`, `last_used_at`
   - Enable RLS on all tables; write policies: users can only read/write their own rows; workspace members can read workspace notes.
3. Implement `lib/auth.ts`:
   - `initSupabase()` — returns a singleton Supabase client using `createClient` from `@supabase/supabase-js`
   - `signInWithMagicLink(email)` / `signInWithGoogle()` — use PKCE redirect; redirect URL points to a dedicated extension page (`entrypoints/auth-callback/`)
   - `signOut()`, `getSession()`, `getProfile()` — fetches `profiles` row for current user
4. Create `entrypoints/auth-callback/index.html` — tiny page that catches the OAuth/magic-link redirect, extracts the session token from the URL hash, stores it in `chrome.storage.local`, and closes itself.
5. Implement `lib/flags.ts`:
   ```typescript
   export type FeatureFlag = 'cloudSync' | 'teamSharing' | 'remoteMCP' | 'centralDashboard';
   export type UserTier = 'free' | 'supporter' | 'team_member';

   const TIER_FLAGS: Record<UserTier, Record<FeatureFlag, boolean>> = {
     free:        { cloudSync: false, teamSharing: false, remoteMCP: false, centralDashboard: false },
     supporter:   { cloudSync: true,  teamSharing: false, remoteMCP: true,  centralDashboard: true  },
     team_member: { cloudSync: true,  teamSharing: true,  remoteMCP: true,  centralDashboard: true  },
   };

   export const isEnabled = (flag: FeatureFlag, tier: UserTier = 'free'): boolean =>
     TIER_FLAGS[tier][flag];
   ```
6. Update the popup `Settings.tsx` tab: add a "Sign In" / account section. When signed in, show user email and tier badge. When not signed in, show "Sign in to enable cloud sync" with a sign-in button.
7. In the popup `App.tsx`, show "Coming Soon — Pro" badges on the Sync, Dashboard, and MCP sections for free-tier users (use `isEnabled()` evaluated against the stored profile tier).

**Acceptance criteria:**
- [ ] Supabase schema is applied and all RLS policies pass a manual test (free user cannot read another user's notes)
- [ ] Magic link sign-in flow works end-to-end from the popup: click "Sign In" → email received → callback page captures session → popup reflects "Signed in as user@email.com"
- [ ] `isEnabled('cloudSync', 'free')` returns `false`; `isEnabled('cloudSync', 'supporter')` returns `true`
- [ ] "Coming Soon" badges show correctly in the popup for free-tier accounts on gated features

---

## Phase 13 — Cross-Device Cloud Sync Engine

**Goal:** Notes created or edited on one device/browser appear on all other signed-in devices within a few seconds. Offline mutations are queued and flushed on reconnect.

**New files:**
```
lib/sync.ts          # Delta sync engine: push local → cloud, pull cloud → local
tests/sync.test.ts   # Vitest unit tests for sync logic and conflict resolution
```

**Tasks:**
1. Extend `StickleNote` in `lib/types.ts`:
   ```typescript
   syncStatus: 'local' | 'synced' | 'pending' | 'conflict';
   cloudId?: string;       // Supabase notes.id UUID once pushed
   userId?: string;        // Supabase auth user ID
   deletedAt?: number;     // Soft-delete timestamp for sync tombstoning
   ```
2. Implement `lib/sync.ts`:
   - `pushPendingNotes()` — upserts all `syncStatus: 'pending'` notes to `supabase.notes` using `upsert({ onConflict: 'local_id' })`. Marks successfully pushed notes as `syncStatus: 'synced'` in Dexie.
   - `pullRemoteNotes(since: number)` — queries Supabase for `updated_at > since`, merges into Dexie using Last-Write-Wins: if `remote.updatedAt > local.updatedAt`, overwrite local; else keep local.
   - `fullSync()` — calls `pushPendingNotes()` then `pullRemoteNotes(lastSyncedAt)`. Updates `lastSyncedAt` in `chrome.storage.local` on success.
   - `startRealtimeSync()` — subscribes to `supabase.channel('notes').on('postgres_changes', ...)` for the current user's rows. Applies incoming inserts/updates to Dexie immediately.
3. Call `fullSync()` from `entrypoints/background.ts` on startup (if signed in) and whenever the extension receives a `SYNC_NOW` internal message.
4. Set `syncStatus: 'pending'` on every `createNote`, `updateNote`, and `deleteNote` call in `lib/db.ts`. Trigger `pushPendingNotes()` after each mutation (debounced 2 s).
5. Soft-delete: `deleteNote` sets `deletedAt = Date.now()` and `syncStatus: 'pending'` instead of removing from Dexie. Push the tombstone to Supabase. Remote pulls that receive a tombstone call `deleteNote` locally.
6. Conflict indicator: if `syncStatus: 'conflict'` is detected (both local and remote have `updatedAt` within 5 s of each other and content differs), mark the note with a small ⚠️ conflict badge in `NoteBubble.tsx` and popup sidebar — do not silently discard either version.

**Acceptance criteria:**
- [ ] Note created on Device A appears on Device B within 5 seconds (realtime subscription working)
- [ ] Note created offline on Device A (Supabase unreachable) syncs automatically when connection is restored
- [ ] Deleting a note on Device A removes it from Device B via tombstone sync
- [ ] Conflict badge appears when `syncStatus: 'conflict'` — neither version is silently lost
- [ ] `vitest run tests/sync.test.ts` — all sync unit tests pass

---

## Phase 14 — Central Web Dashboard

**Goal:** A standalone web app (separate from the extension) where users can search, browse, and manage all their notes across every device and browser tab.

**New files / folders:**
```
dashboard/                      # Standalone Next.js 15 App Router app
├── app/
│   ├── layout.tsx
│   ├── page.tsx                # Redirect → /notes
│   ├── (auth)/
│   │   └── login/page.tsx      # Magic link + Google sign-in page
│   ├── notes/
│   │   ├── page.tsx            # Explorer view (main notes list)
│   │   └── [id]/page.tsx       # Single note detail / edit
│   ├── timeline/page.tsx       # Chronological activity feed
│   ├── team/
│   │   ├── page.tsx            # Workspace overview (team notes)
│   │   └── invite/page.tsx     # Invite members by email
│   └── settings/
│       ├── page.tsx            # Account, tier, billing portal link
│       └── api-keys/page.tsx   # Create / revoke Remote MCP API keys
├── components/
│   ├── NoteCard.tsx
│   ├── NoteSearch.tsx
│   ├── DomainSidebar.tsx
│   ├── TimelineEntry.tsx
│   └── AuthorAvatar.tsx
└── lib/
    └── supabase-client.ts      # Browser-side Supabase client
```

**Tasks:**
1. `npx -y create-next-app@latest dashboard --typescript --tailwind --app --no-src-dir --import-alias "@/*"` in the repo root. Add `shadcn/ui` (`npx shadcn@latest init`).
2. Configure Supabase Auth SSR helpers (`@supabase/ssr`) with middleware for session refresh.
3. **Explorer View** (`/notes`):
   - Fetch notes from Supabase with server-side rendering (`createServerClient`).
   - Left sidebar: domains listed with note counts, clicking filters the main panel.
   - Main panel: infinite-scrolling list of `NoteCard` components — shows page title, URL domain chip, note excerpt, color block, tags, and "Jump to page ↗" link.
   - Top bar: full-text search input (queries `supabase.notes` using `ilike '%query%'`), filter dropdowns (tag, color, date range).
4. **Timeline View** (`/timeline`):
   - Chronological feed grouped by day. Each entry shows: author avatar (for team notes), note excerpt, page title, domain, and timestamp.
   - Real-time updates: Supabase Realtime subscription appends new notes at the top without page refresh.
5. **Team Workspace View** (`/team`):
   - Lists all team members with their note counts.
   - Clicking a member filters the note list to their contributions.
   - "Invite" button → sends Supabase invite email + adds pending `workspace_members` row.
6. **API Keys** (`/settings/api-keys`):
   - Generate a new key: `sk_stickle_` + 32 random hex chars. Store the SHA-256 hash in `api_keys`. Show the raw key **once** (never stored in plaintext).
   - List existing keys by name + `last_used_at`. Revoke (delete) by row.
7. **Settings / Billing** (`/settings`):
   - Show current tier and license key if applicable.
   - "Manage Billing" → redirect to LemonSqueezy customer portal URL (or Stripe portal).
8. Deploy dashboard to Vercel. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables. Add the Vercel domain to Supabase Auth's allowed redirect URLs.

**Acceptance criteria:**
- [ ] Unauthenticated users are redirected to `/login`
- [ ] Authenticated user sees all their notes from all devices in the Explorer view
- [ ] Search and domain/tag filters return correct results
- [ ] Timeline view updates in real-time when a new note is created from the extension on another tab
- [ ] API key can be generated, displayed once, and revoked from `/settings/api-keys`
- [ ] Dashboard is deployed and accessible at a public Vercel URL

---

## Phase 15 — Remote MCP Server (Hosted, HTTP/SSE)

**Goal:** AI agents (Claude Desktop, Cursor, Antigravity) can query a user's notes over HTTPS without needing the local extension running, using a Bearer API key from the dashboard.

**New files / folders:**
```
remote-mcp/
├── src/
│   ├── index.ts          # Hono app entry point
│   ├── auth.ts           # Bearer token validation against supabase.api_keys
│   ├── tools/
│   │   ├── list.ts
│   │   ├── search.ts
│   │   ├── get-for-url.ts
│   │   ├── add.ts
│   │   ├── summary.ts
│   │   └── team-timeline.ts
│   └── mcp-handler.ts    # MCP protocol over HTTP/SSE using @modelcontextprotocol/sdk
├── package.json
├── tsconfig.json
└── wrangler.toml         # Cloudflare Workers config (or Dockerfile for Railway)
```

**Tasks:**
1. Scaffold a Hono app in `remote-mcp/`. Add `@modelcontextprotocol/sdk`, `@supabase/supabase-js`, `hono`.
2. Implement `auth.ts`:
   - Extract `Authorization: Bearer sk_stickle_...` from request headers.
   - SHA-256 hash the token and query `supabase.api_keys WHERE key_hash = $1`.
   - If found, update `last_used_at` and return the associated `user_id`. If not found, return 401.
3. Implement MCP HTTP/SSE handler in `mcp-handler.ts` using `@modelcontextprotocol/sdk`'s `Server` with an SSE transport adapter for HTTP. Expose at `GET /sse` (SSE stream) and `POST /message` (client-to-server messages).
4. Implement tools (reuse logic from local `mcp-server/index.ts` but query Supabase instead of `~/.stickle/notes.json`):
   - `list_stickle_notes` — query `notes WHERE user_id = $userId` with optional `domain`, `tag`, `limit`
   - `search_stickle_notes` — full-text `ilike` search on `content`, `page_title`, `url`, `tags`
   - `get_notes_for_url` — exact URL match with fallback `starts_with` prefix match
   - `add_stickle_note` — insert a new note row (sets `sync_status = 'synced'`, `user_id` from auth)
   - `export_stickle_summary` — generates the same Markdown report as the local server, from Supabase data
   - `get_team_activity_timeline` — queries workspace notes (`workspace_id = $activeWorkspaceId`) ordered by `created_at DESC`, including author profile name and avatar
5. Deploy to Cloudflare Workers (`wrangler publish`) or Railway. Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (service role key, not anon — server only, never exposed to client) as secrets.
6. Update the Web Dashboard `settings/api-keys` page to show the Remote MCP endpoint URL (`https://mcp.stickle.app/sse`) with copy-to-clipboard + a one-liner config snippet for Claude Desktop `mcpServers` JSON.
7. Write a `README` in `remote-mcp/` explaining how to self-host the remote MCP server (for open-source users who want to run their own backend).

**Acceptance criteria:**
- [ ] `curl -H "Authorization: Bearer sk_stickle_INVALID" https://mcp.stickle.app/sse` returns 401
- [ ] Claude Desktop configured with a valid API key can call `list_stickle_notes` and receive the user's notes from Supabase
- [ ] `add_stickle_note` via Remote MCP creates a row in Supabase that subsequently appears in the extension after the next sync
- [ ] `get_team_activity_timeline` returns notes from all workspace members, not just the authenticated user
- [ ] Remote MCP server self-host instructions documented in `remote-mcp/README.md`

---

## Phase 16 — Team Shared In-Page Annotations

**Goal:** When a user belongs to a Workspace, they see their teammates' notes overlaid on the same webpage in real-time, with author avatars and read-only indicators.

**Tasks:**
1. Add `activeWorkspaceId` to `chrome.storage.local` (set from the popup Settings tab — a dropdown of workspaces the user belongs to). `null` means "Personal mode" — only own notes shown.
2. Update `entrypoints/content.ts`:
   - On page load, if `activeWorkspaceId` is set, fetch `notes WHERE (user_id = $userId OR workspace_id = $workspaceId) AND url = $currentUrl` from Supabase (in addition to the local Dexie query for offline support).
   - Subscribe to `supabase.channel('workspace_notes').on('postgres_changes', { filter: 'workspace_id=eq.$id AND url=eq.$url' }, ...)` to receive teammates' notes in real-time without a page reload.
3. Extend `NoteBubble.tsx` for team notes:
   - Show author avatar (profile `avatar_url` or initials fallback) as a small circular badge in the top-left corner of the note.
   - Team member notes are **read-only** (no edit/delete) unless the current user is the author or a workspace admin.
   - Dim team notes slightly to visually distinguish them from own notes.
4. Update the popup sidebar `NoteSidebar.tsx`:
   - Add a "Workspace" tab alongside "My Notes" tab. Workspace tab shows all team notes grouped by author.
   - Show an active workspace selector dropdown at the top of the popup.
5. Implement workspace invite from the extension popup:
   - Settings tab: "Team Workspace" section → show current workspace name + member count, or "Create Workspace / Join Workspace" if not a member.
   - "Invite" sends an email invite via a Supabase Edge Function that creates a pending `workspace_members` row and sends an email with an accept link.

**Edge cases:**
- A team member's note on a page where the DOM element no longer exists: apply the same 3-tier re-anchoring as personal notes; if all tiers fail, show in the team "Orphaned Notes" tray.
- User is in personal mode (`activeWorkspaceId = null`): no Supabase fetch occurs on content script load — behavior is identical to v1 for free users.
- Rate limiting: Supabase Realtime has concurrent subscription limits. Limit to 1 channel per active tab; unsubscribe in `content.ts` `window.beforeunload`.

**Acceptance criteria:**
- [ ] In a shared Workspace, User A drops a note on a GitHub issue; User B (different device, same workspace) opens the same URL and sees User A's note with their avatar within 3 seconds
- [ ] User B cannot edit or delete User A's note (read-only)
- [ ] Switching to "Personal mode" hides all workspace notes — only own notes are shown on the page
- [ ] Team workspace notes appear in the popup sidebar "Workspace" tab grouped by author
- [ ] `vitest run tests/team-sync.test.ts` — test workspace note fetch, RLS isolation, and real-time delivery

---

## Phase 17 — Monetization: Payments, License Validation & Waitlist

**Goal:** Wire up LemonSqueezy (or Stripe) checkout for Pro and Teams tiers, validate license status in the extension and backend, and set up a public-facing waitlist / early-access page on the landing site.

**New files / folders:**
```
remote-mcp/src/webhooks/
└── lemonsqueezy.ts    # Webhook handler: order.created → upsert profile tier
dashboard/app/
└── upgrade/page.tsx   # Upgrade / pricing page with checkout links
```

**Tasks:**
1. **LemonSqueezy Setup**:
   - Create two products: "Stickle Pro Supporter" (one-time $29) and "Stickle Teams" (per-seat $9/mo).
   - Enable License Keys in LemonSqueezy product settings (auto-generates a key per purchase).
   - Copy webhook secret; configure webhook URL: `https://mcp.stickle.app/webhooks/lemonsqueezy` (or a separate Hono route).
2. **Webhook handler** (`lemonsqueezy.ts`):
   - Verify HMAC-SHA256 signature on incoming webhook using the secret.
   - On `order.created` event: extract `customer_email` and `license_key`. Upsert `profiles` row: set `tier = 'supporter'` (or `'team_member'`) and `license_key`.
   - On `subscription.cancelled`: set `tier = 'free'` for Teams users.
3. **License validation in the extension** (`lib/auth.ts`):
   - On sign-in, `getProfile()` fetches `tier` and `license_key` from Supabase. Store tier in `chrome.storage.local`.
   - `isEnabled()` in `lib/flags.ts` reads from stored tier — no extra API call needed on every flag check.
   - Re-validate tier on extension startup and once per 24 h (in `background.ts` alarm) to catch subscription cancellations.
4. **Upgrade page** (`dashboard/app/upgrade/page.tsx`):
   - Clean pricing card layout: Free / Pro ($29 one-time) / Teams ($9/user/mo).
   - "Buy Pro" button → direct LemonSqueezy checkout URL with pre-filled email from Supabase session.
   - After purchase, LemonSqueezy redirects to `dashboard/upgrade?success=true` → page polls `getProfile()` until tier updates, then shows success state.
5. **Waitlist** (if Teams features not fully built yet):
   - Add a simple `waitlist` table in Supabase (`email`, `source`, `created_at`).
   - Add a "Join Teams Waitlist" form on the landing page (`entrypoints/landing/`) and dashboard upgrade page that inserts a row.
6. **Early-access badge**: Add a "🎉 Early Access" tag in the extension popup for users who signed up during launch — `profiles.created_at < LAUNCH_CUTOFF_DATE`.

**Acceptance criteria:**
- [ ] Purchasing Pro via LemonSqueezy checkout → within 10 s, `profiles.tier` updates to `'supporter'` via webhook
- [ ] Extension re-validates tier within 24 h; cloud sync and Remote MCP unlock without reinstalling the extension
- [ ] Invalid / revoked license key causes `isEnabled('cloudSync')` to return `false` after next validation cycle
- [ ] Upgrade page renders correctly at `dashboard.stickle.app/upgrade` with working checkout links
- [ ] "Coming Soon" Pro banners in the popup show a "Unlock — $29" CTA that deep-links to the upgrade page

---

## Rules for the agent executing this plan
1. Work through phases strictly in order. Do not begin a phase whose predecessor's acceptance criteria are unchecked.
2. Log every non-trivial judgment call in `DECISIONS.md` with a one-line rationale.
3. Do not introduce new external dependencies beyond what's named in this doc without noting the reason in `DECISIONS.md`.
4. If an acceptance criterion cannot be met, stop and surface the blocker.
5. **Phases 12–17 are v2 cloud features.** They assume Phases 1–11 acceptance criteria are already met. Do not attempt v2 phases on a fresh clone without first verifying v1 is functional.
6. **Never store the Supabase service role key in extension code or the public GitHub repo.** It lives only as a secret in the remote-mcp deployment environment (Cloudflare Workers / Railway secrets).