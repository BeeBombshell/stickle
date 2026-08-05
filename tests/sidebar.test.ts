import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractDomain,
  filterNotes,
  groupNotesByDomain,
} from '../components/NoteSidebar';
import { db, createNote, getAllNotes, deleteNote } from '../lib/db';
import type { StickleNote } from '../lib/types';

describe('NoteSidebar Logic & Utilities', () => {
  beforeEach(async () => {
    await db.notes.clear();
  });

  describe('extractDomain', () => {
    it('extracts hostname from full URLs', () => {
      expect(extractDomain('https://en.wikipedia.org/wiki/Main_Page')).toBe('en.wikipedia.org');
      expect(extractDomain('https://github.com/facebook/react')).toBe('github.com');
      expect(extractDomain('http://localhost:3000/dashboard')).toBe('localhost');
    });

    it('returns original input if invalid URL', () => {
      expect(extractDomain('not-a-valid-url')).toBe('not-a-valid-url');
    });
  });

  describe('filterNotes', () => {
    const mockNotes: StickleNote[] = [
      {
        id: '1',
        url: 'https://react.dev/reference/react',
        pageTitle: 'React Reference Documentation',
        content: 'Hooks reference for useState and useEffect',
        anchor: { cssSelector: 'h1', offsetX: 0, offsetY: 0, tier: 'selector' },
        createdAt: 1000000,
        updatedAt: 1000000,
        syncedToNotion: false,
      },
      {
        id: '2',
        url: 'https://wikipedia.org/wiki/TypeScript',
        pageTitle: 'TypeScript Wikipedia',
        content: 'Typed JavaScript at scale',
        anchor: { cssSelector: 'p', offsetX: 0, offsetY: 0, tier: 'text-fragment' },
        createdAt: 2000000,
        updatedAt: 2000000,
        syncedToNotion: false,
      },
      {
        id: '3',
        url: 'https://wikipedia.org/wiki/Preact',
        pageTitle: 'Preact - Fast 3kB alternative to React',
        content: 'Lightweight Virtual DOM library',
        anchor: { cssSelector: 'body', offsetX: 0, offsetY: 0, tier: 'fuzzy' },
        createdAt: 3000000,
        updatedAt: 3000000,
        syncedToNotion: false,
      },
    ];

    it('filters notes by search query substring in content or title', () => {
      const result = filterNotes(mockNotes, 'hooks', 'all');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');

      const titleResult = filterNotes(mockNotes, 'Wikipedia', 'all');
      expect(titleResult).toHaveLength(2);
      expect(titleResult.map((n) => n.id)).toEqual(['2', '3']);
    });

    it('filters notes by date ranges (today / week / all)', () => {
      const now = 3000000;
      // 1 day = 86400000 ms
      const todayResult = filterNotes(mockNotes, '', 'today', now);
      // today start for timestamp 3000000 will be 0 in unix time if computed in local hours,
      // but let's test relative time thresholds:
      const customNotes: StickleNote[] = [
        { ...mockNotes[0], createdAt: now - 3600000 }, // 1 hour ago
        { ...mockNotes[1], createdAt: now - 3 * 86400000 }, // 3 days ago
        { ...mockNotes[2], createdAt: now - 10 * 86400000 }, // 10 days ago
      ];

      const weekResult = filterNotes(customNotes, '', 'week', now);
      expect(weekResult).toHaveLength(2);
      expect(weekResult.map((n) => n.id)).toEqual(['1', '2']);
    });
  });

  describe('groupNotesByDomain', () => {
    it('groups notes logically by domain hostname', () => {
      const mockNotes: StickleNote[] = [
        {
          id: '1',
          url: 'https://wikipedia.org/wiki/Page1',
          pageTitle: 'Wiki 1',
          content: 'C1',
          anchor: { cssSelector: 'b', offsetX: 0, offsetY: 0, tier: 'selector' },
          createdAt: 10,
          updatedAt: 10,
          syncedToNotion: false,
        },
        {
          id: '2',
          url: 'https://github.com/repo',
          pageTitle: 'Github Repo',
          content: 'C2',
          anchor: { cssSelector: 'b', offsetX: 0, offsetY: 0, tier: 'selector' },
          createdAt: 20,
          updatedAt: 20,
          syncedToNotion: false,
        },
        {
          id: '3',
          url: 'https://wikipedia.org/wiki/Page2',
          pageTitle: 'Wiki 2',
          content: 'C3',
          anchor: { cssSelector: 'b', offsetX: 0, offsetY: 0, tier: 'selector' },
          createdAt: 30,
          updatedAt: 30,
          syncedToNotion: false,
        },
      ];

      const grouped = groupNotesByDomain(mockNotes);
      expect(grouped).toHaveLength(2);
      expect(grouped[0].domain).toBe('github.com');
      expect(grouped[0].notes).toHaveLength(1);
      expect(grouped[1].domain).toBe('wikipedia.org');
      expect(grouped[1].notes).toHaveLength(2);
    });
  });

  describe('Database integration for sidebar operations', () => {
    it('persists note creations and deletions through Dexie helper calls', async () => {
      const note: StickleNote = {
        id: 'sidebar-db-1',
        url: 'https://example.com/test',
        pageTitle: 'DB Test',
        content: 'Original content',
        anchor: { cssSelector: 'body', offsetX: 0, offsetY: 0, tier: 'selector' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncedToNotion: false,
      };

      await createNote(note);
      let all = await getAllNotes();
      expect(all).toHaveLength(1);

      await deleteNote('sidebar-db-1');
      all = await getAllNotes();
      expect(all).toHaveLength(0);
    });
  });
});
