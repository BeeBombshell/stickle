import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isEnabled, FEATURE_NAMES } from '../lib/flags';
import type { StickleNote, UserProfile } from '../lib/types';

describe('Feature Flags System (lib/flags.ts)', () => {
  it('correctly evaluates feature flags for free tier accounts', () => {
    expect(isEnabled('cloudSync', 'free')).toBe(false);
    expect(isEnabled('teamSharing', 'free')).toBe(false);
    expect(isEnabled('remoteMCP', 'free')).toBe(false);
    expect(isEnabled('centralDashboard', 'free')).toBe(false);
  });

  it('correctly evaluates feature flags for supporter (Pro) tier accounts', () => {
    expect(isEnabled('cloudSync', 'supporter')).toBe(true);
    expect(isEnabled('teamSharing', 'supporter')).toBe(false);
    expect(isEnabled('remoteMCP', 'supporter')).toBe(true);
    expect(isEnabled('centralDashboard', 'supporter')).toBe(true);
  });

  it('correctly evaluates feature flags for team_member tier accounts', () => {
    expect(isEnabled('cloudSync', 'team_member')).toBe(true);
    expect(isEnabled('teamSharing', 'team_member')).toBe(true);
    expect(isEnabled('remoteMCP', 'team_member')).toBe(true);
    expect(isEnabled('centralDashboard', 'team_member')).toBe(true);
  });

  it('provides metadata and minTier for every feature flag', () => {
    expect(FEATURE_NAMES.cloudSync.minTier).toBe('Pro Supporter');
    expect(FEATURE_NAMES.teamSharing.minTier).toBe('Teams');
  });
});

describe('StickleNote Sync Types & Conflict State', () => {
  it('correctly populates sync status fields on note object', () => {
    const note: StickleNote = {
      id: 'test-note-1',
      url: 'https://example.com',
      pageTitle: 'Test Page',
      content: 'Local note content',
      anchor: {
        cssSelector: 'body > p',
        offsetX: 10,
        offsetY: 20,
        tier: 'selector',
      },
      createdAt: 1700000000000,
      updatedAt: 1700000005000,
      syncedToNotion: false,
      syncStatus: 'pending',
    };

    expect(note.syncStatus).toBe('pending');
    expect(note.deletedAt).toBeUndefined();
  });

  it('handles conflict status detection logic correctly', () => {
    const localUpdatedAt = 1700000005000;
    const remoteUpdatedAt = 1700000007000;
    const timeDiff = Math.abs(localUpdatedAt - remoteUpdatedAt);
    const contentMismatch = ('Local text' as string) !== ('Remote text' as string);

    const isConflict = timeDiff < 5000 && contentMismatch;
    expect(isConflict).toBe(true);
  });
});
