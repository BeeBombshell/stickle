import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import { serve } from '@hono/node-server';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import dotenv from 'dotenv';
import { validateApiKey } from './auth.js';
import { createRemoteMcpServer } from './mcp-handler.js';
import { executeListNotes } from './tools/list.js';
import { executeSearchNotes } from './tools/search.js';
import { executeGetNotesForUrl } from './tools/get-for-url.js';
import { executeAddNote } from './tools/add.js';
import { executeExportSummary } from './tools/summary.js';
import { executeGetTeamTimeline } from './tools/team-timeline.js';
import { handleDodoWebhook } from './webhooks/dodopayments.js';

dotenv.config();

type Env = {
  Variables: {
    userId: string;
  };
};

const app = new Hono<Env>();

// Global CORS middleware
app.use('*', cors());

// Webhook endpoint for Dodo Payments (unauthenticated, signature checked internally)
app.post('/webhooks/dodopayments', handleDodoWebhook);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'stickle-remote-mcp',
    timestamp: new Date().toISOString(),
  });
});

// Authentication middleware for MCP routes
app.use('/sse', async (c, next) => {
  const authHeader = c.req.header('authorization');
  const queryToken = c.req.query('apiKey') || c.req.query('api_key');
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : queryToken;

  if (!token) {
    return c.json({ error: 'Unauthorized: Missing API key in Authorization header or query parameter' }, 401);
  }

  const authUser = await validateApiKey(token);
  if (!authUser) {
    return c.json({ error: 'Unauthorized: Invalid or revoked API key' }, 401);
  }

  c.set('userId', authUser.userId);
  await next();
});

app.use('/v1/*', async (c, next) => {
  const authHeader = c.req.header('authorization');
  const queryToken = c.req.query('apiKey') || c.req.query('api_key');
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : queryToken;

  if (!token) {
    return c.json({ error: 'Unauthorized: Missing API key' }, 401);
  }

  const authUser = await validateApiKey(token);
  if (!authUser) {
    return c.json({ error: 'Unauthorized: Invalid or revoked API key' }, 401);
  }

  c.set('userId', authUser.userId);
  await next();
});

// Active SSE transports map keyed by sessionId
const activeTransports = new Map<string, SSEServerTransport>();

// SSE Endpoint for Claude Desktop / Cursor Remote MCP connections
app.get('/sse', async (c) => {
  const userId = c.get('userId');

  return streamSSE(c, async (stream) => {
    const mockRes = {
      writeHead: (status: number, headers: Record<string, string>) => {
        for (const [k, v] of Object.entries(headers)) {
          stream.write(`${k}: ${v}\n`);
        }
        stream.write('\n');
      },
      write: (chunk: string | Uint8Array) => {
        stream.writeSSE({ data: typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk) });
      },
      end: () => {},
      on: (event: string, listener: () => void) => {
        if (event === 'close') {
          stream.onAbort(listener);
        }
      },
    } as any;

    const transport = new SSEServerTransport('/message', mockRes);
    activeTransports.set(transport.sessionId, transport);

    const mcpServer = createRemoteMcpServer(userId);
    await mcpServer.connect(transport);

    stream.onAbort(() => {
      activeTransports.delete(transport.sessionId);
    });

    while (!stream.aborted) {
      await stream.sleep(15000);
    }
  });
});

// Handle incoming client JSON-RPC messages for SSE transport
app.post('/message', async (c) => {
  const sessionId = c.req.query('sessionId');
  if (!sessionId || !activeTransports.has(sessionId)) {
    return c.json({ error: 'Session not found or expired' }, 404);
  }

  const transport = activeTransports.get(sessionId)!;
  const body = await c.req.json();
  await transport.handlePostMessage(c.req.raw as any, c.res as any, body);

  return c.text('OK');
});

// Direct REST/HTTP fallback endpoints for easy API integration
app.get('/v1/tools/list', async (c) => {
  return c.json({
    tools: [
      { name: 'list_stickle_notes', description: 'List saved notes from cloud sync' },
      { name: 'search_stickle_notes', description: 'Full-text search across notes' },
      { name: 'get_notes_for_url', description: 'Retrieve notes for a specific webpage URL' },
      { name: 'add_stickle_note', description: 'Create and pin a new sticky note' },
      { name: 'export_stickle_summary', description: 'Generate Markdown synthesis report' },
      { name: 'get_team_activity_timeline', description: 'Retrieve team activity timeline' },
    ],
  });
});

app.post('/v1/tools/call', async (c) => {
  const userId = c.get('userId');
  const { name, arguments: args } = await c.req.json();

  try {
    switch (name) {
      case 'list_stickle_notes': {
        const result = await executeListNotes(userId, args || {});
        return c.json({ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
      }
      case 'search_stickle_notes': {
        const result = await executeSearchNotes(userId, args || {});
        return c.json({ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
      }
      case 'get_notes_for_url': {
        const result = await executeGetNotesForUrl(userId, args || {});
        return c.json({ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
      }
      case 'add_stickle_note': {
        const result = await executeAddNote(userId, args || {});
        return c.json({ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
      }
      case 'export_stickle_summary': {
        const markdown = await executeExportSummary(userId, args || {});
        return c.json({ content: [{ type: 'text', text: markdown }] });
      }
      case 'get_team_activity_timeline': {
        const result = await executeGetTeamTimeline(userId, args || {});
        return c.json({ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
      }
      default:
        return c.json({ error: `Unknown tool: ${name}` }, 400);
    }
  } catch (err: any) {
    return c.json({ error: err.message || 'Tool execution failed' }, 500);
  }
});

const PORT = Number(process.env.PORT) || 3001;

if (process.env.NODE_ENV !== 'test') {
  console.log(`🚀 Stickle Remote MCP Server running on http://localhost:${PORT}`);
  serve({
    fetch: app.fetch,
    port: PORT,
  });
}

export default app;
