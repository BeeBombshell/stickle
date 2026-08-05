import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadLocalNotes,
  saveLocalNotes,
  formatMarkdownSummary,
  getHostname,
  createStickleMcpServer,
} from '../mcp-server/index';
import type { StickleNote } from '../lib/types';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

describe('Phase 11: MCP Server Integration', () => {
  let tmpDir: string;
  let tmpFilePath: string;

  const sampleNotes: StickleNote[] = [
    {
      id: 'mcp-note-1',
      url: 'https://wikipedia.org/wiki/TypeScript',
      pageTitle: 'TypeScript - Wikipedia',
      content: 'TypeScript is a typed superset of JavaScript.',
      anchor: { cssSelector: 'h1', offsetX: 0, offsetY: 0, tier: 'selector' },
      color: 'lime',
      tags: ['research', 'lang'],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      syncedToNotion: false,
    },
    {
      id: 'mcp-note-2',
      url: 'https://wikipedia.org/wiki/React',
      pageTitle: 'React (software) - Wikipedia',
      content: 'React is a free and open-source front-end JavaScript library.',
      anchor: { cssSelector: 'p', offsetX: 0, offsetY: 0, tier: 'text-fragment' },
      color: 'pink',
      tags: ['frontend', 'react'],
      createdAt: 1700000050000,
      updatedAt: 1700000050000,
      syncedToNotion: true,
    },
    {
      id: 'mcp-note-3',
      url: 'https://github.com/facebook/react',
      pageTitle: 'GitHub - facebook/react',
      content: 'The library for web and native user interfaces.',
      anchor: { cssSelector: 'body', offsetX: 0, offsetY: 0, tier: 'unanchored' },
      color: 'navy',
      tags: ['code', 'frontend'],
      createdAt: 1700000100000,
      updatedAt: 1700000100000,
      syncedToNotion: false,
    },
  ];

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stickle_mcp_test_'));
    tmpFilePath = path.join(tmpDir, 'notes.json');
    process.env.STICKLE_NOTES_PATH = tmpFilePath;
  });

  afterEach(() => {
    delete process.env.STICKLE_NOTES_PATH;
    if (fs.existsSync(tmpFilePath)) {
      fs.unlinkSync(tmpFilePath);
    }
    if (fs.existsSync(tmpDir)) {
      fs.rmdirSync(tmpDir);
    }
  });

  it('loads empty array when notes file does not exist', () => {
    const notes = loadLocalNotes(tmpFilePath);
    expect(notes).toEqual([]);
  });

  it('saves and loads notes correctly from custom file path', () => {
    const saved = saveLocalNotes(sampleNotes, tmpFilePath);
    expect(saved).toBe(true);

    const loaded = loadLocalNotes(tmpFilePath);
    expect(loaded).toHaveLength(3);
    expect(loaded[0].id).toBe('mcp-note-1');
    expect(loaded[1].color).toBe('pink');
    expect(loaded[2].tags).toEqual(['code', 'frontend']);
  });

  it('extracts hostname correctly from URLs', () => {
    expect(getHostname('https://wikipedia.org/wiki/TypeScript')).toBe('wikipedia.org');
    expect(getHostname('https://github.com/facebook/react')).toBe('github.com');
    expect(getHostname('invalid-url')).toBe('invalid-url');
  });

  it('formats Markdown synthesis summary grouped by domain', () => {
    const markdown = formatMarkdownSummary(sampleNotes);
    expect(markdown).toContain('# Stickle Notes Summary');
    expect(markdown).toContain('**Total Notes:** 3');
    expect(markdown).toContain('## wikipedia.org (2 notes)');
    expect(markdown).toContain('## github.com (1 note)');
    expect(markdown).toContain('[TypeScript - Wikipedia](https://wikipedia.org/wiki/TypeScript)');
    expect(markdown).toContain('[#research, #lang]');
  });

  it('lists registered MCP tools on ListToolsRequest', async () => {
    const server = createStickleMcpServer();
    // Invoke handler registered on server
    const response = await (server as any)._requestHandlers.get(ListToolsRequestSchema.shape.method.value)({
      method: 'tools/list',
      params: {},
    });
    expect(response.tools).toHaveLength(5);
    const toolNames = response.tools.map((t: any) => t.name);
    expect(toolNames).toEqual([
      'list_stickle_notes',
      'search_stickle_notes',
      'get_notes_for_url',
      'add_stickle_note',
      'export_stickle_summary',
    ]);
  });

  it('handles tool execution: list_stickle_notes', async () => {
    saveLocalNotes(sampleNotes, tmpFilePath);
    const server = createStickleMcpServer();
    const handler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    // List all
    const res1 = await handler({
      method: 'tools/call',
      params: { name: 'list_stickle_notes', arguments: {} },
    });
    const data1 = JSON.parse(res1.content[0].text);
    expect(data1.count).toBe(3);

    // Filter domain
    const res2 = await handler({
      method: 'tools/call',
      params: { name: 'list_stickle_notes', arguments: { domain: 'wikipedia.org' } },
    });
    const data2 = JSON.parse(res2.content[0].text);
    expect(data2.count).toBe(2);

    // Filter tag
    const res3 = await handler({
      method: 'tools/call',
      params: { name: 'list_stickle_notes', arguments: { tag: 'react' } },
    });
    const data3 = JSON.parse(res3.content[0].text);
    expect(data3.count).toBe(1);
    expect(data3.notes[0].id).toBe('mcp-note-2');
  });

  it('handles tool execution: search_stickle_notes', async () => {
    saveLocalNotes(sampleNotes, tmpFilePath);
    const server = createStickleMcpServer();
    const handler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    const res = await handler({
      method: 'tools/call',
      params: { name: 'search_stickle_notes', arguments: { query: 'front-end' } },
    });
    const data = JSON.parse(res.content[0].text);
    expect(data.count).toBe(1);
    expect(data.notes[0].id).toBe('mcp-note-2');
  });

  it('handles tool execution: get_notes_for_url', async () => {
    saveLocalNotes(sampleNotes, tmpFilePath);
    const server = createStickleMcpServer();
    const handler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    const res = await handler({
      method: 'tools/call',
      params: { name: 'get_notes_for_url', arguments: { url: 'https://wikipedia.org/wiki/TypeScript' } },
    });
    const data = JSON.parse(res.content[0].text);
    expect(data.count).toBe(1);
    expect(data.notes[0].id).toBe('mcp-note-1');
  });

  it('handles tool execution: add_stickle_note and persists to storage', async () => {
    saveLocalNotes([], tmpFilePath);
    const server = createStickleMcpServer();
    const handler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    const res = await handler({
      method: 'tools/call',
      params: {
        name: 'add_stickle_note',
        arguments: {
          url: 'https://news.ycombinator.com',
          content: 'Interesting AI discussion thread',
          pageTitle: 'Hacker News',
          tags: ['news', 'ai'],
          color: 'mint',
        },
      },
    });

    const data = JSON.parse(res.content[0].text);
    expect(data.success).toBe(true);
    expect(data.note.url).toBe('https://news.ycombinator.com');
    expect(data.note.color).toBe('mint');

    const loaded = loadLocalNotes(tmpFilePath);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].content).toBe('Interesting AI discussion thread');
  });

  it('handles tool execution: export_stickle_summary', async () => {
    saveLocalNotes(sampleNotes, tmpFilePath);
    const server = createStickleMcpServer();
    const handler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    const res = await handler({
      method: 'tools/call',
      params: { name: 'export_stickle_summary', arguments: { domain: 'wikipedia' } },
    });

    const text = res.content[0].text;
    expect(text).toContain('# Stickle Notes Summary');
    expect(text).toContain('## wikipedia.org (2 notes)');
    expect(text).not.toContain('github.com');
  });
});
