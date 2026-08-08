import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getSupabaseAdminClient } from '../auth.js';
import { randomUUID } from 'node:crypto';

export const ADD_NOTE_TOOL: Tool = {
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
        enum: ['lime', 'lilac', 'cream', 'mint', 'pink', 'coral', 'navy'],
        description: 'Optional note color theme',
      },
    },
    required: ['url', 'content'],
  },
};

export async function executeAddNote(userId: string, args: Record<string, any>) {
  const url = String(args?.url || '').trim();
  const content = String(args?.content || '').trim();
  const pageTitle = typeof args?.pageTitle === 'string' ? args.pageTitle : 'Web Note';
  const tags = Array.isArray(args?.tags) ? (args.tags as string[]).map((t) => t.toLowerCase()) : [];
  const color = typeof args?.color === 'string' ? args.color : 'lime';

  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = url;
  }

  const localId = randomUUID();
  const now = new Date().toISOString();

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('notes')
    .insert({
      local_id: localId,
      user_id: userId,
      url,
      domain,
      page_title: pageTitle,
      content,
      anchor: {
        cssSelector: 'body',
        offsetX: 0,
        offsetY: 0,
        tier: 'unanchored',
      },
      color,
      tags,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create note in Supabase: ${error.message}`);
  }

  return {
    success: true,
    note: data,
  };
}
