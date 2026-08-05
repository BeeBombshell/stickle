import { defineContentScript } from 'wxt/sandbox';
import { render, h } from 'preact';
import { NoteBubble } from '../components/NoteBubble';
import { createAnchor, resolveAnchor } from '../lib/anchoring';
import { createNote, getNotesForUrl, updateNote, deleteNote } from '../lib/db';
import { loadSettings } from '../components/Settings';
import { pushNoteToNotion } from '../lib/notion';
import type { StickleNote } from '../lib/types';

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
      chrome.runtime.onMessage.addListener(async (msg) => {
        if (msg?.type === 'TRIGGER_CREATE_NOTE') {
          const target = document.body;
          if (!target) return;
          const rect = target.getBoundingClientRect();
          const offsetX = Math.max(20, window.innerWidth / 2 - rect.left - 100);
          const offsetY = Math.max(20, window.innerHeight / 3 - rect.top);
          const anchor = createAnchor(target, offsetX, offsetY);
          const newNote: StickleNote = {
            id: crypto.randomUUID(),
            url: normalizeUrl(window.location.href),
            pageTitle: document.title,
            content: '',
            anchor,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            syncedToNotion: false,
          };
          await createNote(newNote);
          renderNoteWrapper(newNote);
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

    // Listen for Alt + Click to spawn a new note at cursor position
    window.addEventListener('click', async (e: MouseEvent) => {
      if (!e.altKey) return;

      const target = e.target as HTMLElement;
      if (!target || hostContainer.contains(target)) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = target.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      const anchor = createAnchor(target, offsetX, offsetY);
      const newNote: StickleNote = {
        id: crypto.randomUUID(),
        url: normalizeUrl(window.location.href),
        pageTitle: document.title,
        content: '',
        anchor,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncedToNotion: false,
      };

      await createNote(newNote);
      renderNoteWrapper(newNote);
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
          }
        }

        for (const note of notes) {
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
        wrapper.style.colorScheme = 'light';
        hostContainer.appendChild(wrapper);
        mountedNotes.set(note.id, wrapper);
      }

      const resolved = resolveAnchor(note.anchor);
      let posX = initialX ?? resolved.x;
      let posY = initialY ?? resolved.y;

      wrapper.style.left = `${posX}px`;
      wrapper.style.top = `${posY}px`;

      const handleSave = async (content: string) => {
        note.content = content;
        note.updatedAt = Date.now();
        await updateNote(note.id, { content, updatedAt: note.updatedAt });
      };

      const handleDelete = async () => {
        await deleteNote(note.id);
        wrapper?.remove();
        mountedNotes.delete(note.id);
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

        const rect = targetEl.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;

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
          onDragStart: handleDragStart,
          onDrag: handleDrag,
          onDragEnd: handleDragEnd,
        }),
        wrapper
      );
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
    container.style.width = '100%';
    container.style.pointerEvents = 'auto';
    container.style.zIndex = '2147483646';
    container.style.colorScheme = 'light';
    document.body.appendChild(container);
  }
  return container;
}
