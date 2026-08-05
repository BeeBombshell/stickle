import { describe, it, expect, beforeEach } from 'vitest';
import type { StickleNote, NoteColorBlock } from '../lib/types';
import { createNote, getAllNotes, updateNote, deleteNote, db } from '../lib/db';
import { COLOR_SWATCHES } from '../components/NoteBubble';

describe('Phase 6: Note Customization & Collapsible UI', () => {
  beforeEach(async () => {
    await db.notes.clear();
  });

  it('validates COLOR_SWATCHES contains all 7 Figma pastel color blocks', () => {
    const expectedColors: NoteColorBlock[] = ['lime', 'lilac', 'cream', 'mint', 'pink', 'coral', 'navy'];
    for (const color of expectedColors) {
      expect(COLOR_SWATCHES[color]).toBeDefined();
      expect(COLOR_SWATCHES[color].bg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(COLOR_SWATCHES[color].text).toBeDefined();
    }
  });

  it('creates a note with color and collapsed properties', async () => {
    const note: StickleNote = {
      id: 'test-custom-1',
      url: 'https://example.com/test',
      pageTitle: 'Test Custom Note',
      content: 'Custom note test content',
      anchor: {
        cssSelector: 'body > p',
        offsetX: 10,
        offsetY: 20,
        tier: 'selector',
      },
      color: 'mint',
      collapsed: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
    };

    await createNote(note);
    const all = await getAllNotes();
    expect(all).toHaveLength(1);
    expect(all[0].color).toBe('mint');
    expect(all[0].collapsed).toBe(true);
  });

  it('updates note color and toggles collapsed state', async () => {
    const note: StickleNote = {
      id: 'test-custom-2',
      url: 'https://example.com/test',
      pageTitle: 'Test Note 2',
      content: 'Original note content',
      anchor: {
        cssSelector: 'body > div',
        offsetX: 5,
        offsetY: 5,
        tier: 'selector',
      },
      color: 'cream',
      collapsed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
    };

    await createNote(note);

    // Update color to navy and collapse
    await updateNote('test-custom-2', { color: 'navy', collapsed: true });

    const all = await getAllNotes();
    expect(all[0].color).toBe('navy');
    expect(all[0].collapsed).toBe(true);
  });
});
