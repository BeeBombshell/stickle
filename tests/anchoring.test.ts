import { describe, it, expect, beforeEach } from 'vitest';
import { createAnchor, resolveAnchor, calculateSimilarity } from '../lib/anchoring';

describe('Anchoring Strategy (3-tier fallback)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('creates an anchor with CSS selector and text fragment context', () => {
    const element = document.createElement('div');
    element.id = 'target-header';
    element.textContent = 'Welcome to Stickle testing application';
    document.body.appendChild(element);

    const anchor = createAnchor(element, 15, 25);
    expect(anchor.cssSelector).toBe('#target-header');
    expect(anchor.exactText).toBe('Welcome to Stickle testing app');
    expect(anchor.offsetX).toBe(15);
    expect(anchor.offsetY).toBe(25);
  });

  it('calculates trigram similarity correctly', () => {
    expect(calculateSimilarity('Stickle DOM Anchoring', 'Stickle DOM Anchoring')).toBe(1.0);
    expect(calculateSimilarity('Stickle DOM Anchoring', 'Stickle DOM Anchor')).toBeGreaterThanOrEqual(0.75);
    expect(calculateSimilarity('Stickle DOM Anchoring', 'Completely Different Text')).toBeLessThan(0.3);
  });

  it('resolves Tier 1 exact selector match', () => {
    const element = document.createElement('p');
    element.id = 'paragraph-1';
    element.textContent = 'Tier 1 paragraph content';
    document.body.appendChild(element);

    const anchor = {
      cssSelector: '#paragraph-1',
      exactText: 'Tier 1 paragraph content',
      offsetX: 5,
      offsetY: 10,
      tier: 'selector' as const,
    };

    const resolved = resolveAnchor(anchor);
    expect(resolved.tier).toBe('selector');
    expect(resolved.element).toBe(element);
  });

  it('resolves Tier 2 text fragment match when selector fails', () => {
    const container = document.createElement('div');
    container.className = 'renamed-container';
    container.textContent = 'Important note context snippet attached here';
    document.body.appendChild(container);

    const anchor = {
      cssSelector: '#old-broken-selector-id',
      exactText: 'Important note context snippet',
      textPrefix: 'Header text',
      textSuffix: 'attached here',
      offsetX: 10,
      offsetY: 15,
      tier: 'selector' as const,
    };

    const resolved = resolveAnchor(anchor);
    expect(resolved.tier).toBe('text-fragment');
    expect(resolved.element).toBe(container);
  });

  it('resolves Tier 3 fuzzy match when text is slightly altered', () => {
    const element = document.createElement('p');
    element.className = 'dynamic-paragraph';
    element.textContent = 'Robust anchoring system for dynamic web notes';
    document.body.appendChild(element);

    const anchor = {
      cssSelector: '#missing-id',
      exactText: 'Robust anchor system for dynamic web',
      offsetX: 0,
      offsetY: 0,
      tier: 'selector' as const,
    };

    const resolved = resolveAnchor(anchor);
    expect(resolved.tier).toBe('fuzzy');
    expect(resolved.element).toBe(element);
  });

  it('degrades to Tier 4 unanchored when element and text are absent', () => {
    const anchor = {
      cssSelector: '#non-existent-element-xyz',
      exactText: 'Unmatched non-existent string XYZ',
      offsetX: 0,
      offsetY: 0,
      tier: 'selector' as const,
    };

    const resolved = resolveAnchor(anchor);
    expect(resolved.tier).toBe('unanchored');
    expect(resolved.element).toBeNull();
  });
});

