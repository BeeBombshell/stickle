import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getSupabaseAdminClient } from '../auth.js';

export const GET_NOTES_FOR_URL_TOOL: Tool = {
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

export async function executeGetNotesForUrl(userId: string, args: Record<string, any>) {
  const targetUrl = String(args?.url || '').trim();

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .or(`url.eq.${targetUrl},url.ilike.${targetUrl}%`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch notes for URL from Supabase: ${error.message}`);
  }

  return {
    count: data ? data.length : 0,
    notes: data || [],
  };
}
