import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getSupabaseAdminClient } from '../auth.js';

export const TEAM_TIMELINE_TOOL: Tool = {
  name: 'get_team_activity_timeline',
  description: 'Retrieve chronological activity timeline of shared workspace team notes with author details.',
  inputSchema: {
    type: 'object',
    properties: {
      workspaceId: {
        type: 'string',
        description: 'Optional workspace UUID (defaults to user active workspace)',
      },
      limit: {
        type: 'number',
        description: 'Maximum entries to return (default 50)',
      },
    },
  },
};

export async function executeGetTeamTimeline(userId: string, args: Record<string, any>) {
  const limit = typeof args?.limit === 'number' ? Math.min(args.limit, 100) : 50;
  const workspaceId = typeof args?.workspaceId === 'string' ? args.workspaceId : undefined;

  const supabase = getSupabaseAdminClient();

  // Find user workspace if workspaceId not specified
  let targetWorkspaceId = workspaceId;
  if (!targetWorkspaceId) {
    const { data: memberData } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    targetWorkspaceId = memberData?.workspace_id;
  }

  if (!targetWorkspaceId) {
    return {
      message: 'No active team workspace found for this user.',
      notes: [],
    };
  }

  const { data, error } = await supabase
    .from('notes')
    .select('*, profiles:user_id(email, avatar_url)')
    .eq('workspace_id', targetWorkspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch team activity timeline: ${error.message}`);
  }

  return {
    workspaceId: targetWorkspaceId,
    count: data ? data.length : 0,
    notes: data || [],
  };
}
