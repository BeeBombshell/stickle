import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  cleanDatabaseId,
  testNotionConnection,
  pushNoteToNotion,
  exportUnsyncedNotesBatch,
} from '../lib/notion';
import { db } from '../lib/db';
import type { StickleNote, NotionConfig } from '../lib/types';

describe('Notion API Integration', () => {
  const sampleConfig: NotionConfig = {
    apiKey: 'secret_test_token_12345',
    databaseId: '32characternotiondatabaseid1234',
  };

  const sampleNote: StickleNote = {
    id: 'test-note-1',
    url: 'https://example.com/page',
    pageTitle: 'Sample Web Page',
    content: 'Important research note about web APIs',
    anchor: {
      cssSelector: 'h1',
      offsetX: 10,
      offsetY: 20,
      tier: 'selector',
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    syncedToNotion: false,
  };

  const mockDbSchemaResponse = {
    ok: true,
    status: 200,
    json: async () => ({
      id: sampleConfig.databaseId,
      object: 'database',
      properties: {
        Name: { type: 'title' },
        URL: { type: 'url' },
      },
    }),
  };

  beforeEach(async () => {
    await db.notes.clear();
    await db.notes.put(sampleNote);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('cleanDatabaseId', () => {
    it('strips dashes from 36-char UUID format database IDs', () => {
      expect(cleanDatabaseId('32char-acte-rnot-iond-atabaseid1234')).toBe(
        '32characternotiondatabaseid1234'
      );
    });

    it('extracts database ID from full Notion database URLs', () => {
      const url =
        'https://www.notion.so/myworkspace/a1b2c3d4e5f67890123456789abcdef0?v=123';
      expect(cleanDatabaseId(url)).toBe('a1b2c3d4e5f67890123456789abcdef0');
    });

    it('trims whitespace and handles raw 32-character strings', () => {
      expect(cleanDatabaseId('  a1b2c3d4e5f67890123456789abcdef0  ')).toBe(
        'a1b2c3d4e5f67890123456789abcdef0'
      );
    });
  });

  describe('testNotionConnection', () => {
    it('returns error when API key or Database ID is missing', async () => {
      const emptyRes = await testNotionConnection({ apiKey: '', databaseId: '' });
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.error).toContain('required');
    });

    it('returns success: true when Notion API responds 200 OK', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ id: sampleConfig.databaseId, object: 'database' }),
        })
      );

      const result = await testNotionConnection(sampleConfig);
      expect(result.success).toBe(true);
    });

    it('returns descriptive error message when Notion API returns an error status', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: async () => ({ message: 'API token is invalid.' }),
        })
      );

      const result = await testNotionConnection(sampleConfig);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Notion Integration Token is invalid or expired. Please check your token in Settings.');
    });
  });

  describe('pushNoteToNotion', () => {
    it('creates a new Notion page for unsynced note with schema detection', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(mockDbSchemaResponse)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ id: 'notion-page-id-999', object: 'page' }),
        });

      vi.stubGlobal('fetch', fetchMock);

      const createdId = await pushNoteToNotion(sampleNote, sampleConfig);

      expect(createdId).toBe('notion-page-id-999');
      expect(fetchMock).toHaveBeenCalledTimes(2);

      const [urlArg, optionsArg] = fetchMock.mock.calls[1];
      expect(urlArg).toBe('https://api.notion.com/v1/pages');
      expect(optionsArg.method).toBe('POST');
      expect(optionsArg.headers['Authorization']).toBe(`Bearer ${sampleConfig.apiKey}`);

      const body = JSON.parse(optionsArg.body);
      expect(body.parent.database_id).toBe(cleanDatabaseId(sampleConfig.databaseId));
      expect(body.properties.URL.url).toBe(sampleNote.url);
      expect(body.children[0].paragraph.rich_text[0].text.content).toBe(sampleNote.content);
    });

    it('updates existing Notion page when note is already synced', async () => {
      const syncedNote: StickleNote = {
        ...sampleNote,
        syncedToNotion: true,
        notionPageId: 'notion-page-id-existing',
      };

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(mockDbSchemaResponse)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ id: 'notion-page-id-existing', object: 'page' }),
        });

      vi.stubGlobal('fetch', fetchMock);

      const pageId = await pushNoteToNotion(syncedNote, sampleConfig);
      expect(pageId).toBe('notion-page-id-existing');

      const [urlArg, optionsArg] = fetchMock.mock.calls[1];
      expect(urlArg).toBe('https://api.notion.com/v1/pages/notion-page-id-existing');
      expect(optionsArg.method).toBe('PATCH');
    });

    it('retries on HTTP 429 status (rate limiting) with exponential backoff', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(mockDbSchemaResponse)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'Retry-After': '0' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ id: 'notion-page-after-retry', object: 'page' }),
        });

      vi.stubGlobal('fetch', fetchMock);

      const resultId = await pushNoteToNotion(sampleNote, sampleConfig);
      expect(resultId).toBe('notion-page-after-retry');
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('exportUnsyncedNotesBatch', () => {
    it('exports all unsynced notes in batch and reports progress', async () => {
      const notesList: StickleNote[] = [
        { ...sampleNote, id: 'n1', syncedToNotion: false },
        { ...sampleNote, id: 'n2', syncedToNotion: false },
        { ...sampleNote, id: 'n3', syncedToNotion: true, notionPageId: 'p3' },
      ];

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ id: 'notion-batch-id', object: 'page', properties: {} }),
        })
      );

      const progressCalls: number[] = [];
      const result = await exportUnsyncedNotesBatch(notesList, sampleConfig, (curr) => {
        progressCalls.push(curr);
      });

      expect(result.successCount).toBe(2);
      expect(result.failCount).toBe(0);
      expect(progressCalls).toEqual([1, 2]);
    });
  });
});
