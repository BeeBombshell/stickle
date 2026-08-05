import type { StickleNote } from './types';
import { createNote, updateNote, getAllNotes } from './db';

export interface StickleExportPackage {
  version: number;
  exportedAt: number;
  notesCount: number;
  notes: StickleNote[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  total: number;
  error?: string;
}

export function generateExportFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `stickle_export_${year}-${month}-${day}.json`;
}

export function formatNotesExportPackage(notes: StickleNote[]): StickleExportPackage {
  return {
    version: 1,
    exportedAt: Date.now(),
    notesCount: notes.length,
    notes,
  };
}

export function exportNotesToJson(
  notes: StickleNote[],
  filename?: string
): { jsonString: string; filename: string } {
  const exportPkg = formatNotesExportPackage(notes);
  const jsonString = JSON.stringify(exportPkg, null, 2);
  const outFilename = filename || generateExportFilename();

  // Trigger browser file download if running in DOM environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Browser auto-download failed:', e);
    }
  }

  return { jsonString, filename: outFilename };
}

export async function importNotesFromJson(jsonString: string): Promise<ImportResult> {
  let pkg: any;

  try {
    pkg = JSON.parse(jsonString);
  } catch (err) {
    return {
      success: false,
      imported: 0,
      updated: 0,
      skipped: 0,
      total: 0,
      error: 'Invalid JSON format. Unable to parse file.',
    };
  }

  if (!pkg || typeof pkg !== 'object') {
    return {
      success: false,
      imported: 0,
      updated: 0,
      skipped: 0,
      total: 0,
      error: 'Invalid export package format.',
    };
  }

  // Handle both direct array export and packaged export format
  let notesToImport: StickleNote[] = [];

  if (Array.isArray(pkg)) {
    notesToImport = pkg;
  } else if (Array.isArray(pkg.notes)) {
    if (pkg.version && pkg.version > 1) {
      return {
        success: false,
        imported: 0,
        updated: 0,
        skipped: 0,
        total: 0,
        error: `Unsupported export version (${pkg.version}). Please update Stickle.`,
      };
    }
    notesToImport = pkg.notes;
  } else {
    return {
      success: false,
      imported: 0,
      updated: 0,
      skipped: 0,
      total: 0,
      error: 'JSON file does not contain a valid notes array.',
    };
  }

  const existingNotes = await getAllNotes();
  const existingMap = new Map<string, StickleNote>(existingNotes.map((n) => [n.id, n]));

  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const rawNote of notesToImport) {
    if (!rawNote || typeof rawNote !== 'object' || !rawNote.id || !rawNote.url || typeof rawNote.content !== 'string') {
      skippedCount++;
      continue;
    }

    const note: StickleNote = {
      id: String(rawNote.id),
      url: String(rawNote.url),
      pageTitle: String(rawNote.pageTitle || 'Untitled Page'),
      content: String(rawNote.content || ''),
      anchor: rawNote.anchor || {
        cssSelector: 'body',
        offsetX: 0,
        offsetY: 0,
        tier: 'unanchored',
      },
      createdAt: typeof rawNote.createdAt === 'number' ? rawNote.createdAt : Date.now(),
      updatedAt: typeof rawNote.updatedAt === 'number' ? rawNote.updatedAt : Date.now(),
      syncedToNotion: Boolean(rawNote.syncedToNotion),
      notionPageId: rawNote.notionPageId,
      color: rawNote.color,
      collapsed: rawNote.collapsed,
      highlightRange: rawNote.highlightRange,
      tags: Array.isArray(rawNote.tags) ? rawNote.tags : [],
    };

    const existing = existingMap.get(note.id);

    if (!existing) {
      await createNote(note);
      importedCount++;
    } else {
      // Update if imported note is newer or has modifications
      if (note.updatedAt > existing.updatedAt) {
        await updateNote(note.id, note);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }
  }

  return {
    success: true,
    imported: importedCount,
    updated: updatedCount,
    skipped: skippedCount,
    total: notesToImport.length,
  };
}

/**
 * Sync notes payload to local path format (~/.stickle/notes.json or custom path)
 * When executed in Node environments or MCP tools.
 */
export function formatLocalSyncJson(notes: StickleNote[]): string {
  return JSON.stringify(
    {
      version: 1,
      lastSyncedAt: Date.now(),
      notesCount: notes.length,
      notes,
    },
    null,
    2
  );
}

export function syncNotesToLocalDisk(notes: StickleNote[], targetPath?: string): boolean {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const defaultDir = path.join(os.homedir(), '.stickle');
      const filePath = targetPath || path.join(defaultDir, 'notes.json');
      const parentDir = path.dirname(filePath);

      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      const content = formatLocalSyncJson(notes);
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    } catch (err) {
      console.warn('Local disk sync failed:', err);
      return false;
    }
  }
  return false;
}

