import { initSupabase, getSession, getProfile } from './auth';
import type { Workspace, WorkspaceMember, StickleNote } from './types';
import { getCachedWorkspaceNotes, cacheWorkspaceNotes } from './db';
import { normalizeUrl } from './anchoring';

const ACTIVE_WORKSPACE_KEY = 'stickle_active_workspace_id';

const inMemoryWorkspaceStorage: Record<string, string> = {};

function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

export async function getActiveWorkspaceId(): Promise<string | null> {
  if (isChromeStorageAvailable()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([ACTIVE_WORKSPACE_KEY], (result) => {
        resolve(result[ACTIVE_WORKSPACE_KEY] || null);
      });
    });
  }

  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
    }
  } catch {}
  return inMemoryWorkspaceStorage[ACTIVE_WORKSPACE_KEY] || null;
}

export async function setActiveWorkspaceId(workspaceId: string | null): Promise<void> {
  if (isChromeStorageAvailable()) {
    return new Promise((resolve) => {
      if (workspaceId) {
        chrome.storage.local.set({ [ACTIVE_WORKSPACE_KEY]: workspaceId }, () => resolve());
      } else {
        chrome.storage.local.remove([ACTIVE_WORKSPACE_KEY], () => resolve());
      }
    });
  }

  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      if (workspaceId) {
        localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
      } else {
        localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
      }
    } else {
      if (workspaceId) {
        inMemoryWorkspaceStorage[ACTIVE_WORKSPACE_KEY] = workspaceId;
      } else {
        delete inMemoryWorkspaceStorage[ACTIVE_WORKSPACE_KEY];
      }
    }
  } catch {
    if (workspaceId) {
      inMemoryWorkspaceStorage[ACTIVE_WORKSPACE_KEY] = workspaceId;
    } else {
      delete inMemoryWorkspaceStorage[ACTIVE_WORKSPACE_KEY];
    }
  }
}

export async function getUserWorkspaces(): Promise<Workspace[]> {
  const session = await getSession();
  if (!session?.user) return [];

  const client = initSupabase();
  if (!client) return [];

  try {
    const { data: memberRows, error: memberErr } = await client
      .from('workspace_members')
      .select('workspace_id, role, workspaces(id, name, slug, owner_id, created_at)')
      .eq('user_id', session.user.id);

    if (memberErr || !memberRows) return [];

    return memberRows
      .filter((row: any) => row.workspaces)
      .map((row: any) => ({
        id: row.workspaces.id,
        name: row.workspaces.name,
        slug: row.workspaces.slug,
        ownerId: row.workspaces.owner_id,
        createdAt: row.workspaces.created_at,
        role: row.role,
      }));
  } catch {
    return [];
  }
}

export async function createWorkspace(
  name: string
): Promise<{ success: boolean; workspace?: Workspace; error?: string }> {
  const session = await getSession();
  if (!session?.user) return { success: false, error: 'Not authenticated' };

  const client = initSupabase();
  if (!client) return { success: false, error: 'Supabase client uninitialized' };

  try {
    // Ensure profile row exists before referencing owner_id foreign key
    const profile = await getProfile();
    if (!profile) {
      return { success: false, error: 'User profile unavailable' };
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { data: ws, error: wsErr } = await client
      .from('workspaces')
      .insert({
        name,
        slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
        owner_id: session.user.id,
      })
      .select()
      .single();

    if (wsErr || !ws) {
      return { success: false, error: wsErr?.message || 'Failed to insert workspace' };
    }

    // Insert creator as owner in workspace_members
    const { error: memberErr } = await client.from('workspace_members').insert({
      workspace_id: ws.id,
      user_id: session.user.id,
      role: 'owner',
    });

    if (memberErr) {
      console.warn('Workspace member creation warning:', memberErr.message);
    }

    const created: Workspace = {
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      ownerId: ws.owner_id,
      createdAt: ws.created_at,
      role: 'owner',
    };

    return { success: true, workspace: created };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown exception creating workspace' };
  }
}

export async function inviteWorkspaceMember(workspaceId: string, email: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user) return { success: false, error: 'Not authenticated' };

  const client = initSupabase();
  if (!client) return { success: false, error: 'Supabase client unavailable' };

  try {
    // Look up profile by email if registered
    const { data: profile } = await client
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    const targetUserId = profile?.id || null;

    if (targetUserId) {
      const { error } = await client.from('workspace_members').upsert({
        workspace_id: workspaceId,
        user_id: targetUserId,
        role: 'member',
      });
      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to invite member' };
  }
}

export async function fetchWorkspaceNotesForUrl(
  workspaceId: string,
  url: string,
  since?: number
): Promise<StickleNote[]> {
  const session = await getSession();
  const currentUserId = session?.user?.id;
  const targetUrl = normalizeUrl(url);
  const rawUrl = url;
  const urlVariants = Array.from(new Set([targetUrl, rawUrl, encodeURI(targetUrl), encodeURI(rawUrl)]));

  // Step 1: Read instant local cache (0ms render)
  const cachedNotes = await getCachedWorkspaceNotes(workspaceId, targetUrl);

  const client = initSupabase();
  if (!client) return cachedNotes;

  try {
    // Step 2: Query remote Supabase notes for workspace_id and URL variations
    let query = client
      .from('notes')
      .select('*, profiles(email, avatar_url)')
      .eq('workspace_id', workspaceId)
      .in('url', urlVariants)
      .is('deleted_at', null);

    if (since) {
      query = query.gt('updated_at', new Date(since).toISOString());
    }

    let { data: remoteRows, error } = await query;

    // Fallback if join syntax fails
    if (error) {
      console.warn('Workspace notes join query notice, attempting direct select:', error.message);
      const fallbackQuery = client
        .from('notes')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('url', urlVariants)
        .is('deleted_at', null);

      const res = await fallbackQuery;
      if (!res.error && res.data) {
        remoteRows = res.data;
        error = null;
      }
    }

    if (error || !remoteRows) return cachedNotes;

    const mappedRemoteNotes: StickleNote[] = remoteRows.map((row: any) => {
      const profileObj = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const authorEmail = profileObj?.email || '';
      const handle = authorEmail ? authorEmail.split('@')[0] : 'Anonymous';
      const authorName = handle.charAt(0).toUpperCase() + handle.slice(1);
      const authorAvatarUrl = profileObj?.avatar_url || undefined;
      const isReadOnly = currentUserId ? row.user_id !== currentUserId : true;

      return {
        id: row.local_id || row.id,
        cloudId: row.id,
        url: row.url,
        pageTitle: row.page_title,
        content: row.content,
        anchor: row.anchor,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
        syncedToNotion: row.synced_to_notion || false,
        color: row.color,
        borderStyle: row.border_style,
        collapsed: row.collapsed,
        tags: row.tags || [],
        userId: row.user_id,
        workspaceId: row.workspace_id,
        authorName,
        authorAvatarUrl,
        isReadOnly,
      };
    });

    // Merge into local cache
    const existingWorkspaceNotes = await getCachedWorkspaceNotes(workspaceId);
    const updatedMap = new Map<string, StickleNote>();
    existingWorkspaceNotes.forEach((n) => updatedMap.set(n.id, n));
    mappedRemoteNotes.forEach((n) => updatedMap.set(n.id, n));

    const fullMergedList = Array.from(updatedMap.values());
    await cacheWorkspaceNotes(workspaceId, fullMergedList);

    return fullMergedList.filter(
      (n) => (n.url === targetUrl || n.url === rawUrl || normalizeUrl(n.url) === targetUrl) && !n.deletedAt
    );
  } catch {
    return cachedNotes;
  }
}
