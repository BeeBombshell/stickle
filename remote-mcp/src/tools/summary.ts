import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getSupabaseAdminClient } from '../auth.js';

export const EXPORT_SUMMARY_TOOL: Tool = {
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

export async function executeExportSummary(userId: string, args: Record<string, any>) {
  const domain = typeof args?.domain === 'string' ? args.domain.toLowerCase() : undefined;
  const tag = typeof args?.tag === 'string' ? args.tag.toLowerCase() : undefined;

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

  const { data: notes, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch notes for summary report: ${error.message}`);
  }

  if (!notes || notes.length === 0) {
    return '# Stickle Notes Summary\n\nNo stickle notes found matching the specified criteria.';
  }

  const grouped = new Map<string, typeof notes>();
  for (const note of notes) {
    const host = note.domain || note.url;
    if (!grouped.has(host)) {
      grouped.set(host, []);
    }
    grouped.get(host)!.push(note);
  }

  let markdown = `# Stickle Notes Summary\n\n**Total Notes:** ${notes.length}\n**Domains:** ${grouped.size}\n\n`;

  for (const [hostDomain, domainNotes] of grouped.entries()) {
    markdown += `## ${hostDomain} (${domainNotes.length} note${domainNotes.length === 1 ? '' : 's'})\n\n`;
    for (const note of domainNotes) {
      const tagStr = note.tags && note.tags.length > 0 ? ` [${note.tags.map((t: string) => `#${t}`).join(', ')}]` : '';
      const dateStr = note.created_at ? new Date(note.created_at).toLocaleDateString() : '';
      markdown += `- **[${note.page_title || 'Web Note'}](${note.url})** (${dateStr})${tagStr}\n`;
      const anchoredContext = note.anchor?.exactText || note.highlight_range?.selectedText;
      if (anchoredContext) {
        markdown += `  *Target element:* "${anchoredContext}"\n`;
      }
      markdown += `  > ${note.content.split('\n').join('\n  > ')}\n\n`;
    }
  }

  return markdown.trim();
}
