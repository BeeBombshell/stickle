import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getSupabaseAdminClient } from '../auth.js';

export const SEARCH_NOTES_TOOL: Tool = {
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

export async function executeSearchNotes(userId: string, args: Record<string, any>) {
  const queryStr = String(args?.query || '').trim();
  const tag = typeof args?.tag === 'string' ? args.tag.toLowerCase() : undefined;

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .or(`content.ilike.%${queryStr}%,page_title.ilike.%${queryStr}%,url.ilike.%${queryStr}%`)
    .order('updated_at', { ascending: false });

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to search notes in Supabase: ${error.message}`);
  }

  return {
    count: data ? data.length : 0,
    notes: data || [],
  };
}
