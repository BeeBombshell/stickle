import { defineContentScript } from 'wxt/sandbox';
import { render, h } from 'preact';
import { NoteBubble } from '../components/NoteBubble';
import { createAnchor, resolveAnchor } from '../lib/anchoring';
import { createNote, getNotesForUrl, updateNote, deleteNote } from '../lib/db';
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

    // Listen for custom DOM events & window messages from page scope
    document.addEventListener('stickle:reanchor', () => refreshNotes());
    window.addEventListener('message', (event) => {
      if (event.data === 'stickle-reanchor') {
        refreshNotes();
      }
    });

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
        for (const note of notes) {
          const resolved = resolveAnchor(note.anchor);
          if (resolved.tier !== note.anchor.tier) {
            note.anchor.tier = resolved.tier;
            await updateNote(note.id, { anchor: note.anchor });
          }
          renderNoteWrapper(note, resolved.x, resolved.y);
        }
      } catch (err) {
        console.error('[Stickle] Failed to load notes:', err);
      }
    }

    function renderNoteWrapper(note: StickleNote, initialX?: number, initialY?: number) {
      if (mountedNotes.has(note.id)) {
        const existing = mountedNotes.get(note.id);
        if (existing) existing.remove();
      }

      const resolved = resolveAnchor(note.anchor);
      const posX = initialX ?? resolved.x;
      const posY = initialY ?? resolved.y;

      const wrapper = document.createElement('div');
      wrapper.id = `stickle-note-wrapper-${note.id}`;
      wrapper.style.position = 'absolute';
      wrapper.style.left = `${posX}px`;
      wrapper.style.top = `${posY}px`;
      wrapper.style.zIndex = '2147483647';

      hostContainer.appendChild(wrapper);
      mountedNotes.set(note.id, wrapper);

      const handleSave = async (content: string) => {
        note.content = content;
        note.updatedAt = Date.now();
        await updateNote(note.id, { content, updatedAt: note.updatedAt });
      };

      const handleDelete = async () => {
        await deleteNote(note.id);
        wrapper.remove();
        mountedNotes.delete(note.id);
      };

      render(
        h(NoteBubble, {
          note,
          onSave: handleSave,
          onDelete: handleDelete,
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
    document.body.appendChild(container);
  }
  return container;
}
