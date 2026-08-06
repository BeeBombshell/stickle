import { describe, it, expect, beforeEach } from 'vitest';
import type { StickleNote } from '../lib/types';
import { createNote, getAllNotes, db } from '../lib/db';
import {
  generateExportFilename,
  formatNotesExportPackage,
  exportNotesToJson,
  importNotesFromJson,
  formatLocalSyncJson,
} from '../lib/export-import';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('Phase 9: Sharable Notes (Import & Export JSON)', () => {
  beforeEach(async () => {
    await db.notes.clear();
  });

  const sampleNotes: StickleNote[] = [
    {
      id: 'export-note-1',
      url: 'https://example.com/doc1',
      pageTitle: 'Export Test 1',
      content: 'Testing JSON export functionality',
      anchor: { cssSelector: 'h1', offsetX: 10, offsetY: 20, tier: 'selector' },
      color: 'lime',
      tags: ['export', 'json'],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      syncedToNotion: false,
    },
    {
      id: 'export-note-2',
      url: 'https://example.com/doc2',
      pageTitle: 'Export Test 2',
      content: 'Second note with highlights',
      anchor: { cssSelector: 'p', offsetX: 5, offsetY: 15, tier: 'text-fragment' },
      highlightRange: {
        selectedText: 'highlights',
        startContainerPath: 'BODY > P:nth-child(1)',
        startOffset: 0,
        endContainerPath: 'BODY > P:nth-child(1)',
        endOffset: 10,
      },
      color: 'pink',
      tags: ['highlight'],
      createdAt: 1700000050000,
      updatedAt: 1700000050000,
      syncedToNotion: true,
    },
  ];

  it('generates filename formatted stickle_export_YYYY-MM-DD.json', () => {
    const fixedDate = new Date(2026, 7, 5); // Aug 5, 2026
    const filename = generateExportFilename(fixedDate);
    expect(filename).toBe('stickle_export_2026-08-05.json');
  });

  it('formats notes into valid export package schema with version 1', () => {
    const pkg = formatNotesExportPackage(sampleNotes);
    expect(pkg.version).toBe(1);
    expect(pkg.notesCount).toBe(2);
    expect(pkg.notes).toHaveLength(2);
    expect(pkg.exportedAt).toBeGreaterThan(0);
  });

  it('exports notes to JSON string containing all note properties', () => {
    const { jsonString, filename } = exportNotesToJson(sampleNotes, 'custom_export.json');
    expect(filename).toBe('custom_export.json');

    const parsed = JSON.parse(jsonString);
    expect(parsed.version).toBe(1);
    expect(parsed.notes).toHaveLength(2);
    expect(parsed.notes[0].color).toBe('lime');
    expect(parsed.notes[0].tags).toEqual(['export', 'json']);
    expect(parsed.notes[1].highlightRange.selectedText).toBe('highlights');
  });

  it('imports valid JSON export package and restores notes into DB', async () => {
    const pkg = formatNotesExportPackage(sampleNotes);
    const jsonString = JSON.stringify(pkg);

    const result = await importNotesFromJson(jsonString);
    expect(result.success).toBe(true);
    expect(result.imported).toBe(2);
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(0);

    const notesInDb = await getAllNotes();
    expect(notesInDb).toHaveLength(2);
    expect(notesInDb.map((n) => n.id).sort()).toEqual(['export-note-1', 'export-note-2']);
  });

  it('handles updates for existing notes if imported note has newer timestamp', async () => {
    // Save initial note
    await createNote(sampleNotes[0]);

    // Create updated package with newer timestamp
    const updatedNote: StickleNote = {
      ...sampleNotes[0],
      content: 'Updated content from imported JSON',
      updatedAt: sampleNotes[0].updatedAt + 10000,
    };

    const pkg = formatNotesExportPackage([updatedNote]);
    const result = await importNotesFromJson(JSON.stringify(pkg));

    expect(result.success).toBe(true);
    expect(result.imported).toBe(0);
    expect(result.updated).toBe(1);

    const notesInDb = await getAllNotes();
    expect(notesInDb[0].content).toBe('Updated content from imported JSON');
  });

  it('skips existing notes if imported note is not newer', async () => {
    await createNote(sampleNotes[0]);

    const pkg = formatNotesExportPackage([sampleNotes[0]]);
    const result = await importNotesFromJson(JSON.stringify(pkg));

    expect(result.success).toBe(true);
    expect(result.imported).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('returns appropriate error on invalid JSON string', async () => {
    const result = await importNotesFromJson('{ invalid json syntax ');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid JSON format');
  });

  it('returns appropriate error on unsupported export version', async () => {
    const invalidVersionPkg = { version: 99, notes: [] };
    const result = await importNotesFromJson(JSON.stringify(invalidVersionPkg));
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported export version');
  });

  it('formats local sync JSON for disk sync helper', () => {
    const localJson = formatLocalSyncJson(sampleNotes);
    const parsed = JSON.parse(localJson);
    expect(parsed.version).toBe(1);
    expect(parsed.notesCount).toBe(2);
    expect(parsed.notes).toHaveLength(2);
    expect(parsed.notes[0].id).toBe('export-note-1');
  });
});
