# Stickle Architecture — DOM Anchoring Strategy & Fallback System

> **Document Purpose:** Detailed technical specification of Stickle's 3-tier DOM anchoring system, fallback resolution order, fuzzy matching algorithms, failure modes, and performance trade-offs.

---

## 1. Executive Summary

Web extension sticky note apps historically suffer from "anchor rot": notes placed on dynamic websites disappear when CSS class names change, DOM trees re-render, or content shifts. Stickle solves this through a robust, client-side **3-Tier Fallback Anchoring Strategy**.

When a user creates a note, Stickle captures structural, textual, and contextual metadata. When re-attaching notes on page load or dynamic DOM mutation, Stickle executes a progressive resolution pipeline from high-precision exact matching down to low-confidence unanchored degradation.

---

## 2. Anchor Data Model

Each note contains a `NoteAnchor` metadata structure stored in IndexedDB:

```typescript
export interface NoteAnchor {
  cssSelector: string;     // Tier 1: Resilient CSS selector path
  textPrefix?: string;     // Tier 2: ~40 chars preceding DOM text context
  textSuffix?: string;     // Tier 2: ~40 chars following DOM text context
  exactText?: string;      // Tier 2 & 3: ~15-30 chars target text snippet
  offsetX: number;         // X coordinate relative to element top-left
  offsetY: number;         // Y coordinate relative to element top-left
  tier: AnchorTier;        // 'selector' | 'text-fragment' | 'fuzzy' | 'unanchored'
}
```

---

## 3. Resolution Pipeline (The 3-Tier Fallback System)

```
                       [ Load / Mutate Page Event ]
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │ Tier 1: Exact CSS Selector│
                      └─────────────┬─────────────┘
                                    │
                       Matches? ────┼────► YES ──► Position Note (Tier 1: Selector)
                                    │
                                    NO
                                    ▼
                      ┌───────────────────────────┐
                      │ Tier 2: Text Fragment     │
                      └─────────────┬─────────────┘
                                    │
                       Matches? ────┼────► YES ──► Position Note (Tier 2: Text-Fragment)
                                    │
                                    NO
                                    ▼
                      ┌───────────────────────────┐
                      │ Tier 3: Trigram Fuzzy Match│
                      └─────────────┬─────────────┘
                                    │
                      Score >= 0.75? ──┼──► YES ──► Position Note (Tier 3: Fuzzy Match)
                                    │
                                    NO
                                    ▼
                      ┌───────────────────────────┐
                      │ Tier 4: Unanchored Tray   │
                      └───────────────────────────┘
```

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

### Tier 4: Unanchored Degradation (Orphaned Notes)
- **Mechanism:** If all resolution tiers fall below the `0.75` similarity threshold, the note degrades to `tier: 'unanchored'`.
- **UX Treatment:** Rendered inside a non-intrusive floating "Orphaned Notes" tray in the bottom corner of the viewport rather than silently dropping user data.

---

## 4. UI Indicators & Visual Feedback

To provide transparent feedback on anchor confidence:
- **Tier 1 (Selector):** Neutral solid border (`#e5e5e0`), green `TIER 1: SELECTOR` badge.
- **Tier 2 (Text Fragment):** Indigo dashed border (`#4f46e5`), blue `TIER 2: TEXT-FRAGMENT` badge.
- **Tier 3 (Fuzzy Match):** Amber dotted border (`#d97706`), warning `TIER 3: FUZZY MATCH` badge.
- **Tier 4 (Unanchored):** Red solid outline (`#dc2626`), alert `TIER 4: ORPHANED` badge.

---

## 5. Performance & Security Considerations

1. **Zero External NLP Overhead:** Fuzzy matching runs entirely via inline trigram set operations, avoiding heavy external NLP packages (keeping extension payload < 100KB).
2. **DOM Traversal Optimization:** Candidate filtering targets leaf nodes and elements containing text nodes (`nodeType === 3`), bypassing large non-text containers.
3. **Local First Data Privacy:** All anchor extraction and matching occurs locally within the browser content script context. No DOM text content is transmitted externally.

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

## 7. Storage & Error Resilience Layer

1. **Dual Persistence System**: Primary persistence via `chrome.storage.local` with automatic fallback to IndexedDB (`Dexie.js`) for non-extension environments.
2. **Explicit Quota Protection**: `chrome.storage.local.set` catches `chrome.runtime.lastError` and detects storage quota limits (`QuotaExceededError`), preventing silent data loss.
3. **Restricted Page Injection Handling**: Context menu commands ignore restricted browser internal URLs (`chrome://`, `chrome-extension://`, `about:`) and gracefully handle injection failures.

