import type { NoteAnchor, AnchorTier } from './types';

export interface ResolvedAnchor {
  element: Element | null;
  x: number;
  y: number;
  tier: AnchorTier;
}

/**
 * Creates an anchor object capturing CSS selector and text context around a click target.
 */
export function createAnchor(element: Element, offsetX: number, offsetY: number): NoteAnchor {
  return {
    cssSelector: getSimpleCssSelector(element),
    exactText: element.textContent?.trim().slice(0, 30) || undefined,
    offsetX,
    offsetY,
    tier: 'selector',
  };
}

/**
 * Resolves an anchor against the current DOM using 3-tier fallback.
 */
export function resolveAnchor(anchor: NoteAnchor): ResolvedAnchor {
  // Tier 1: Exact CSS selector
  if (anchor.cssSelector) {
    try {
      const el = document.querySelector(anchor.cssSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        return {
          element: el,
          x: window.scrollX + rect.left + anchor.offsetX,
          y: window.scrollY + rect.top + anchor.offsetY,
          tier: 'selector',
        };
      }
    } catch {
      // Fallthrough to Tier 2
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
  if (el.id) return `#${el.id}`;
  const path: string[] = [];
  let current: Element | null = el;
  while (current && current !== document.body && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(Boolean);
      if (classes.length > 0) {
        selector += `.${classes[0]}`;
      }
    }
    const parent: Element | null = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.tagName === current?.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }
    path.unshift(selector);
    current = parent;
  }
  return path.join(' > ');
}
