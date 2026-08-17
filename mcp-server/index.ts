import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'node:crypto';
import type { StickleNote, NoteColorBlock } from '../lib/types';

export function getNotesPath(customPath?: string): string {
  if (customPath) return customPath;
  if (process.env.STICKLE_NOTES_PATH) return process.env.STICKLE_NOTES_PATH;
  return path.join(os.homedir(), '.stickle', 'notes.json');
}

export function loadLocalNotes(customPath?: string): StickleNote[] {
  const filePath = getNotesPath(customPath);
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && Array.isArray(parsed.notes)) {
      return parsed.notes;
    }
    return [];
  } catch (err) {
    console.error('Failed to load Stickle notes from local storage:', err);
    return [];
  }
}

export function saveLocalNotes(notes: StickleNote[], customPath?: string): boolean {
  const filePath = getNotesPath(customPath);
  try {
    const parentDir = path.dirname(filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    const payload = {
      version: 1,
      lastSyncedAt: Date.now(),
      notesCount: notes.length,
      notes,
    };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to save Stickle notes to local storage:', err);
    return false;
  }
}

export function getHostname(urlStr: string): string {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return urlStr;
  }
}

export function formatMarkdownSummary(notes: StickleNote[]): string {
  if (notes.length === 0) {
    return '# Stickle Notes Summary\n\nNo stickle notes found matching the specified criteria.';
  }

  const grouped = new Map<string, StickleNote[]>();
  for (const note of notes) {
    const host = getHostname(note.url);
    if (!grouped.has(host)) {
      grouped.set(host, []);
    }
    grouped.get(host)!.push(note);
  }

  let markdown = `# Stickle Notes Summary\n\n**Total Notes:** ${notes.length}\n**Domains:** ${grouped.size}\n\n`;

  for (const [domain, domainNotes] of grouped.entries()) {
    markdown += `## ${domain} (${domainNotes.length} note${domainNotes.length === 1 ? '' : 's'})\n\n`;
    for (const note of domainNotes) {
      const tagStr = note.tags && note.tags.length > 0 ? ` [${note.tags.map((t) => `#${t}`).join(', ')}]` : '';
      const dateStr = new Date(note.createdAt).toLocaleDateString();
      markdown += `- **[${note.pageTitle}](${note.url})** (${dateStr})${tagStr}\n`;
      const anchoredContext = note.anchoredText || note.anchor?.exactText || note.highlightRange?.selectedText;
      if (anchoredContext) {
        markdown += `  *Target element:* "${anchoredContext}"\n`;
      }
      markdown += `  > ${note.content.split('\n').join('\n  > ')}\n\n`;
    }
  }

  return markdown.trim();
}

const LIST_NOTES_TOOL: Tool = {
  name: 'list_stickle_notes',
  description: 'List saved browser sticky notes filtered by domain, tag, or result limit.',
  inputSchema: {
    type: 'object',
    properties: {
      domain: {
        type: 'string',
        description: 'Filter notes by web domain or URL substring (e.g. wikipedia.org, github.com)',
      },
      tag: {
        type: 'string',
        description: 'Filter notes by tag (e.g. research, todo, important)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of notes to return (default 50)',
      },
    },
  },
};

const SEARCH_NOTES_TOOL: Tool = {
  name: 'search_stickle_notes',
  description: 'Full-text search across browser sticky note contents, page titles, URLs, and tags.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query string',
      },
      tag: {
        type: 'string',
        description: 'Optional tag filter',
      },
    },
    required: ['query'],
  },
};

const GET_NOTES_FOR_URL_TOOL: Tool = {
  name: 'get_notes_for_url',
  description: 'Retrieve all sticky notes anchored to a specific webpage URL.',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'Exact or target webpage URL',
      },
    },
    required: ['url'],
  },
};

const ADD_NOTE_TOOL: Tool = {
  name: 'add_stickle_note',
  description: 'Create and attach a new sticky note to a specified webpage URL.',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'Webpage URL to attach the note to',
      },
      content: {
        type: 'string',
        description: 'Content text of the sticky note',
      },
      pageTitle: {
        type: 'string',
        description: 'Optional page title',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional list of tags',
      },
      color: {
        type: 'string',
        enum: ['lime', 'lilac', 'cream', 'mint', 'pink', 'coral', 'blue'],
        description: 'Optional note color theme',
      },
    },
    required: ['url', 'content'],
  },
};

const EXPORT_SUMMARY_TOOL: Tool = {
  name: 'export_stickle_summary',
  description: 'Generate a structured Markdown synthesis report of web notes grouped by site domain.',
  inputSchema: {
    type: 'object',
    properties: {
      domain: {
        type: 'string',
        description: 'Optional domain filter',
      },
      tag: {
        type: 'string',
        description: 'Optional tag filter',
      },
    },
  },
};

export function createStickleMcpServer() {
  const server = new Server(
    {
      name: 'stickle-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        LIST_NOTES_TOOL,
        SEARCH_NOTES_TOOL,
        GET_NOTES_FOR_URL_TOOL,
        ADD_NOTE_TOOL,
        EXPORT_SUMMARY_TOOL,
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const notes = loadLocalNotes();

    switch (name) {
      case 'list_stickle_notes': {
        const domain = typeof args?.domain === 'string' ? args.domain.toLowerCase() : undefined;
        const tag = typeof args?.tag === 'string' ? args.tag.toLowerCase() : undefined;
        const limit = typeof args?.limit === 'number' ? args.limit : 50;

        let filtered = notes;
        if (domain) {
          filtered = filtered.filter((n) => n.url.toLowerCase().includes(domain));
        }
        if (tag) {
          filtered = filtered.filter((n) => n.tags?.some((t) => t.toLowerCase() === tag));
        }
        filtered = filtered.slice(0, limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count: filtered.length, notes: filtered }, null, 2),
            },
          ],
        };
      }

      case 'search_stickle_notes': {
        const query = String(args?.query || '').toLowerCase();
        const tag = typeof args?.tag === 'string' ? args.tag.toLowerCase() : undefined;

        let filtered = notes.filter((n) => {
          const matchQuery =
            n.content.toLowerCase().includes(query) ||
            n.pageTitle.toLowerCase().includes(query) ||
            n.url.toLowerCase().includes(query) ||
            n.tags?.some((t) => t.toLowerCase().includes(query));
          return matchQuery;
        });

        if (tag) {
          filtered = filtered.filter((n) => n.tags?.some((t) => t.toLowerCase() === tag));
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count: filtered.length, notes: filtered }, null, 2),
            },
          ],
        };
      }

      case 'get_notes_for_url': {
        const targetUrl = String(args?.url || '').toLowerCase();
        const filtered = notes.filter((n) => n.url.toLowerCase() === targetUrl || n.url.toLowerCase().startsWith(targetUrl));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count: filtered.length, notes: filtered }, null, 2),
            },
          ],
        };
      }

      case 'add_stickle_note': {
        const url = String(args?.url || '');
        const content = String(args?.content || '');
        const pageTitle = typeof args?.pageTitle === 'string' ? args.pageTitle : 'Web Note';
        const tags = Array.isArray(args?.tags) ? (args.tags as string[]) : [];
        const color = (args?.color as NoteColorBlock) || 'lime';

        const newNote: StickleNote = {
          id: randomUUID(),
          url,
          pageTitle,
          content,
          anchor: {
            cssSelector: 'body',
            offsetX: 0,
            offsetY: 0,
            tier: 'unanchored',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          syncedToNotion: false,
          color,
          tags,
        };

        notes.push(newNote);
        saveLocalNotes(notes);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, note: newNote }, null, 2),
            },
          ],
        };
      }

      case 'export_stickle_summary': {
        const domain = typeof args?.domain === 'string' ? args.domain.toLowerCase() : undefined;
        const tag = typeof args?.tag === 'string' ? args.tag.toLowerCase() : undefined;

        let filtered = notes;
        if (domain) {
          filtered = filtered.filter((n) => n.url.toLowerCase().includes(domain));
        }
        if (tag) {
          filtered = filtered.filter((n) => n.tags?.some((t) => t.toLowerCase() === tag));
        }

        const report = formatMarkdownSummary(filtered);

        return {
          content: [
            {
              type: 'text',
              text: report,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  return server;
}

export async function main() {
  const server = createStickleMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Stickle MCP Server running on stdio');
}

// Automatically start server when executed directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('mcp-server')) {
  main().catch((error) => {
    console.error('Fatal error running Stickle MCP Server:', error);
    process.exit(1);
  });
}
