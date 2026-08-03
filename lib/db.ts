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

// CRUD Helpers
export async function createNote(note: StickleNote): Promise<string> {
  return await db.notes.add(note);
}

export async function getNotesForUrl(url: string): Promise<StickleNote[]> {
  return await db.notes.where('url').equals(url).toArray();
}

export async function getAllNotes(): Promise<StickleNote[]> {
  return await db.notes.orderBy('createdAt').reverse().toArray();
}

export async function updateNote(id: string, changes: Partial<StickleNote>): Promise<number> {
  return await db.notes.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteNote(id: string): Promise<void> {
  return await db.notes.delete(id);
}
