import Dexie, { type Table } from 'dexie';
import type { StickleNote } from './types';

export class StickleDatabase extends Dexie {
  notes!: Table<StickleNote, string>;

  constructor() {
    super('StickleDB');
    this.version(1).stores({
      notes: 'id, url, createdAt, syncedToNotion',
    });
  }
}

export const db = new StickleDatabase();

const STORAGE_KEY = 'stickle_notes';

function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

function getStorageNotes(): Promise<StickleNote[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], async (result) => {
      if (result[STORAGE_KEY] !== undefined) {
        resolve(Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : []);
      } else {
        // Automatic initial migration from Dexie if notes exist
        try {
          const dexieNotes = await db.notes.toArray();
          if (dexieNotes.length > 0) {
            await setStorageNotes(dexieNotes);
            resolve(dexieNotes);
            return;
          }
        } catch {}
        resolve([]);
      }
    });
  });
}

function setStorageNotes(notes: StickleNote[]): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEY]: notes }, () => {
      if (chrome.runtime.lastError) {
        const errMsg = chrome.runtime.lastError.message || '';
        if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exceeded')) {
          reject(new Error('Storage quota exceeded. Please export or delete older notes.'));
        } else {
          reject(new Error(errMsg));
        }
      } else {
        resolve();
      }
    });
  });
}

// CRUD Helpers
export async function createNote(note: StickleNote): Promise<string> {
  const noteToSave: StickleNote = {
    ...note,
    syncStatus: note.syncStatus || 'pending',
  };

  let id: string;
  if (isChromeStorageAvailable()) {
    const notes = await getStorageNotes();
    const existingIndex = notes.findIndex((n) => n.id === noteToSave.id);
    if (existingIndex >= 0) {
      notes[existingIndex] = noteToSave;
    } else {
      notes.push(noteToSave);
    }
    await setStorageNotes(notes);
    try {
      await db.notes.put(noteToSave);
    } catch {}
    id = noteToSave.id;
  } else {
    id = await db.notes.add(noteToSave);
  }

  // Trigger background sync to Supabase asynchronously
  import('./sync').then(({ pushPendingNotes }) => pushPendingNotes()).catch(() => {});

  return id;
}

export async function getNotesForUrl(url: string): Promise<StickleNote[]> {
  if (isChromeStorageAvailable()) {
    const notes = await getStorageNotes();
    return notes.filter((n) => n.url === url && !n.deletedAt);
  }
  const dbNotes = await db.notes.where('url').equals(url).toArray();
  return dbNotes.filter((n) => !n.deletedAt);
}

export async function getAllNotes(): Promise<StickleNote[]> {
  if (isChromeStorageAvailable()) {
    const notes = await getStorageNotes();
    return notes.filter((n) => !n.deletedAt).sort((a, b) => b.createdAt - a.createdAt);
  }
  const dbNotes = await db.notes.orderBy('createdAt').reverse().toArray();
  return dbNotes.filter((n) => !n.deletedAt);
}

export async function updateNote(id: string, changes: Partial<StickleNote>): Promise<number> {
  const syncStatus = changes.syncStatus !== undefined ? changes.syncStatus : 'pending';
  const updatedChanges = {
    ...changes,
    syncStatus,
    updatedAt: changes.updatedAt || Date.now(),
  };

  let resultCount = 0;
  if (isChromeStorageAvailable()) {
    const notes = await getStorageNotes();
    const index = notes.findIndex((n) => n.id === id);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...updatedChanges };
      await setStorageNotes(notes);
      try {
        await db.notes.update(id, updatedChanges);
      } catch {}
      resultCount = 1;
    }
  } else {
    resultCount = await db.notes.update(id, updatedChanges);
  }

  // Trigger background sync to Supabase asynchronously
  import('./sync').then(({ pushPendingNotes }) => pushPendingNotes()).catch(() => {});

  return resultCount;
}

export async function deleteNote(id: string): Promise<void> {
  if (isChromeStorageAvailable()) {
    const notes = await getStorageNotes();
    const filtered = notes.filter((n) => n.id !== id);
    await setStorageNotes(filtered);
    try {
      await db.notes.delete(id);
    } catch {}
  } else {
    await db.notes.delete(id);
  }

  // Trigger background sync to Supabase asynchronously
  import('./sync').then(({ pushPendingNotes }) => pushPendingNotes()).catch(() => {});
}

// Workspace Note Cache Helpers (Local-First 0ms Initial Render)
const WORKSPACE_CACHE_KEY = 'stickle_workspace_notes_cache';
const inMemoryWorkspaceNotesCache: Record<string, StickleNote[]> = {};

export async function getCachedWorkspaceNotes(workspaceId: string, url?: string): Promise<StickleNote[]> {
  if (isChromeStorageAvailable()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([WORKSPACE_CACHE_KEY], (result) => {
        const cache: Record<string, StickleNote[]> = result[WORKSPACE_CACHE_KEY] || {};
        const workspaceNotes = cache[workspaceId] || [];
        if (url) {
          resolve(workspaceNotes.filter((n) => n.url === url && !n.deletedAt));
        } else {
          resolve(workspaceNotes.filter((n) => !n.deletedAt));
        }
      });
    });
  }

  // LocalStorage / Memory Fallback
  try {
    const raw = typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function' ? localStorage.getItem(WORKSPACE_CACHE_KEY) : null;
    const cache: Record<string, StickleNote[]> = raw ? JSON.parse(raw) : inMemoryWorkspaceNotesCache;
    const workspaceNotes = cache[workspaceId] || [];
    if (url) {
      return workspaceNotes.filter((n) => n.url === url && !n.deletedAt);
    }
    return workspaceNotes.filter((n) => !n.deletedAt);
  } catch {
    const workspaceNotes = inMemoryWorkspaceNotesCache[workspaceId] || [];
    if (url) {
      return workspaceNotes.filter((n) => n.url === url && !n.deletedAt);
    }
    return workspaceNotes.filter((n) => !n.deletedAt);
  }
}

export async function cacheWorkspaceNotes(workspaceId: string, notes: StickleNote[]): Promise<void> {
  if (isChromeStorageAvailable()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([WORKSPACE_CACHE_KEY], (result) => {
        const cache: Record<string, StickleNote[]> = result[WORKSPACE_CACHE_KEY] || {};
        cache[workspaceId] = notes;
        chrome.storage.local.set({ [WORKSPACE_CACHE_KEY]: cache }, () => resolve());
      });
    });
  }

  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      const raw = localStorage.getItem(WORKSPACE_CACHE_KEY);
      const cache: Record<string, StickleNote[]> = raw ? JSON.parse(raw) : {};
      cache[workspaceId] = notes;
      localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(cache));
    } else {
      inMemoryWorkspaceNotesCache[workspaceId] = notes;
    }
  } catch {
    inMemoryWorkspaceNotesCache[workspaceId] = notes;
  }
}

export async function clearWorkspaceNotesCache(workspaceId?: string): Promise<void> {
  if (isChromeStorageAvailable()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([WORKSPACE_CACHE_KEY], (result) => {
        const cache: Record<string, StickleNote[]> = result[WORKSPACE_CACHE_KEY] || {};
        if (workspaceId) {
          delete cache[workspaceId];
          chrome.storage.local.set({ [WORKSPACE_CACHE_KEY]: cache }, () => resolve());
        } else {
          chrome.storage.local.remove([WORKSPACE_CACHE_KEY], () => resolve());
        }
      });
    });
  }

  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      if (workspaceId) {
        const raw = localStorage.getItem(WORKSPACE_CACHE_KEY);
        const cache: Record<string, StickleNote[]> = raw ? JSON.parse(raw) : {};
        delete cache[workspaceId];
        localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(cache));
      } else {
        localStorage.removeItem(WORKSPACE_CACHE_KEY);
      }
    } else {
      if (workspaceId) {
        delete inMemoryWorkspaceNotesCache[workspaceId];
      } else {
        Object.keys(inMemoryWorkspaceNotesCache).forEach((k) => delete inMemoryWorkspaceNotesCache[k]);
      }
    }
  } catch {
    if (workspaceId) {
      delete inMemoryWorkspaceNotesCache[workspaceId];
    } else {
      Object.keys(inMemoryWorkspaceNotesCache).forEach((k) => delete inMemoryWorkspaceNotesCache[k]);
    }
  }
}



