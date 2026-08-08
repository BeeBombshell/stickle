import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getSupabaseAdminClient } from '../auth.js';

export const LIST_NOTES_TOOL: Tool = {
  name: 'list_stickle_notes',
  description: 'List saved browser sticky notes from cloud sync filtered by domain, tag, or result limit.',
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

export async function executeListNotes(userId: string, args: Record<string, any>) {
  const domain = typeof args?.domain === 'string' ? args.domain.toLowerCase() : undefined;
  const tag = typeof args?.tag === 'string' ? args.tag.toLowerCase() : undefined;
  const limit = typeof args?.limit === 'number' ? Math.min(args.limit, 100) : 50;

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (domain) {
    query = query.ilike('url', `%${domain}%`);
  }

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list notes from Supabase: ${error.message}`);
  }

  return {
    count: data ? data.length : 0,
    notes: data || [],
  };
}
