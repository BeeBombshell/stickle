import { defineContentScript } from 'wxt/sandbox';
import { render, h } from 'preact';
import { NoteBubble } from '../components/NoteBubble';
import { createAnchor, resolveAnchor } from '../lib/anchoring';
import { createNote, getNotesForUrl, updateNote, deleteNote } from '../lib/db';
import { loadSettings } from '../components/Settings';
import { pushNoteToNotion } from '../lib/notion';
import type { StickleNote } from '../lib/types';
import {
  serializeRange,
  applyHighlightOverlay,
  restoreHighlightOverlay,
  removeHighlightOverlay,
} from '../lib/highlighting';
import '../styles/design-tokens.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    console.log('[Stickle Content] Injected & active on page:', window.location.href);

    const hostContainer = getOrCreateHostContainer();
    const mountedNotes = new Map<string, HTMLElement>();

    // Initial load and anchor resolution
    await refreshNotes();

    // Expose global re-anchoring helper in content script scope
    (window as any).stickleReanchor = refreshNotes;

    // Listen for storage changes across popup & other contexts
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.stickle_notes) {
          refreshNotes();
        }
      });
    }

    // Listen for custom DOM events & window messages from page scope
    document.addEventListener('stickle:reanchor', () => refreshNotes());
    window.addEventListener('message', (event) => {
      if (event.data === 'stickle-reanchor') {
        refreshNotes();
      }
    });

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(async (msg, _sender, sendResponse) => {
        if (msg?.type === 'TRIGGER_CREATE_NOTE') {
          const target = document.body;
          if (!target) return;
          const rect = target.getBoundingClientRect();
          const offsetX = Math.max(20, (window.innerWidth || 800) / 2 - rect.left - 100);
          const offsetY = Math.max(20, (window.innerHeight || 600) / 3 - rect.top);
          const anchor = createAnchor(target, offsetX, offsetY);
          const settings = await loadSettings();
          const newNote: StickleNote = {
            id: crypto.randomUUID(),
            url: normalizeUrl(window.location.href),
            pageTitle: document.title,
            content: '',
            anchor,
            color: settings.defaultNoteColor || 'cream',
            collapsed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            syncedToNotion: false,
          };
          await createNote(newNote);
          const wrapper = renderNoteWrapper(newNote);
          setTimeout(() => {
            const textarea = wrapper?.querySelector('textarea');
            textarea?.focus();
          }, 50);
          sendResponse?.({ success: true, noteId: newNote.id });
        }
      });
    }

    // Debounced automatic re-anchoring on DOM mutation (SPA re-renders, dynamic feeds)
    let reanchorTimeout: any = null;
    const debouncedReanchor = () => {
      if (reanchorTimeout) clearTimeout(reanchorTimeout);
      reanchorTimeout = setTimeout(() => {
        refreshNotes();
      }, 250);
    };

    const observer = new MutationObserver((mutations) => {
      const isInternalMutation = mutations.every(
        (m) => hostContainer.contains(m.target) || m.target === hostContainer
      );
      if (!isInternalMutation) {
        debouncedReanchor();
      }
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    // Re-anchor on scroll or window resize
    window.addEventListener('resize', debouncedReanchor, { passive: true });

    // Listen for Alt + Click to spawn a new note at cursor position (use capture phase)
    window.addEventListener(
      'click',
      async (e: MouseEvent) => {
        if (!e.altKey) return;

        const target = e.target as HTMLElement;
        const container = getOrCreateHostContainer();
        if (!target || container.contains(target)) return;

        e.preventDefault();
        e.stopPropagation();

        const rect = target.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const anchor = createAnchor(target, offsetX, offsetY);
        const settings = await loadSettings();
        const newNote: StickleNote = {
          id: crypto.randomUUID(),
          url: normalizeUrl(window.location.href),
          pageTitle: document.title,
          content: '',
          anchor,
          color: settings.defaultNoteColor || 'cream',
          collapsed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          syncedToNotion: false,
        };

        await createNote(newNote);
        const wrapper = renderNoteWrapper(newNote);
        setTimeout(() => {
          const textarea = wrapper?.querySelector('textarea');
          textarea?.focus();
        }, 50);
      },
      true
    );

    // Floating action pill element for text selection highlights
    let selectionPill: HTMLElement | null = null;

    const hideSelectionPill = () => {
      if (selectionPill) {
        selectionPill.remove();
        selectionPill = null;
      }
    };

    const handleSelectionCheck = async () => {
      if (typeof window === 'undefined') return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        hideSelectionPill();
        return;
      }

      const selectedText = selection.toString().trim();
      if (selectedText.length <= 2) {
        hideSelectionPill();
        return;
      }

      const range = selection.getRangeAt(0);
      const container = getOrCreateHostContainer();
      if (container.contains(range.commonAncestorContainer)) {
        hideSelectionPill();
        return;
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        hideSelectionPill();
        return;
      }

      if (!selectionPill) {
        selectionPill = document.createElement('button');
        selectionPill.className = 'stickle-selection-pill';
        selectionPill.innerHTML = '📌 Highlight & Note';
        selectionPill.style.position = 'absolute';
        selectionPill.style.zIndex = '2147483647';
        selectionPill.style.pointerEvents = 'auto';
        selectionPill.style.display = 'inline-flex';
        selectionPill.style.alignItems = 'center';
        selectionPill.style.gap = '6px';
        selectionPill.style.padding = '6px 14px';
        selectionPill.style.backgroundColor = '#111111';
        selectionPill.style.color = '#ffffff';
        selectionPill.style.fontSize = '12px';
        selectionPill.style.fontWeight = '600';
        selectionPill.style.fontFamily = 'Inter, -apple-system, sans-serif';
        selectionPill.style.borderRadius = '50px';
        selectionPill.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.2)';
        selectionPill.style.cursor = 'pointer';
        selectionPill.style.border = 'none';
        container.appendChild(selectionPill);
      }

      const pillLeft = Math.max(10, window.scrollX + rect.left + rect.width / 2 - 65);
      const pillTop = Math.max(10, window.scrollY + rect.top - 38);

      selectionPill.style.left = `${pillLeft}px`;
      selectionPill.style.top = `${pillTop}px`;

      selectionPill.onclick = async (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const currentSelection = window.getSelection();
        if (!currentSelection || currentSelection.rangeCount === 0) return;
        const currentRange = currentSelection.getRangeAt(0);
        const highlightText = currentRange.toString().trim();

        const highlightRange = serializeRange(currentRange);
        const targetEl =
          (currentRange.startContainer.nodeType === Node.ELEMENT_NODE
            ? (currentRange.startContainer as Element)
            : currentRange.startContainer.parentElement) || document.body;

        const targetRect = targetEl.getBoundingClientRect();
        const offsetX = rect.left - targetRect.left;
        const offsetY = rect.top - targetRect.top;

        const anchor = createAnchor(targetEl, offsetX, offsetY);
        const settings = await loadSettings();
        const color = settings.defaultNoteColor || 'cream';

        const newNote: StickleNote = {
          id: crypto.randomUUID(),
          url: normalizeUrl(window.location.href),
          pageTitle: document.title,
          content: `"${highlightText}"`,
          anchor,
          color,
          collapsed: false,
          highlightRange,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          syncedToNotion: false,
        };

        // Wrap DOM selection range in <mark> tag
        applyHighlightOverlay(currentRange, newNote.id, color);
        await createNote(newNote);

        hideSelectionPill();
        currentSelection.removeAllRanges();

        const wrapper = renderNoteWrapper(newNote);
        setTimeout(() => {
          const textarea = wrapper?.querySelector('textarea');
          textarea?.focus();
        }, 50);
      };
    };

    document.addEventListener('mouseup', () => {
      setTimeout(handleSelectionCheck, 10);
    });

    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        hideSelectionPill();
      }
    });

    // Delegated click handler on <mark class="stickle-highlight-mark"> elements
    document.addEventListener('click', async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList && target.classList.contains('stickle-highlight-mark')) {
        const noteId = target.getAttribute('data-stickle-id');
        if (noteId) {
          e.stopPropagation();

          // Fetch latest notes for page and expand if collapsed
          const notes = await getNotesForUrl(normalizeUrl(window.location.href));
          const targetNote = notes.find((n) => n.id === noteId);
          if (targetNote && targetNote.collapsed) {
            targetNote.collapsed = false;
            await updateNote(noteId, { collapsed: false, updatedAt: Date.now() });
            renderNoteWrapper(targetNote);
          }

          const wrapper = mountedNotes.get(noteId);
          if (wrapper) {
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add high-visibility pulse animation ring
            const bubbleEl = (wrapper.firstElementChild as HTMLElement) || wrapper;
            bubbleEl.classList.remove('stickle-note-pulse');
            void bubbleEl.offsetWidth; // Force reflow
            bubbleEl.classList.add('stickle-note-pulse');
            setTimeout(() => {
              bubbleEl.classList.remove('stickle-note-pulse');
            }, 2400);

            const textarea = wrapper.querySelector('textarea');
            textarea?.focus();
          }
        }
      }
    });

    async function refreshNotes() {
      try {
        const notes = await getNotesForUrl(normalizeUrl(window.location.href));
        const currentIds = new Set(notes.map((n) => n.id));

        // Clean up unmounted notes that were deleted
        for (const [id, wrapper] of mountedNotes.entries()) {
          if (!currentIds.has(id)) {
            wrapper.remove();
            mountedNotes.delete(id);
            removeHighlightOverlay(id);
          }
        }

        for (const note of notes) {
          if (note.highlightRange) {
            restoreHighlightOverlay(note.highlightRange, note.id, note.color);
          }

          const resolved = resolveAnchor(note.anchor);
          if (resolved.tier !== note.anchor.tier) {
            note.anchor.tier = resolved.tier;
            await updateNote(note.id, { anchor: note.anchor });
          }
          const wrapper = mountedNotes.get(note.id);
          const isFocused = wrapper && wrapper.contains(document.activeElement);
          if (!isFocused) {
            renderNoteWrapper(note, resolved.x, resolved.y);
          }
        }
      } catch (err) {
        console.error('[Stickle] Failed to load notes:', err);
      }
    }

    function renderNoteWrapper(note: StickleNote, initialX?: number, initialY?: number) {
      let wrapper = mountedNotes.get(note.id);
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = `stickle-note-wrapper-${note.id}`;
        wrapper.style.position = 'absolute';
        wrapper.style.zIndex = '2147483647';
        wrapper.style.pointerEvents = 'auto';
        wrapper.style.display = 'block';
        wrapper.style.visibility = 'visible';
        wrapper.style.colorScheme = 'light';
        const container = getOrCreateHostContainer();
        container.appendChild(wrapper);
        mountedNotes.set(note.id, wrapper);
      }

      const resolved = resolveAnchor(note.anchor);
      let posX = initialX ?? resolved.x;
      let posY = initialY ?? resolved.y;

      wrapper.style.left = `${posX}px`;
      wrapper.style.top = `${posY}px`;
      wrapper.style.display = 'block';
      wrapper.style.visibility = 'visible';

      const handleSave = async (content: string) => {
        note.content = content;
        note.updatedAt = Date.now();
        await updateNote(note.id, { content, updatedAt: note.updatedAt });
      };

      const handleDelete = async () => {
        await deleteNote(note.id);
        removeHighlightOverlay(note.id);
        wrapper?.remove();
        mountedNotes.delete(note.id);
      };

      const handleColorChange = async (color: any) => {
        note.color = color;
        note.updatedAt = Date.now();
        await updateNote(note.id, { color, updatedAt: note.updatedAt });

        // Update mark overlay colors if highlight note
        const marks = document.querySelectorAll(`mark[data-stickle-id="${note.id}"]`);
        marks.forEach((m) => {
          m.className = `stickle-highlight-mark stickle-highlight-${color}`;
        });

        renderNoteWrapper(note, posX, posY);
      };

      const handleToggleCollapse = async (collapsed: boolean) => {
        note.collapsed = collapsed;
        note.updatedAt = Date.now();
        await updateNote(note.id, { collapsed, updatedAt: note.updatedAt });
        renderNoteWrapper(note, posX, posY);
      };

      const handleExportNotion = async () => {
        try {
          const config = await loadSettings();
          if (!config.apiKey || !config.databaseId) {
            alert('Please configure Notion Integration Token and Database ID in Stickle extension settings.');
            return;
          }
          await pushNoteToNotion(note, config);
          refreshNotes();
        } catch (err: any) {
          alert(`Notion Export Failed: ${err.message}`);
        }
      };

      let dragStartPosX = posX;
      let dragStartPosY = posY;

      const handleDragStart = () => {
        dragStartPosX = posX;
        dragStartPosY = posY;
      };

      const handleDrag = (dx: number, dy: number) => {
        if (!wrapper) return;
        wrapper.style.left = `${dragStartPosX + dx}px`;
        wrapper.style.top = `${dragStartPosY + dy}px`;
      };

      const handleDragEnd = async (clientX: number, clientY: number) => {
        if (!wrapper) return;
        const newLeft = parseFloat(wrapper.style.left) || posX;
        const newTop = parseFloat(wrapper.style.top) || posY;
        posX = newLeft;
        posY = newTop;

        wrapper.style.visibility = 'hidden';
        const targetEl = document.elementFromPoint(clientX, clientY) || document.body;
        wrapper.style.visibility = 'visible';

        const scrollX = window.scrollX || 0;
        const scrollY = window.scrollY || 0;
        const bodyRect = (document.body || document.documentElement).getBoundingClientRect();
        const bodyLeft = scrollX + bodyRect.left;
        const bodyTop = scrollY + bodyRect.top;

        const targetRect = targetEl.getBoundingClientRect();
        const targetPageLeft = scrollX + targetRect.left - bodyLeft;
        const targetPageTop = scrollY + targetRect.top - bodyTop;

        const offsetX = newLeft - targetPageLeft;
        const offsetY = newTop - targetPageTop;

        const newAnchor = createAnchor(targetEl, offsetX, offsetY);
        note.anchor = newAnchor;
        await updateNote(note.id, { anchor: newAnchor, updatedAt: Date.now() });

        renderNoteWrapper(note, posX, posY);
      };

      render(
        h(NoteBubble, {
          note,
          onSave: handleSave,
          onDelete: handleDelete,
          onExportNotion: handleExportNotion,
          onColorChange: handleColorChange,
          onToggleCollapse: handleToggleCollapse,
          onDragStart: handleDragStart,
          onDrag: handleDrag,
          onDragEnd: handleDragEnd,
        }),
        wrapper
      );

      return wrapper;
    }
  },
});

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

function getOrCreateHostContainer(): HTMLElement {
  let container = document.getElementById('stickle-notes-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'stickle-notes-root';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '0';
    container.style.height = '0';
    container.style.overflow = 'visible';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '2147483646';
    container.style.colorScheme = 'light';
    const parent = document.body || document.documentElement;
    if (parent) {
      parent.appendChild(container);
    }
  }
  return container;
}

