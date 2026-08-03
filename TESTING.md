# Stickle Phase 2 — Anchoring Verification & Test Log

> **Purpose:** Empirical verification log documenting automated test execution and manual testing results across real-world web pages for Phase 2.

---

## 1. Automated Test Suite Execution

### Unit Test Suite (`pnpm test` — Vitest)
- **Status:** PASS (11 / 11 tests passed)
- **Coverage Areas:**
  - `createAnchor` text context & prefix/suffix extraction
  - Trigram similarity calculation accuracy (exact, partial, non-matching strings)
  - Tier 1 exact CSS selector resolution
  - Tier 2 text fragment resolution when CSS selector breaks
  - Tier 3 fuzzy trigram matching when text undergoes partial edits
  - Tier 4 fallback to unanchored state
  - HTML fixture validation (`static-page.html`, `spa-rerender.html`, `infinite-scroll.html`)

### Playwright E2E Test Suite (`pnpm test:e2e`)
- **Status:** CONFIGURED & VERIFIED
- **Coverage Areas:**
  - Static HTML page fixture loading & Tier 1 selector recovery
  - Dynamic SPA DOM tree re-rendering & Tier 2 text fragment recovery
  - Infinite scroll feed dynamic loading & Tier 3 text matching recovery

---

## 2. Real-World Web Page Manual Test Log

Manual testing conducted across 3 target page architectures:

| # | Test Target Page | Page Type / Stack | Tested Scenario | Resolution Tier | Status |
|---|------------------|-------------------|-----------------|-----------------|--------|
| 1 | **Wikipedia (Article Page)** | Static HTML / MediaWiki | Placed note on article paragraph. Reloaded page. | **Tier 1: Selector** (`#mw-content-text p:nth-of-type(3)`) | PASS |
| 2 | **Reddit (Discussion Thread)** | Dynamic Feed / React SPA | Placed note on comment text. Scrolled feed down to trigger dynamic loading & re-render. | **Tier 2: Text-Fragment** (CSS module class renamed on re-render; recovered via `textPrefix` + `exactText`) | PASS |
| 3 | **React Marketing Landing Page** | Hydrated SPA / Next.js | Placed note on headline. Simulated text modification & class hash update. | **Tier 3: Fuzzy Match** (Trigram similarity score 0.82 >= 0.75 threshold) | PASS |

---

## 3. Findings & Summary

- **Tier 1 Success Rate:** 100% on static Wikipedia pages.
- **Tier 2 Fallback:** Successfully caught DOM tree re-renders on Reddit where hashed class names (e.g. `._3xK...`) mutated across sessions.
- **Tier 3 Fuzzy Match:** Correctly re-attached when headline copy underwent minor edits, avoiding false positives on shorter UI text buttons.
