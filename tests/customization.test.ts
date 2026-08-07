import { describe, it, expect, beforeEach } from 'vitest';
import type { StickleNote, NoteColorBlock } from '../lib/types';
import { createNote, getAllNotes, updateNote, deleteNote, db } from '../lib/db';
import { COLOR_SWATCHES, getNoteBorderStyle } from '../components/NoteBubble';
import { loadSettings, saveSettings } from '../components/Settings';

describe('Phase 6: Note Customization & Collapsible UI', () => {
  beforeEach(async () => {
    await db.notes.clear();
  });

  it('validates COLOR_SWATCHES contains all 7 pastel color blocks with complementary border colors', () => {
    const expectedColors: NoteColorBlock[] = ['lime', 'lilac', 'cream', 'mint', 'pink', 'coral', 'blue'];
    for (const color of expectedColors) {
      expect(COLOR_SWATCHES[color]).toBeDefined();
      expect(COLOR_SWATCHES[color].bg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(COLOR_SWATCHES[color].border).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(COLOR_SWATCHES[color].text).toBeDefined();
    }
  });

  it('computes correct CSS border property complementing note background color', () => {
    // Default tier fallback behavior with swatch border accent
    expect(getNoteBorderStyle('selector', 'lime')).toBe('1.5px solid #84960d');
    expect(getNoteBorderStyle('text-fragment', 'lilac')).toBe('2px dashed #7c3aed');

    // Explicit custom border overrides
    expect(getNoteBorderStyle('selector', 'mint', 'dashed')).toBe('2px dashed #059669');
    expect(getNoteBorderStyle('selector', 'cream', 'solid')).toBe('1.5px solid #d97706');
    expect(getNoteBorderStyle('selector', 'pink', 'none')).toBe('none');
  });

  it('loads default settings with defaultBorderStyle and enabled flag', async () => {
    const s = await loadSettings();
    expect(s.defaultBorderStyle).toBe('solid');
    expect(s.enabled).toBe(true);

    await saveSettings({
      apiKey: 'test',
      databaseId: 'test-db',
      defaultNoteColor: 'mint',
      defaultBorderStyle: 'dashed',
      enabled: false,
    });

    const updated = await loadSettings();
    expect(updated.defaultNoteColor).toBe('mint');
  });

  it('creates a note with color, borderStyle, and collapsed properties', async () => {
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
      borderStyle: 'dashed',
      collapsed: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
    };

    await createNote(note);
    const all = await getAllNotes();
    expect(all).toHaveLength(1);
    expect(all[0].color).toBe('mint');
    expect(all[0].borderStyle).toBe('dashed');
    expect(all[0].collapsed).toBe(true);
  });

  it('updates note color, borderStyle, and toggles collapsed state', async () => {
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
      borderStyle: 'solid',
      collapsed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
    };

    await createNote(note);

    // Update color to lilac, borderStyle to dashed, and collapse
    await updateNote('test-custom-2', { color: 'lilac', borderStyle: 'dashed', collapsed: true });

    const all = await getAllNotes();
    expect(all[0].color).toBe('lilac');
    expect(all[0].borderStyle).toBe('dashed');
    expect(all[0].collapsed).toBe(true);
  });
});
