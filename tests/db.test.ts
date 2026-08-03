import { describe, it, expect, beforeEach } from 'vitest';
import { db, createNote, getNotesForUrl, getAllNotes, deleteNote } from '../lib/db';
import type { StickleNote } from '../lib/types';

describe('Stickle Database (Dexie)', () => {
  beforeEach(async () => {
    await db.notes.clear();
  });

  it('creates and retrieves notes by URL', async () => {
    const mockNote: StickleNote = {
      id: 'test-1',
      url: 'https://example.com/article',
      pageTitle: 'Example Article',
      content: 'Test sticky note content',
      anchor: {
        cssSelector: '#heading',
        offsetX: 10,
        offsetY: 20,
        tier: 'selector',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
    };

    await createNote(mockNote);

    const notesForUrl = await getNotesForUrl('https://example.com/article');
    expect(notesForUrl).toHaveLength(1);
    expect(notesForUrl[0].content).toBe('Test sticky note content');

    const allNotes = await getAllNotes();
    expect(allNotes).toHaveLength(1);
  });

  it('deletes a note by ID', async () => {
    const mockNote: StickleNote = {
      id: 'test-delete',
      url: 'https://example.com',
      pageTitle: 'Delete Test',
      content: 'To be deleted',
      anchor: { cssSelector: 'body', offsetX: 0, offsetY: 0, tier: 'selector' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
    };

    await createNote(mockNote);
    await deleteNote('test-delete');

    const allNotes = await getAllNotes();
    expect(allNotes).toHaveLength(0);
  });
});
