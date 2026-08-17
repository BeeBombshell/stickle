import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { LIST_NOTES_TOOL, executeListNotes } from './tools/list.js';
import { SEARCH_NOTES_TOOL, executeSearchNotes } from './tools/search.js';
import { GET_NOTES_FOR_URL_TOOL, executeGetNotesForUrl } from './tools/get-for-url.js';
import { ADD_NOTE_TOOL, executeAddNote } from './tools/add.js';
import { EXPORT_SUMMARY_TOOL, executeExportSummary } from './tools/summary.js';
import { TEAM_TIMELINE_TOOL, executeGetTeamTimeline } from './tools/team-timeline.js';

export function createRemoteMcpServer(userId: string) {
  const server = new Server(
    {
      name: 'stickle-remote-mcp',
      version: '1.0.0',
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
        TEAM_TIMELINE_TOOL,
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'list_stickle_notes': {
        const result = await executeListNotes(userId, args || {});
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'search_stickle_notes': {
        const result = await executeSearchNotes(userId, args || {});
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_notes_for_url': {
        const result = await executeGetNotesForUrl(userId, args || {});
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'add_stickle_note': {
        const result = await executeAddNote(userId, args || {});
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'export_stickle_summary': {
        const markdown = await executeExportSummary(userId, args || {});
        return {
          content: [{ type: 'text', text: markdown }],
        };
      }

      case 'get_team_activity_timeline': {
        const result = await executeGetTeamTimeline(userId, args || {});
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  return server;
}
