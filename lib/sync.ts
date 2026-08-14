import { initSupabase, getSession } from './auth';
import { getAllNotes, createNote, updateNote, deleteNote, db } from './db';
import type { StickleNote } from './types';

const LAST_SYNC_KEY = 'stickle_last_synced_at';

export function getLastSyncedAt(): Promise<number> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([LAST_SYNC_KEY], (res) => {
        resolve(res[LAST_SYNC_KEY] || 0);
      });
    } else {
      try {
        const val = localStorage.getItem(LAST_SYNC_KEY);
        resolve(val ? parseInt(val, 10) : 0);
      } catch {
        resolve(0);
      }
    }
  });
}

export function setLastSyncedAt(timestamp: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ [LAST_SYNC_KEY]: timestamp }, () => resolve());
    } else {
      try {
        localStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
      } catch {}
      resolve();
    }
  });
}

export async function pushPendingNotes(): Promise<{ pushed: number; errors: number }> {
  const session = await getSession();
  if (!session?.user) return { pushed: 0, errors: 0 };

  const supabase = initSupabase();
  if (!supabase) return { pushed: 0, errors: 0 };

  const allLocalNotes = await getAllNotes();
  const pendingNotes = allLocalNotes.filter(
    (n) => n.syncStatus !== 'synced' || n.deletedAt !== undefined
  );

  if (pendingNotes.length === 0) return { pushed: 0, errors: 0 };

  let pushed = 0;
  let errors = 0;

  for (const note of pendingNotes) {
    try {
      const payload = {
        local_id: note.id,
        user_id: session.user.id,
        workspace_id: note.workspaceId || null,
        url: note.url,
        domain: extractDomain(note.url),
        page_title: note.pageTitle,
        content: note.content,
        anchor: note.anchor,
        color: note.color || 'lime',
        border_style: note.borderStyle || 'solid',
        collapsed: Boolean(note.collapsed),
        highlight_range: note.highlightRange || null,
        tags: note.tags || [],
        created_at: new Date(note.createdAt).toISOString(),
        updated_at: new Date(note.updatedAt).toISOString(),
        deleted_at: note.deletedAt ? new Date(note.deletedAt).toISOString() : null,
      };

      const { data, error } = await supabase
        .from('notes')
        .upsert(payload, { onConflict: 'user_id,local_id' })
        .select('id')
        .single();

      if (error) {
        errors++;
        console.error('Failed to push note to Supabase:', error);
        continue;
      }

      pushed++;
      if (note.deletedAt) {
        // Tombstone synced — now clean up locally
        await deleteNoteLocally(note.id);
      } else {
        await updateNote(note.id, {
          syncStatus: 'synced',
          cloudId: data?.id || note.cloudId,
          userId: session.user.id,
        });
      }
    } catch (err) {
      errors++;
      console.error('Push note error:', err);
    }
  }

  return { pushed, errors };
}

export async function pullRemoteNotes(since = 0): Promise<{ pulled: number; conflicts: number }> {
  const session = await getSession();
  if (!session?.user) return { pulled: 0, conflicts: 0 };

  const supabase = initSupabase();
  if (!supabase) return { pulled: 0, conflicts: 0 };

  let query = supabase.from('notes').select('*').eq('user_id', session.user.id);
  if (since > 0) {
    query = query.gt('updated_at', new Date(since).toISOString());
  }

  const { data: remoteNotes, error } = await query;
  if (error || !remoteNotes) {
    if (error) console.error('Failed to pull remote notes:', error);
    return { pulled: 0, conflicts: 0 };
  }

  const allLocalNotes = await getAllNotes();
  const localMap = new Map(allLocalNotes.map((n) => [n.id, n]));

  let pulled = 0;
  let conflicts = 0;

  for (const rNote of remoteNotes) {
    const localId = rNote.local_id;
    const remoteUpdatedAt = new Date(rNote.updated_at).getTime();
    const localNote = localMap.get(localId);

    // If remote note has tombstone, remove locally
    if (rNote.deleted_at) {
      if (localNote) {
        await deleteNoteLocally(localId);
        pulled++;
      }
      continue;
    }

    const formattedRemoteNote: StickleNote = {
      id: rNote.local_id,
      url: rNote.url,
      pageTitle: rNote.page_title || '',
      content: rNote.content || '',
      anchor: rNote.anchor,
      createdAt: new Date(rNote.created_at).getTime(),
      updatedAt: remoteUpdatedAt,
      syncedToNotion: false,
      color: rNote.color || 'lime',
      borderStyle: rNote.border_style || 'solid',
      collapsed: Boolean(rNote.collapsed),
      highlightRange: rNote.highlight_range || undefined,
      tags: rNote.tags || [],
      syncStatus: 'synced',
      cloudId: rNote.id,
      userId: rNote.user_id,
      workspaceId: rNote.workspace_id || undefined,
    };

    if (!localNote) {
      // New note from another device
      await createNote(formattedRemoteNote);
      pulled++;
    } else {
      // Detect conflicts: both updated within 5s and contents differ
      const timeDiff = Math.abs(localNote.updatedAt - remoteUpdatedAt);
      const contentMismatch = localNote.content !== formattedRemoteNote.content;

      if (timeDiff < 5000 && contentMismatch && localNote.syncStatus === 'pending') {
        conflicts++;
        await updateNote(localId, { syncStatus: 'conflict' });
      } else if (remoteUpdatedAt > localNote.updatedAt) {
        // Remote is strictly newer (Last-Write-Wins)
        await updateNote(localId, formattedRemoteNote);
        pulled++;
      }
    }
  }

  return { pulled, conflicts };
}

export async function fullSync(): Promise<{ pushed: number; pulled: number; conflicts: number }> {
  const pushRes = await pushPendingNotes();
  const lastSync = await getLastSyncedAt();
  const pullRes = await pullRemoteNotes(lastSync);
  await setLastSyncedAt(Date.now());
  return {
    pushed: pushRes.pushed,
    pulled: pullRes.pulled,
    conflicts: pullRes.conflicts,
  };
}

export function startRealtimeSync(onUpdate?: () => void): () => void {
  const supabase = initSupabase();
  if (!supabase) return () => {};

  let channel: any = null;

  getSession().then((session) => {
    if (!session?.user) return;

    channel = supabase
      .channel('stickle_notes_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${session.user.id}`,
        },
        async () => {
          await pullRemoteNotes(await getLastSyncedAt());
          await setLastSyncedAt(Date.now());
          if (onUpdate) onUpdate();
        }
      )
      .subscribe();
  });

  return () => {
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
  };
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

async function deleteNoteLocally(id: string): Promise<void> {
  await deleteNote(id);
}
