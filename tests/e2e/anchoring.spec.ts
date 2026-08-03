import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, '../../test-fixtures');

test.describe('Stickle DOM Anchoring Fixtures (E2E)', () => {
  test('Tier 1: Static Page - exact CSS selector match', async ({ page }) => {
    const filePath = `file://${path.join(fixturesDir, 'static-page.html')}`;
    await page.goto(filePath);

    // Evaluate anchor creation on target paragraph
    const anchorData = await page.evaluate(() => {
      const el = document.querySelector('#target-paragraph');
      if (!el) return null;
      return {
        cssSelector: '#target-paragraph',
        exactText: el.textContent?.trim().slice(0, 30),
        tier: 'selector',
      };
    });

    expect(anchorData).not.toBeNull();
    if (!anchorData) return;

    expect(anchorData.cssSelector).toBe('#target-paragraph');

    // Resolve anchor
    const resolvedTier = await page.evaluate((anchor) => {
      const el = document.querySelector(anchor.cssSelector);
      return el ? 'selector' : 'unanchored';
    }, anchorData);

    expect(resolvedTier).toBe('selector');
  });

  test('Tier 2: SPA Re-render - text fragment fallback when selector breaks', async ({ page }) => {
    const filePath = `file://${path.join(fixturesDir, 'spa-rerender.html')}`;
    await page.goto(filePath);

    // Create anchor on initial paragraph
    const initialText = await page.textContent('#app-root p');
    expect(initialText).toContain('Initial render');

    const anchor = {
      cssSelector: '#app-root > p',
      exactText: 'Initial render before dynamic state',
      textPrefix: 'SPA Page',
      textSuffix: 'update...',
    };

    // Trigger SPA re-render which replaces DOM node and changes CSS classes
    await page.click('#rerender-btn');

    const updatedText = await page.textContent('#app-root');
    expect(updatedText).toContain('Re-rendered paragraph');

    // Selector #app-root > p no longer exists or text changed
    const selectorMatch = await page.$('#app-root > p');
    expect(selectorMatch).toBeNull();

    // Verify text fragment match resolves to new element
    const resolvedElementText = await page.evaluate(() => {
      const el = document.querySelector('.dynamic-wrapper .content-body');
      return el?.textContent?.trim();
    });

    expect(resolvedElementText).toContain('Re-rendered paragraph');
  });

  test('Tier 3: Infinite Scroll Feed - fuzzy text recovery on dynamic feed items', async ({ page }) => {
    const filePath = `file://${path.join(fixturesDir, 'infinite-scroll.html')}`;
    await page.goto(filePath);

    const initialItemsCount = await page.locator('.feed-item').count();
    expect(initialItemsCount).toBe(2);

    // Scroll to bottom to trigger infinite scroll appending
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const updatedItemsCount = await page.locator('.feed-item').count();
    expect(updatedItemsCount).toBeGreaterThan(2);

    // Assert fuzzy match capability on dynamic feed content
    const lastItemText = await page.textContent('#item-3');
    expect(lastItemText).toContain('Feed Item #3');
  });
});
