import { describe, it, expect, beforeEach } from 'vitest';
import { createAnchor, resolveAnchor } from '../lib/anchoring';
import fs from 'fs';
import path from 'path';

const fixturesDir = path.resolve(__dirname, '../test-fixtures');

describe('HTML Fixture Anchoring Verification (Vitest)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('static-page.html: resolves Tier 1 selector', () => {
    const html = fs.readFileSync(path.join(fixturesDir, 'static-page.html'), 'utf-8');
    document.body.innerHTML = html;

    const targetEl = document.querySelector('#target-paragraph');
    expect(targetEl).not.toBeNull();

    if (targetEl) {
      const anchor = createAnchor(targetEl, 10, 10);
      expect(anchor.cssSelector).toBe('#target-paragraph');

      const resolved = resolveAnchor(anchor);
      expect(resolved.tier).toBe('selector');
      expect(resolved.element).toBe(targetEl);
    }
  });

  it('spa-rerender.html: resolves Tier 2 / Tier 3 when DOM mutates', () => {
    const html = fs.readFileSync(path.join(fixturesDir, 'spa-rerender.html'), 'utf-8');
    document.body.innerHTML = html;

    const initialEl = document.querySelector('#app-root p');
    expect(initialEl).not.toBeNull();

    if (initialEl) {
      const anchor = createAnchor(initialEl, 5, 5);
      expect(anchor.cssSelector).toBe('#app-root > p.initial-para');

      // Simulate SPA DOM mutation: p element is replaced with section tag and new classes
      document.querySelector('#app-root')!.innerHTML = `
        <div class="dynamic-wrapper">
          <section class="content-body">
            Initial render before dynamic state update...
          </section>
        </div>
      `;

      // Selector #app-root > p.initial-para fails, Tier 2 text fragment resolves
      const resolved = resolveAnchor(anchor);
      expect(['text-fragment', 'fuzzy']).toContain(resolved.tier);
      expect(resolved.element).not.toBeNull();
    }
  });

  it('infinite-scroll.html: resolves anchor on dynamic feed items', () => {
    const html = fs.readFileSync(path.join(fixturesDir, 'infinite-scroll.html'), 'utf-8');
    document.body.innerHTML = html;

    const feedItem = document.querySelector('#item-2');
    expect(feedItem).not.toBeNull();

    if (feedItem) {
      const anchor = createAnchor(feedItem, 0, 0);

      // Simulate infinite scroll adding elements before target
      const newTopItem = document.createElement('div');
      newTopItem.className = 'feed-item';
      newTopItem.id = 'item-0';
      newTopItem.textContent = 'Prepended Feed Item #0';
      document.querySelector('#feed')!.prepend(newTopItem);

      const resolved = resolveAnchor(anchor);
      expect(resolved.tier).toBe('selector');
      expect(resolved.element?.id).toBe('item-2');
    }
  });
});
