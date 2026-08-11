# Stickle Architecture — DOM Anchoring Strategy & Fallback System

> **Document Purpose:** Detailed technical specification of Stickle's 3-tier DOM anchoring system, fallback resolution order, fuzzy matching algorithms, failure modes, and performance trade-offs.

---

## 1. Executive Summary

Web extension sticky note apps historically suffer from "anchor rot": notes placed on dynamic websites disappear when CSS class names change, DOM trees re-render, or content shifts. Stickle solves this through a robust, client-side **5-Tier Fallback Anchoring Strategy**.

When a user creates a note, Stickle captures structural, textual, and contextual metadata. When re-attaching notes on page load or dynamic DOM mutation, Stickle executes a progressive resolution pipeline from high-precision DOM fingerprint matching down to stored absolute page coordinates.

---

## 2. Anchor Data Model

Each note contains a `NoteAnchor` metadata structure stored in `chrome.storage.local`:

```typescript
export interface NoteAnchor {
  cssSelector: string;       // Tier 1: Resilient CSS selector path
  textPrefix?: string;       // Tier 2: ~40 chars preceding DOM text context
  textSuffix?: string;       // Tier 2: ~40 chars following DOM text context
  exactText?: string;        // Tier 2 & 3: ~15-30 chars target text snippet
  offsetX: number;           // X coordinate relative to element top-left
  offsetY: number;           // Y coordinate relative to element top-left
  pageX?: number;            // Absolute document X at creation (scroll-independent)
  pageY?: number;            // Absolute document Y at creation (scroll-independent)
  domIndex?: number;         // Tier 0: index among all same-tag elements (e.g. 47th <p>)
  domTag?: string;           // Tag name for domIndex lookup (e.g. 'p', 'li')
  textFingerprint?: string;  // Tier 0: first 60 chars of element text — validates domIndex
  anchoredText?: string;     // Target element text snippet (exposed to MCP AI agents & dashboard)
  tier: AnchorTier;          // 'selector' | 'text-fragment' | 'fuzzy' | 'unanchored'
}
```

**Why `domIndex` + `textFingerprint`?** Pages like Wikipedia contain hundreds of `<p>` tags inside `.mw-parser-output`. A CSS selector of the form `div.mw-parser-output > p:nth-of-type(3)` is ambiguous when paragraphs share sub-containers. `domIndex` is the element's **absolute ordinal** among all same-tag elements (`document.querySelectorAll('p')[47]`), providing an O(1) lookup. `textFingerprint` cross-validates the match, and if the index has shifted (content added above it), a ±10 neighbourhood scan finds the correct element.

**Why `pageX`/`pageY`?** These are scroll-independent absolute document coordinates captured at creation time. They serve as a reliable last resort if all DOM-based tiers fail, and also as the **initial position** before the DOM is fully painted (preventing the "top-left accumulation" bug).

---

## 3. Resolution Pipeline (The 5-Tier Fallback System)

```
                       [ Load / Mutate Page Event ]
                                    │
                      isDomPainted? ─── NO ──► Return stored pageX/pageY (prevent 0,0 accumulation)
                                    │
                                   YES
                                    ▼
                      ┌─────────────────────────────┐
                      │ Tier 0: DOM Fingerprint      │
                      │ domIndex + textFingerprint   │
                      └──────────────┬──────────────┘
                                     │
                      Match >=0.8? ──┼──► YES ──► Position Note (Tier 0: Selector)
                                     │
                          Shift? Scan ±10 neighbours
                      Match >=0.75? ─┼──► YES ──► Position Note (Tier 0: Text-Fragment)
                                     │
                                    NO
                                     ▼
                      ┌─────────────────────────────┐
                      │ Tier 1: Exact CSS Selector   │
                      └──────────────┬──────────────┘
                                     │
                       Matches? ─────┼────► YES ──► Position Note (Tier 1: Selector)
                                     │
                                    NO
                                     ▼
                      ┌─────────────────────────────┐
                      │ Tier 2: Text Fragment        │
                      └──────────────┬──────────────┘
                                     │
                       Matches? ─────┼────► YES ──► Position Note (Tier 2: Text-Fragment)
                                     │
                                    NO
                                     ▼
                      ┌─────────────────────────────┐
                      │ Tier 3: Trigram Fuzzy Match  │
                      └──────────────┬──────────────┘
                                     │
                      Score >= 0.75? ─┼──► YES ──► Position Note (Tier 3: Fuzzy Match)
                                     │
                                    NO
                                     ▼
                      ┌─────────────────────────────┐
                      │ Tier 4: Stored pageX/pageY   │
                      └──────────────┬──────────────┘
                                     │
                      coords exist? ─┼──► YES ──► Position Note (Tier 4: Unanchored)
                                     │
                                    NO
                                     ▼
                      ┌─────────────────────────────┐
                      │ Tier 5: Viewport Centre      │
                      └─────────────────────────────┘
```

### Tier 0: DOM Fingerprint Match *(new primary tier)*
- **Mechanism:** `document.querySelectorAll(domTag)[domIndex]` — O(1) lookup. Validates against `textFingerprint` (first 60 chars, normalized whitespace) using trigram similarity ≥ 0.8. If index has shifted, scans ±10 neighbours for best match ≥ 0.75.
- **Speed:** ~0.1ms (native querySelectorAll + single similarity check).
- **Target Catches:** Wikipedia-style pages with hundreds of repeated `<p>` tags, any page where CSS selector is ambiguous due to shared containers.
- **Guard:** `isDomPainted()` check ensures `getBoundingClientRect()` is not called before layout is stable, preventing the "top-left accumulation" bug on page load.

### Tier 1: CSS Selector Match
- **Mechanism:** Evaluates `document.querySelector(anchor.cssSelector)`.
- **Selector Generation:** Traverses DOM ancestors up to the nearest ID container or `body`. Utilizes tag names, primary class names, and `nth-of-type` positional indexes.
- **Speed:** ~0.1ms execution time (native browser engine lookup).
- **Target Catches:** Unchanged static pages, standard page refreshes.
- **Failures Handled:** Fails when CSS modules hash class names (e.g. `._header_1x9a`), or React re-renders change DOM nesting structure.

### Tier 2: Contiguous Text Fragment Match
- **Mechanism:** Searches leaf elements and text nodes for contiguous combinations of `textPrefix + exactText + textSuffix`.
- **Target Catches:** SPA DOM re-renders (React/Preact/Vue), structural layout refactors, element wrapper additions (`<div>` -> `<section>`), CSS class renames.
- **Speed:** ~1-3ms traversal across leaf DOM nodes.
- **Failures Handled:** Fails if the user or website author edits the exact text wording.

### Tier 3: Trigram Fuzzy Matching
- **Mechanism:** Evaluates Dice coefficient / trigram overlap score between `anchor.exactText` and candidate text nodes across the entire page body.
- **Algorithm Formula:**
  $$\text{Similarity}(S_1, S_2) = \frac{2 \times |T(S_1) \cap T(S_2)|}{|T(S_1)| + |T(S_2)|}$$
  where $T(S)$ represents the set of character 3-grams in string $S$.
- **Threshold Chosen:** `0.75` (empirically determined to eliminate false positives on repetitive UI text like "Read More" while accommodating minor typo fixes, tense changes, or partial text edits).
- **Target Catches:** Dynamic feed items, live article updates, minor author edits to text.

### Tier 4: Stored Absolute Page Coordinates
- **Mechanism:** Returns `anchor.pageX` / `anchor.pageY` — scroll-independent absolute document coordinates captured at note creation time via `scrollX + rect.left + offsetX`.
- **Target Catches:** Pages where all DOM content has been replaced but the note should still appear at roughly the right position.
- **Note:** These coords are also used as the **initial placement** before `isDomPainted()` returns true.

### Tier 5: Unanchored Degradation (Orphaned Notes)
- **Mechanism:** If all resolution tiers fail, the note renders at the viewport centre.
- **UX Treatment:** Rendered inside a non-intrusive floating "Orphaned Notes" tray in the bottom corner of the viewport rather than silently dropping user data.

---

## 4. UI Indicators & Visual Feedback

To provide transparent feedback on anchor confidence:
- **Tier 1 (Selector):** Neutral solid border (`#e5e5e0`), green `TIER 1: SELECTOR` badge.
- **Tier 2 (Text Fragment):** Indigo dashed border (`#4f46e5`), blue `TIER 2: TEXT-FRAGMENT` badge.
- **Tier 3 (Fuzzy Match):** Amber dotted border (`#d97706`), warning `TIER 3: FUZZY MATCH` badge.
- **Tier 4 (Unanchored):** Red solid outline (`#dc2626`), alert `TIER 4: ORPHANED` badge.

---

## 5. Performance & Multi-Tab Considerations

1. **Zero External NLP Overhead:** Fuzzy matching runs entirely via inline trigram set operations, avoiding heavy external NLP packages (keeping extension payload < 100KB).
2. **DOM Traversal Optimization:** Candidate filtering targets leaf nodes and elements containing text nodes (`nodeType === 3`), bypassing large non-text containers. Tier 0 DOM fingerprint lookup is O(1) and avoids full DOM traversal entirely on most pages.
3. **In-Flight Guard:** `refreshInFlight` flag prevents concurrent `refreshNotes()` calls from stacking up on busy SPAs or pages that fire many mutation events.
4. **Visibility-Aware Refresh:** `refreshNotes()` skips re-anchoring entirely when the tab is hidden (`document.hidden === true`), queueing exactly one deferred refresh for when the tab becomes active. This prevents wasted work across multiple open tabs.
5. **Structural-Only MutationObserver:** `characterData` option is excluded from the observer — it was causing Wikipedia's scroll-linked TOC highlight DOM updates to trigger constant re-anchoring mid-scroll. Only `childList` structural changes trigger debounced re-anchor.
6. **Local First Data Privacy:** All anchor extraction and matching occurs locally within the browser content script context. No DOM text content is transmitted externally.

---

## 6. Background Service Worker Proxying & CORS Architecture

Browsers restrict content scripts from making direct cross-origin HTTP requests to external APIs (`api.notion.com`) due to CORS policies. Stickle overcomes this using an asynchronous **Background Message Proxy Pattern**:

```
 ┌──────────────────────┐        chrome.runtime.sendMessage        ┌─────────────────────────┐
 │                      ├─────────────────────────────────────────►│                         │
 │ Content Script / UI  │                                          │ Background ServiceWorker│
 │                      │◄─────────────────────────────────────────┤ (Host Permission granted)│
 └──────────────────────┘        sendResponse({ success })         └────────────┬────────────┘
                                                                                │
                                                                       fetch("api.notion.com")
                                                                                │
                                                                                ▼
                                                                       ┌──────────────────┐
                                                                       │    Notion API    │
                                                                       └──────────────────┘
```

1. **CORS Bypass**: Background service workers declare `host_permissions: ["https://api.notion.com/*"]` in Manifest V3, granting origin-unrestricted API access.
2. **Exponential Backoff Retry Engine**: Wrapped in `fetchWithRetry()` supporting Notion 429 rate limit responses (`Retry-After` header parsing and exponential delay `2^attempt * 500ms`).
3. **Property Key Inspection**: Automatically discovers Notion database properties (`title`, `url`) dynamically via `GET /v1/databases/:id`, accommodating custom Notion user databases without hardcoded schema assumptions.

---

---

## 8. Team Workspace Shared Annotations & Scalable Caching Strategy

```
  ┌──────────────────────┐        0ms Instant Local Read         ┌────────────────────────┐
  │                      ├──────────────────────────────────────►│ IndexedDB (Dexie)      │
  │ Content Script UI    │                                       │ workspaceNotes Table   │
  │                      │◄──────────────────────────────────────┤                        │
  └──────────┬───────────┘        Render Cached Team Notes       └────────────────────────┘
             │
             │ Background Delta Fetch (updated_at > lastSynced)
             ▼
  ┌──────────────────────┐        Supabase Realtime Channel       ┌────────────────────────┐
  │ Supabase PostgreSQL  ├──────────────────────────────────────►│ (Active Tab Only)      │
  │ Row-Level Security   │        (document.hidden === false)     │ Live WebSocket Feed    │
  └──────────────────────┘                                       └────────────────────────┘
```

1. **0ms Initial Render via IndexedDB (`workspaceNotes`)**:
   - Workspace annotations are cached locally in IndexedDB (`lib/db.ts`). On webpage load, Stickle immediately reads local workspace cache (`getCachedWorkspaceNotes`), rendering team notes in 0ms without blocking the UI thread or waiting for network roundtrips.
2. **Background Delta Fetching (`fetchWorkspaceNotesForUrl`)**:
   - Concurrently triggers background delta queries to Supabase (`updated_at > lastSyncedAt`) for the current page URL, merging remote team edits into IndexedDB and updating the UI smoothly.
3. **Visibility-Aware WebSocket Channel Lifecycle**:
   - Real-time Supabase channels (`workspace_notes_${workspaceId}`) are opened **only when the tab is active/visible** (`document.hidden === false`).
   - Automatically pauses/unsubscribes on `visibilitychange` (switching tabs) and `beforeunload`, preserving backend WebSocket connection limits across 20+ open browser tabs.
4. **Read-Only Teammate Permission Enforcement**:
   - Notes authored by teammates (`row.user_id !== currentUserId`) are rendered read-only with explicit author avatar badges (`👥 authorName`), disabled textareas, and 🔒 Read-only status indicators.

---

## 9. Monetization Architecture, Localized Pricing & Webhook Provisioning

```
  ┌──────────────────────────┐        Auto-Detect Timezone/Locale      ┌──────────────────────────┐
  │ Browser Client / Popup   ├────────────────────────────────────────►│ lib/currency.ts Engine   │
  │ (LocalizedPricing.tsx)   │        (USD, EUR, GBP, INR, JPY, etc.)  │ (Format Regional Prices) │
  └────────────┬─────────────┘                                         └──────────────────────────┘
               │
               │ User Clicks "Buy Pro"
               ▼
  ┌──────────────────────────┐        HMAC-SHA256 Signed Webhook       ┌──────────────────────────┐
  │ Dodo Payments Checkout   ├────────────────────────────────────────►│ remote-mcp Webhook Server│
  │ (Merchant of Record)     │   event: 'payment.succeeded'            │ /webhooks/dodopayments   │
  └──────────────────────────┘                                         └────────────┬─────────────┘
                                                                                    │
                                                                                    │ Update profiles.tier
                                                                                    ▼
  ┌──────────────────────────┐        24h Periodic Alarm Sync          ┌──────────────────────────┐
  │ chrome.storage.local     │◄────────────────────────────────────────┤ Supabase PostgreSQL      │
  │ stickle_user_tier        │        validateUserTier()               │ public.profiles          │
  └──────────────────────────┘                                         └──────────────────────────┘
```

1. **Multi-Currency Geolocation & Fallback Pipeline**:
   - Timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) and locale (`navigator.language`) map to 8 supported currencies (`USD`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`, `BRL`, `JPY`).
   - Regional display prices (`formatPrice`) format amounts with appropriate currency symbols (`$29`, `€27`, `£24`, `₹2,399`, `¥4,200`, `R$149`, `A$44`, `CA$39`).
2. **HMAC-SHA256 Webhook Verification**:
   - Dodo Payments posts event payloads (`payment.succeeded`, `subscription.active`, `subscription.cancelled`) to `https://mcp.stickle.app/webhooks/dodopayments`.
   - The Hono webhook server verifies `dodo-signature` headers using Web Crypto HMAC-SHA256 (`verifyDodoSignature`) with `DODO_PAYMENTS_WEBHOOK_SECRET`.
   - Validated payloads resolve the target user by `custom_data.user_id` or `customer.email` and update `profiles.tier` to `'supporter'` or `'team_member'` + `license_key`.
3. **24-Hour Extension Tier Validation & Local Alarm**:
   - `validateUserTier()` caches user profile tier in `chrome.storage.local` with a 24-hour TTL.
   - `entrypoints/background.ts` registers a `chrome.alarms` alarm (`check-license-tier`) executing every 1,440 minutes (24 hours) to re-sync license status asynchronously.



