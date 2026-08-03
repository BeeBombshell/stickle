import { describe, it, expect } from 'vitest';
import { createAnchor, resolveAnchor } from '../lib/anchoring';

describe('Anchoring Strategy (3-tier fallback)', () => {
  it('creates an anchor with CSS selector and text fragment snippet', () => {
    const element = document.createElement('div');
    element.id = 'target-header';
    element.textContent = 'Welcome to Stickle';
    document.body.appendChild(element);

    const anchor = createAnchor(element, 15, 25);
    expect(anchor.cssSelector).toBe('#target-header');
    expect(anchor.exactText).toBe('Welcome to Stickle');
    expect(anchor.offsetX).toBe(15);
    expect(anchor.offsetY).toBe(25);
  });

  it('resolves Tier 1 exact selector match', () => {
    const element = document.createElement('p');
    element.id = 'paragraph-1';
    document.body.appendChild(element);

    const anchor = {
      cssSelector: '#paragraph-1',
      offsetX: 5,
      offsetY: 10,
      tier: 'selector' as const,
    };

    const resolved = resolveAnchor(anchor);
    expect(resolved.tier).toBe('selector');
    expect(resolved.element).toBe(element);
  });

  it('degrades to unanchored when element is absent', () => {
    const anchor = {
      cssSelector: '#non-existent-element-xyz',
      offsetX: 0,
      offsetY: 0,
      tier: 'selector' as const,
    };

    const resolved = resolveAnchor(anchor);
    expect(resolved.tier).toBe('unanchored');
    expect(resolved.element).toBeNull();
  });
});
