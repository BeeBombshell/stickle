import type { NoteAnchor, AnchorTier } from './types';

export interface ResolvedAnchor {
  element: Element | null;
  x: number;
  y: number;
  tier: AnchorTier;
}

// ---------------------------------------------------------------------------
// Similarity helper (trigram Dice coefficient)
// ---------------------------------------------------------------------------

/**
  * Calculates trigram/edit similarity score between two strings (0.0 to 1.0).
  */
export function calculateSimilarity(s1: string, s2: string): number {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
  if (a.includes(b) || b.includes(a)) {
    const minLen = Math.min(a.length, b.length);
    const maxLen = Math.max(a.length, b.length);
    return minLen / maxLen;
  }
  const getTrigrams = (str: string) => {
    const trigrams = new Set<string>();
    for (let i = 0; i <= str.length - 3; i++) {
      trigrams.add(str.slice(i, i + 3));
    }
    return trigrams;
  };
  const t1 = getTrigrams(a);
  const t2 = getTrigrams(b);
  if (t1.size === 0 || t2.size === 0) return 0.0;
  let intersection = 0;
  t1.forEach((gram) => {
    if (t2.has(gram)) intersection++;
  });
  return (2 * intersection) / (t1.size + t2.size);
}

// ---------------------------------------------------------------------------
// DOM readiness guard
// ---------------------------------------------------------------------------

/**
 * Returns true when the DOM is fully painted and layout is stable enough for
 * getBoundingClientRect() to return meaningful values. Prevents all stickles
 * from accumulating at (0,0) during the initial script injection.
 */
function isDomPainted(): boolean {
  if (typeof document === 'undefined') return false;
  if (document.readyState !== 'complete' && document.readyState !== 'interactive') return false;
  // Confirm at least one visible body-level element has non-zero dimensions
  const probe = document.body?.firstElementChild;
  if (!probe) return false;
  const rect = probe.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

// ---------------------------------------------------------------------------
// Text context extraction
// ---------------------------------------------------------------------------

/**
  * Extracts text prefix (~40 chars) and suffix (~40 chars) around target element text.
  */
function getDomTextContext(element: Element, exactText: string): { textPrefix?: string; textSuffix?: string } {
  if (typeof document === 'undefined' || !document.body) {
    return {};
  }
  try {
    const bodyText = document.body.textContent || '';
    const idx = bodyText.indexOf(exactText);
    if (idx !== -1) {
      const textPrefix = bodyText.slice(Math.max(0, idx - 40), idx).trim();
      const textSuffix = bodyText.slice(idx + exactText.length, idx + exactText.length + 40).trim();
      return {
        textPrefix: textPrefix || undefined,
        textSuffix: textSuffix || undefined,
      };
    }
  } catch {
    // Ignore DOM extraction errors
  }
  return {};
}

// ---------------------------------------------------------------------------
// Anchor creation
// ---------------------------------------------------------------------------

/**
  * Creates an anchor capturing: absolute page coords, DOM element fingerprint
  * (domIndex + textFingerprint + domTag), CSS selector, and text context.
  *
  * - pageX/pageY: scroll-independent absolute document coordinates. Used as
  *   a last-resort fallback if all DOM-matching tiers fail.
  * - domIndex: ordinal position among all same-tag elements in the document
  *   (e.g. the 47th <p>). Provides O(1) lookup that uniquely identifies
  *   elements on content-heavy pages like Wikipedia with many repeated <p> tags.
  * - textFingerprint: first 60 chars of normalized text, used to validate
  *   that domIndex still points to the right element after content changes.
  */
export function createAnchor(element: Element, offsetX: number, offsetY: number): NoteAnchor {
  const cssSelector = getSimpleCssSelector(element);
  const rawText = element.textContent?.trim() || '';
  const exactText = rawText.slice(0, 30) || undefined;
  const context = exactText ? getDomTextContext(element, exactText) : {};

  // Absolute page coordinates (scroll-independent)
  const rect = element.getBoundingClientRect();
  const scrollX = typeof window !== 'undefined' ? window.scrollX : 0;
  const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
  const pageX = scrollX + rect.left + offsetX;
  const pageY = scrollY + rect.top + offsetY;

  // DOM element fingerprint
  const domTag = element.tagName.toLowerCase();
  const allSameTag =
    typeof document !== 'undefined' ? Array.from(document.querySelectorAll(domTag)) : [];
  const domIndex = allSameTag.indexOf(element);
  const textFingerprint = rawText.slice(0, 60).replace(/\s+/g, ' ').trim() || undefined;

  return {
    cssSelector,
    exactText,
    textPrefix: context.textPrefix,
    textSuffix: context.textSuffix,
    offsetX,
    offsetY,
    pageX,
    pageY,
    domIndex: domIndex >= 0 ? domIndex : undefined,
    domTag: domIndex >= 0 ? domTag : undefined,
    textFingerprint,
    tier: 'selector',
  };
}

// ---------------------------------------------------------------------------
// Anchor resolution
// ---------------------------------------------------------------------------

/**
  * Resolves an anchor against the current DOM using a 5-tier fallback strategy.
  *
  * Tier 0 — DOM Fingerprint (domIndex + textFingerprint): O(1) lookup via
  *   querySelectorAll(tagName)[domIndex], fingerprint-validated (similarity >= 0.8).
  *   If index has shifted, scans +-10 neighbours for best match (>= 0.75).
  *   Uniquely identifies repeated <p> tags on content-heavy pages like Wikipedia.
  * Tier 1 — CSS Selector: exact querySelector match.
  * Tier 2 — Text Fragment: prefix + exact + suffix search across leaf nodes.
  * Tier 3 — Trigram Fuzzy Match: best similarity match >= 0.75 across full DOM.
  * Tier 4 — Stored pageX/pageY: absolute scroll-independent coords saved at creation.
  * Tier 5 — Unanchored: centre of viewport.
  *
  * Guard: if the DOM is not yet painted (all rects are zero), returns stored
  * pageX/pageY immediately to prevent stickles accumulating at (0,0) on load.
  */
export function resolveAnchor(anchor: NoteAnchor): ResolvedAnchor {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      element: null,
      x: anchor.pageX ?? 60,
      y: anchor.pageY ?? 60,
      tier: 'unanchored',
    };
  }

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  const bodyRect = (document.body || document.documentElement).getBoundingClientRect();
  const bodyLeft = scrollX + bodyRect.left;
  const bodyTop = scrollY + bodyRect.top;

  const computeX = (rectLeft: number) =>
    Math.max(10, scrollX + rectLeft - bodyLeft + anchor.offsetX);
  const computeY = (rectTop: number) =>
    Math.max(10, scrollY + rectTop - bodyTop + anchor.offsetY);

  // If the DOM has not painted yet, return stored absolute coords immediately.
  // This prevents all stickles accumulating at (0,0) on initial injection.
  if (!isDomPainted()) {
    return {
      element: null,
      x: anchor.pageX ?? Math.max(20, window.innerWidth / 2 - 120),
      y: anchor.pageY ?? Math.max(40, window.innerHeight / 4),
      tier: 'unanchored',
    };
  }

  // -- Tier 0: DOM Fingerprint (domIndex + textFingerprint) -----------------
  if (anchor.domIndex !== undefined && anchor.domTag && document.body) {
    try {
      const candidates = document.querySelectorAll(anchor.domTag);
      const el = candidates[anchor.domIndex];
      if (el) {
        const fingerprint = el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60) || '';
        const similarity = anchor.textFingerprint
          ? calculateSimilarity(anchor.textFingerprint, fingerprint)
          : 0;

        if (!anchor.textFingerprint || similarity >= 0.8) {
          // Perfect index hit
          const rect = el.getBoundingClientRect();
          return { element: el, x: computeX(rect.left), y: computeY(rect.top), tier: 'selector' };
        }

        // Index may have shifted — scan +-10 neighbours for best match
        const searchStart = Math.max(0, anchor.domIndex - 10);
        const searchEnd = Math.min(candidates.length - 1, anchor.domIndex + 10);
        let bestEl: Element | null = null;
        let bestScore = 0;
        for (let i = searchStart; i <= searchEnd; i++) {
          const candidate = candidates[i];
          const candidateText =
            candidate.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60) || '';
          const score = anchor.textFingerprint
            ? calculateSimilarity(anchor.textFingerprint, candidateText)
            : 0;
          if (score > bestScore) {
            bestScore = score;
            bestEl = candidate;
          }
        }
        if (bestEl && bestScore >= 0.75) {
          const rect = bestEl.getBoundingClientRect();
          return {
            element: bestEl,
            x: computeX(rect.left),
            y: computeY(rect.top),
            tier: 'text-fragment',
          };
        }
      }
    } catch {
      // Fallthrough to Tier 1
    }
  }

  // -- Tier 1: Exact CSS Selector -------------------------------------------
  if (anchor.cssSelector && typeof document !== 'undefined') {
    try {
      const el = document.querySelector(anchor.cssSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        return {
          element: el,
          x: computeX(rect.left),
          y: computeY(rect.top),
          tier: 'selector',
        };
      }
    } catch {
      // Fallthrough to Tier 2
    }
  }

  // -- Tier 2: Text Fragment match ------------------------------------------
  if ((anchor.exactText || anchor.textPrefix) && typeof document !== 'undefined' && document.body) {
    const candidates = Array.from(document.body.querySelectorAll('*')).filter((el) => {
      return el.children.length === 0 || Array.from(el.childNodes).some((n) => n.nodeType === 3);
    });

    const targetFragment =
      `${anchor.textPrefix || ''} ${anchor.exactText || ''} ${anchor.textSuffix || ''}`.trim();

    for (const candidate of candidates) {
      const text = candidate.textContent?.trim() || '';
      if (!text) continue;

      const isExactFragmentMatch = targetFragment && text.includes(targetFragment);
      const isExactTextMatch = anchor.exactText && text.includes(anchor.exactText);
      const matchesPrefixOrSuffix =
        (anchor.textPrefix && text.includes(anchor.textPrefix)) ||
        (anchor.textSuffix && text.includes(anchor.textSuffix));

      if (isExactFragmentMatch || (isExactTextMatch && matchesPrefixOrSuffix) || isExactTextMatch) {
        const rect = candidate.getBoundingClientRect();
        return {
          element: candidate,
          x: computeX(rect.left),
          y: computeY(rect.top),
          tier: 'text-fragment',
        };
      }
    }
  }

  // -- Tier 3: Trigram Fuzzy Match ------------------------------------------
  if (anchor.exactText && typeof document !== 'undefined' && document.body) {
    const candidates = Array.from(document.body.querySelectorAll('*')).filter((el) => {
      return el.children.length === 0 || Array.from(el.childNodes).some((n) => n.nodeType === 3);
    });

    let bestMatch: Element | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const text = candidate.textContent?.trim() || '';
      if (!text || text.length < 3) continue;

      const score = calculateSimilarity(anchor.exactText, text);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    if (bestMatch && bestScore >= 0.75) {
      const rect = bestMatch.getBoundingClientRect();
      return {
        element: bestMatch,
        x: computeX(rect.left),
        y: computeY(rect.top),
        tier: 'fuzzy',
      };
    }
  }

  // -- Tier 4: Stored absolute page coords ----------------------------------
  if (anchor.pageX !== undefined && anchor.pageY !== undefined) {
    return {
      element: null,
      x: anchor.pageX,
      y: anchor.pageY,
      tier: 'unanchored',
    };
  }

  // -- Tier 5: Unanchored — centre of viewport ------------------------------
  return {
    element: null,
    x: Math.max(20, (typeof window !== 'undefined' ? window.innerWidth : 800) / 2 - 120),
    y: Math.max(40, (typeof window !== 'undefined' ? window.innerHeight : 600) / 4),
    tier: 'unanchored',
  };
}


function getSimpleCssSelector(el: Element): string {
  if (typeof document !== 'undefined') {
    if (el === document.body) return 'body';
    if (el === document.documentElement) return 'html';
  }
  if (el.id) return `#${el.id}`;
  const path: string[] = [];
  let current: Element | null = el;
  while (current && current !== document.body && current !== document.documentElement) {
    if (current.id) {
      path.unshift(`#${current.id}`);
      break;
    }
    let selector = current.tagName.toLowerCase();
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(Boolean);
      if (classes.length > 0) {
        selector += `.${classes[0]}`;
      }
    }
    const parent: Element | null = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((c) => c.tagName === current?.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }
    path.unshift(selector);
    current = parent;
  }
  return path.length > 0 ? path.join(' > ') : 'body';
}
