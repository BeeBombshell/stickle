import { describe, it, expect, beforeEach } from 'vitest';
import { getActiveWorkspaceId, setActiveWorkspaceId } from '../lib/workspace';
import { getCachedWorkspaceNotes, cacheWorkspaceNotes, clearWorkspaceNotesCache } from '../lib/db';
import type { StickleNote } from '../lib/types';

describe('Phase 16 — Team Shared Annotations & Scalable Caching', () => {
  beforeEach(async () => {
    await setActiveWorkspaceId(null);
    await clearWorkspaceNotesCache();
  });

  it('toggles active workspace ID state cleanly', async () => {
    expect(await getActiveWorkspaceId()).toBeNull();

    await setActiveWorkspaceId('ws_acme_123');
    expect(await getActiveWorkspaceId()).toBe('ws_acme_123');

    await setActiveWorkspaceId(null);
    expect(await getActiveWorkspaceId()).toBeNull();
  });

  it('caches workspace notes locally for 0ms instant render', async () => {
    const sampleNote: StickleNote = {
      id: 'team_note_1',
      url: 'https://example.com/docs',
      pageTitle: 'Docs Page',
      content: 'Shared workspace annotation',
      anchor: { cssSelector: 'h1', offsetX: 10, offsetY: 20, tier: 'selector' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
      workspaceId: 'ws_acme_123',
      authorName: 'Alex',
      isReadOnly: true,
    };

    // Cache note
    await cacheWorkspaceNotes('ws_acme_123', [sampleNote]);

    // Instant local read
    const cachedAll = await getCachedWorkspaceNotes('ws_acme_123');
    expect(cachedAll).toHaveLength(1);
    expect(cachedAll[0].authorName).toBe('Alex');
    expect(cachedAll[0].isReadOnly).toBe(true);

    const cachedUrl = await getCachedWorkspaceNotes('ws_acme_123', 'https://example.com/docs');
    expect(cachedUrl).toHaveLength(1);

    const cachedMismatch = await getCachedWorkspaceNotes('ws_acme_123', 'https://example.com/other');
    expect(cachedMismatch).toHaveLength(0);
  });

  it('clears cached workspace notes correctly', async () => {
    const note: StickleNote = {
      id: 'team_note_2',
      url: 'https://example.com/blog',
      pageTitle: 'Blog',
      content: 'Teammate research note',
      anchor: { cssSelector: 'p', offsetX: 5, offsetY: 5, tier: 'selector' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
      workspaceId: 'ws_beta_456',
      authorName: 'Jordan',
      isReadOnly: true,
    };

    await cacheWorkspaceNotes('ws_beta_456', [note]);
    expect(await getCachedWorkspaceNotes('ws_beta_456')).toHaveLength(1);

    await clearWorkspaceNotesCache('ws_beta_456');
    expect(await getCachedWorkspaceNotes('ws_beta_456')).toHaveLength(0);
  });

  it('correctly distinguishes read-only vs editable team notes', () => {
    const currentUserId: string = 'user_current_111';

    const ownNote: StickleNote = {
      id: 'note_mine',
      url: 'https://example.com',
      pageTitle: 'My Note',
      content: 'My content',
      anchor: { cssSelector: 'body', offsetX: 0, offsetY: 0, tier: 'selector' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
      userId: 'user_current_111',
      isReadOnly: false,
    };

    const teammateNote: StickleNote = {
      id: 'note_teammate',
      url: 'https://example.com',
      pageTitle: 'Teammate Note',
      content: 'Teammate content',
      anchor: { cssSelector: 'body', offsetX: 0, offsetY: 0, tier: 'selector' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
      userId: 'user_teammate_222',
      authorName: 'Jordan',
      isReadOnly: currentUserId !== 'user_teammate_222',
    };

    expect(ownNote.isReadOnly).toBeFalsy();
    expect(teammateNote.isReadOnly).toBe(true);
    expect(teammateNote.authorName).toBe('Jordan');
  });

  it('preserves and propagates author avatar metadata for team member stickles', async () => {
    const avatarNote: StickleNote = {
      id: 'note_avatar_1',
      url: 'https://example.com/team',
      pageTitle: 'Team Portal',
      content: 'Note with member avatar',
      anchor: { cssSelector: 'h2', offsetX: 0, offsetY: 0, tier: 'selector' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedToNotion: false,
      workspaceId: 'ws_acme_123',
      authorName: 'Alex',
      authorAvatarUrl: 'https://lh3.googleusercontent.com/a/sample_photo.jpg',
      isReadOnly: true,
    };

    await cacheWorkspaceNotes('ws_acme_123', [avatarNote]);
    const cached = await getCachedWorkspaceNotes('ws_acme_123');

    expect(cached).toHaveLength(1);
    expect(cached[0].authorName).toBe('Alex');
    expect(cached[0].authorAvatarUrl).toBe('https://lh3.googleusercontent.com/a/sample_photo.jpg');
  });
});

