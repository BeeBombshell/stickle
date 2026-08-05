import { describe, it, expect, beforeEach } from 'vitest';
import {
  getElementPath,
  serializeRange,
  applyHighlightOverlay,
  restoreHighlightOverlay,
  removeHighlightOverlay,
  createDOMRangeFromHighlight,
} from '../lib/highlighting';
import type { NoteHighlightRange } from '../lib/types';

describe('Phase 7: Text Selection Highlights (Hypothesis-Style)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('generates a clean element selector path', () => {
    const div = document.createElement('div');
    div.id = 'article-content';
    const p = document.createElement('p');
    p.textContent = 'Sample paragraph text for highlighting.';
    div.appendChild(p);
    document.body.appendChild(div);

    const path = getElementPath(p);
    expect(path).toBe('#article-content > p');
  });

  it('serializes a DOM Range into a NoteHighlightRange object', () => {
    const container = document.createElement('div');
    container.id = 'test-container';
    const p = document.createElement('p');
    p.textContent = 'Highlight this specific text in the article.';
    container.appendChild(p);
    document.body.appendChild(container);

    const textNode = p.firstChild as Text;
    const range = document.createRange();
    range.setStart(textNode, 10); // "this"
    range.setEnd(textNode, 28);   // "specific text"

    const serialized = serializeRange(range);
    expect(serialized.selectedText).toBe('this specific text');
    expect(serialized.startContainerPath).toBe('#test-container > p');
    expect(serialized.startOffset).toBe(10);
    expect(serialized.endOffset).toBe(28);
  });

  it('wraps a text range in a pastel <mark> element', () => {
    const p = document.createElement('p');
    p.id = 'target-p';
    p.textContent = 'Selecting important phrase here.';
    document.body.appendChild(p);

    const textNode = p.firstChild as Text;
    const range = document.createRange();
    range.setStart(textNode, 10);
    range.setEnd(textNode, 26); // "important phrase"

    const marks = applyHighlightOverlay(range, 'note-123', 'mint');
    expect(marks.length).toBeGreaterThan(0);

    const markEl = document.querySelector('mark[data-stickle-id="note-123"]');
    expect(markEl).not.toBeNull();
    expect(markEl?.className).toContain('stickle-highlight-mark');
    expect(markEl?.className).toContain('stickle-highlight-mint');
    expect(markEl?.textContent).toBe('important phrase');
  });

  it('restores a highlight overlay from a saved NoteHighlightRange object', () => {
    const container = document.createElement('div');
    container.id = 'article-body';
    const p = document.createElement('p');
    p.textContent = 'Persistent highlight text test.';
    container.appendChild(p);
    document.body.appendChild(container);

    const highlightRange: NoteHighlightRange = {
      selectedText: 'highlight text',
      startContainerPath: '#article-body > p',
      startOffset: 11,
      endContainerPath: '#article-body > p',
      endOffset: 25,
    };

    const restored = restoreHighlightOverlay(highlightRange, 'note-456', 'pink');
    expect(restored).toBe(true);

    const markEl = document.querySelector('mark[data-stickle-id="note-456"]');
    expect(markEl).not.toBeNull();
    expect(markEl?.className).toContain('stickle-highlight-pink');
    expect(markEl?.textContent).toBe('highlight text');
  });

  it('removes highlight overlay <mark> tags cleanly without losing text', () => {
    const p = document.createElement('p');
    p.textContent = 'Text before highlight Text after.';
    document.body.appendChild(p);

    const textNode = p.firstChild as Text;
    const range = document.createRange();
    range.setStart(textNode, 12);
    range.setEnd(textNode, 21); // "highlight"

    applyHighlightOverlay(range, 'note-789', 'coral');
    expect(document.querySelector('mark[data-stickle-id="note-789"]')).not.toBeNull();

    removeHighlightOverlay('note-789');
    expect(document.querySelector('mark[data-stickle-id="note-789"]')).toBeNull();
    expect(p.textContent).toBe('Text before highlight Text after.');
  });
});
