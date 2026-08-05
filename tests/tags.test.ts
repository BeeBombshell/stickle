import { describe, it, expect, beforeEach } from 'vitest';
import type { StickleNote } from '../lib/types';
import { createNote, getAllNotes, updateNote, db } from '../lib/db';
import { filterNotes } from '../components/NoteSidebar';

describe('Phase 8: Tags & Tag-Based Filtering', () => {
  beforeEach(async () => {
    await db.notes.clear();
  });

  const sampleNotes: StickleNote[] = [
    {
      id: 'tag-note-1',
      url: 'https://example.com/page1',
      pageTitle: 'Research Document',
      content: 'Important findings on anchoring',
      anchor: { cssSelector: 'h1', offsetX: 0, offsetY: 0, tier: 'selector' },
      tags: ['research', 'important'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
    },
    {
      id: 'tag-note-2',
      url: 'https://example.com/page2',
      pageTitle: 'Todo List',
      content: 'Fix CSS contrast bug',
      anchor: { cssSelector: 'p', offsetX: 0, offsetY: 0, tier: 'selector' },
      tags: ['todo'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
    },
    {
      id: 'tag-note-3',
      url: 'https://example.com/page3',
      pageTitle: 'Un-tagged Note',
      content: 'Just general notes',
      anchor: { cssSelector: 'div', offsetX: 0, offsetY: 0, tier: 'selector' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
    },
  ];

  it('persists and retrieves notes with tags in IndexedDB', async () => {
    await createNote(sampleNotes[0]);
    const all = await getAllNotes();
    expect(all).toHaveLength(1);
    expect(all[0].tags).toEqual(['research', 'important']);
  });

  it('filters notes by tag selection', () => {
    const researchNotes = filterNotes(sampleNotes, '', 'all', 'research');
    expect(researchNotes).toHaveLength(1);
    expect(researchNotes[0].id).toBe('tag-note-1');

    const todoNotes = filterNotes(sampleNotes, '', 'all', 'todo');
    expect(todoNotes).toHaveLength(1);
    expect(todoNotes[0].id).toBe('tag-note-2');

    const allNotes = filterNotes(sampleNotes, '', 'all', 'all');
    expect(allNotes).toHaveLength(3);
  });

  it('matches keyword search against tag names', () => {
    const searchMatch = filterNotes(sampleNotes, 'important', 'all', 'all');
    expect(searchMatch).toHaveLength(1);
    expect(searchMatch[0].id).toBe('tag-note-1');
  });

  it('updates note tags in DB', async () => {
    await createNote(sampleNotes[1]);
    await updateNote('tag-note-2', { tags: ['todo', 'urgent', 'bug'] });

    const all = await getAllNotes();
    expect(all[0].tags).toEqual(['todo', 'urgent', 'bug']);
  });
});
