import type { NoteAnchor, AnchorTier } from './types';

export interface ResolvedAnchor {
  element: Element | null;
  x: number;
  y: number;
  tier: AnchorTier;
}

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

/**
  * Creates an anchor object capturing CSS selector and text context around a click target.
  */
export function createAnchor(element: Element, offsetX: number, offsetY: number): NoteAnchor {
  const cssSelector = getSimpleCssSelector(element);
  const rawText = element.textContent?.trim() || '';
  const exactText = rawText.slice(0, 30) || undefined;
  const context = exactText ? getDomTextContext(element, exactText) : {};

  return {
    cssSelector,
    exactText,
    textPrefix: context.textPrefix,
    textSuffix: context.textSuffix,
    offsetX,
    offsetY,
    tier: 'selector',
  };
}

/**
  * Resolves an anchor against the current DOM using 3-tier fallback.
  */
export function resolveAnchor(anchor: NoteAnchor): ResolvedAnchor {
  const scrollX = typeof window !== 'undefined' ? window.scrollX : 0;
  const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;

  // Tier 1: Exact CSS selector
  if (anchor.cssSelector && typeof document !== 'undefined') {
    try {
      const el = document.querySelector(anchor.cssSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        return {
          element: el,
          x: scrollX + rect.left + anchor.offsetX,
          y: scrollY + rect.top + anchor.offsetY,
          tier: 'selector',
        };
      }
    } catch {
      // Fallthrough to Tier 2
    }
  }

  // Tier 2: Text Fragment match (Prefix + exactText + Suffix or exactText match in DOM)
  if ((anchor.exactText || anchor.textPrefix) && typeof document !== 'undefined' && document.body) {
    const candidates = Array.from(document.body.querySelectorAll('*')).filter((el) => {
      // Leaf or text container elements
      return el.children.length === 0 || Array.from(el.childNodes).some((n) => n.nodeType === 3);
    });

    const targetFragment = `${anchor.textPrefix || ''} ${anchor.exactText || ''} ${anchor.textSuffix || ''}`.trim();

    // Look for exact fragment match or exact text match
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
          x: scrollX + rect.left + anchor.offsetX,
          y: scrollY + rect.top + anchor.offsetY,
          tier: 'text-fragment',
        };
      }
    }
  }

  // Tier 3: Fuzzy Match (trigram similarity threshold >= 0.75)
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
        x: scrollX + rect.left + anchor.offsetX,
        y: scrollY + rect.top + anchor.offsetY,
        tier: 'fuzzy',
      };
    }
  }

  // Tier 4 Degraded: Unanchored
  return {
    element: null,
    x: 20,
    y: 20,
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


