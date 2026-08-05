import type { NoteHighlightRange, NoteColorBlock } from './types';

/**
 * Gets a clean, robust CSS path for an Element or Text node's parent element.
 */
export function getElementPath(node: Node): string {
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  if (!el || typeof document === 'undefined') return 'body';
  if (el === document.body) return 'body';
  if (el.id) return `#${el.id}`;

  const path: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.body && current !== document.documentElement) {
    if (current.id) {
      path.unshift(`#${current.id}`);
      break;
    }
    let selector = current.tagName.toLowerCase();
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

/**
 * Serializes a DOM Range into a persistent NoteHighlightRange object.
 */
export function serializeRange(range: Range): NoteHighlightRange {
  const selectedText = range.toString().trim();
  const startContainerPath = getElementPath(range.startContainer);
  const endContainerPath = getElementPath(range.endContainer);

  return {
    selectedText,
    startContainerPath,
    startOffset: range.startOffset,
    endContainerPath,
    endOffset: range.endOffset,
  };
}

/**
 * Reconstructs a DOM Range from a NoteHighlightRange object with fallback text search.
 */
export function createDOMRangeFromHighlight(highlightRange: NoteHighlightRange): Range | null {
  if (typeof document === 'undefined' || !document.body) return null;

  try {
    const startEl = document.querySelector(highlightRange.startContainerPath);
    const endEl = document.querySelector(highlightRange.endContainerPath);

    if (startEl && endEl) {
      const range = document.createRange();
      const startTextNode = findTextNode(startEl, highlightRange.startOffset);
      const endTextNode = findTextNode(endEl, highlightRange.endOffset);

      if (startTextNode && endTextNode) {
        range.setStart(startTextNode.node, Math.min(startTextNode.node.length, highlightRange.startOffset));
        range.setEnd(endTextNode.node, Math.min(endTextNode.node.length, highlightRange.endOffset));
        if (range.toString().trim() === highlightRange.selectedText.trim()) {
          return range;
        }
      }
    }
  } catch {
    // Fallback to text matching if selector or offsets shifted
  }

  // Fallback: Search text content in DOM for highlightRange.selectedText
  if (highlightRange.selectedText && highlightRange.selectedText.length > 2) {
    const range = findTextRangeByContent(highlightRange.selectedText);
    if (range) return range;
  }

  return null;
}

/**
 * Finds text node and clamped offset inside a parent container element.
 */
function findTextNode(parent: Element, _targetOffset: number): { node: Text } | null {
  const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode() as Text | null;
  while (currentNode) {
    if (currentNode.textContent && currentNode.textContent.length > 0) {
      return { node: currentNode };
    }
    currentNode = walker.nextNode() as Text | null;
  }
  return null;
}

/**
 * Fallback search to locate text string in DOM text nodes.
 */
function findTextRangeByContent(searchText: string): Range | null {
  const target = searchText.trim().toLowerCase();
  if (!target || typeof document === 'undefined' || !document.body) return null;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;

  while (node) {
    const text = (node.textContent || '').toLowerCase();
    const index = text.indexOf(target);
    if (index !== -1) {
      try {
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + searchText.trim().length);
        return range;
      } catch {
        // Continue searching if setStart/setEnd throws
      }
    }
    node = walker.nextNode() as Text | null;
  }

  return null;
}

/**
 * Wraps a DOM Range in pastel <mark class="stickle-highlight-mark stickle-highlight-${color}"> element(s).
 */
export function applyHighlightOverlay(
  range: Range,
  noteId: string,
  color: NoteColorBlock = 'lime'
): HTMLElement[] {
  if (range.collapsed || typeof document === 'undefined') return [];

  // If mark overlay already exists for this noteId, don't duplicate
  const existingMarks = Array.from(document.querySelectorAll(`mark[data-stickle-id="${noteId}"]`));
  if (existingMarks.length > 0) {
    return existingMarks as HTMLElement[];
  }

  const marks: HTMLElement[] = [];
  try {
    const mark = document.createElement('mark');
    mark.className = `stickle-highlight-mark stickle-highlight-${color}`;
    mark.setAttribute('data-stickle-id', noteId);
    mark.style.cursor = 'pointer';

    // Surround contents of range
    range.surroundContents(mark);
    marks.push(mark);
  } catch {
    // If surroundContents fails due to non-leaf selection, wrap extracted contents
    try {
      const mark = document.createElement('mark');
      mark.className = `stickle-highlight-mark stickle-highlight-${color}`;
      mark.setAttribute('data-stickle-id', noteId);
      mark.style.cursor = 'pointer';

      const contents = range.extractContents();
      mark.appendChild(contents);
      range.insertNode(mark);
      marks.push(mark);
    } catch (err) {
      console.warn('[Stickle] Failed to apply highlight overlay:', err);
    }
  }

  return marks;
}

/**
 * Restores a saved highlight overlay on page load or refresh.
 */
export function restoreHighlightOverlay(
  highlightRange: NoteHighlightRange,
  noteId: string,
  color: NoteColorBlock = 'lime'
): boolean {
  const range = createDOMRangeFromHighlight(highlightRange);
  if (!range) return false;
  const marks = applyHighlightOverlay(range, noteId, color);
  return marks.length > 0;
}

/**
 * Removes highlight overlay <mark> tags associated with a deleted note.
 */
export function removeHighlightOverlay(noteId: string): void {
  if (typeof document === 'undefined') return;
  const marks = Array.from(document.querySelectorAll(`mark[data-stickle-id="${noteId}"]`));
  for (const mark of marks) {
    const parent = mark.parentNode;
    if (parent) {
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
      parent.normalize();
    }
  }
}
