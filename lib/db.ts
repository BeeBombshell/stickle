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
  if (isChromeStorageAvailable()) {
    const notes = await getStorageNotes();
    const existingIndex = notes.findIndex((n) => n.id === note.id);
    if (existingIndex >= 0) {
      notes[existingIndex] = note;
    } else {
      notes.push(note);
    }
    await setStorageNotes(notes);
    try {
      await db.notes.put(note);
    } catch {}
    return note.id;
  }
  return await db.notes.add(note);
}

export async function getNotesForUrl(url: string): Promise<StickleNote[]> {
  if (isChromeStorageAvailable()) {
    const notes = await getStorageNotes();
    return notes.filter((n) => n.url === url);
  }
  return await db.notes.where('url').equals(url).toArray();
}

export async function getAllNotes(): Promise<StickleNote[]> {
  if (isChromeStorageAvailable()) {
    const notes = await getStorageNotes();
    return notes.sort((a, b) => b.createdAt - a.createdAt);
  }
  return await db.notes.orderBy('createdAt').reverse().toArray();
}

export async function updateNote(id: string, changes: Partial<StickleNote>): Promise<number> {
  if (isChromeStorageAvailable()) {
    const notes = await getStorageNotes();
    const index = notes.findIndex((n) => n.id === id);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...changes, updatedAt: Date.now() };
      await setStorageNotes(notes);
      try {
        await db.notes.update(id, changes);
      } catch {}
      return 1;
    }
    return 0;
  }
  return await db.notes.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteNote(id: string): Promise<void> {
  if (isChromeStorageAvailable()) {
    const notes = await getStorageNotes();
    const filtered = notes.filter((n) => n.id !== id);
    await setStorageNotes(filtered);
    try {
      await db.notes.delete(id);
    } catch {}
    return;
  }
  return await db.notes.delete(id);
}

