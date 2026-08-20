import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateEmail,
  submitWaitlistEmail,
  getWaitlistState,
  sendDiscordWaitlistNotification,
  DISCORD_WAITLIST_WEBHOOK_URL,
} from '../lib/waitlist';

describe('Waitlist Service', () => {
  const store: Record<string, string> = {};
  let fetchMock: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    for (const key in store) {
      delete store[key];
    }
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const key in store) delete store[key];
      },
    });
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({}),
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  describe('validateEmail', () => {
    it('should validate valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@subdomain.domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@.com')).toBe(false);
    });
  });

  describe('submitWaitlistEmail', () => {
    it('should reject invalid email submission with error message', async () => {
      const result = await submitWaitlistEmail({ email: 'bad-email' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('valid email');
      expect(getWaitlistState().isJoined).toBe(false);
    });

    it('should successfully process valid email submission, store state, and notify Discord', async () => {
      const testEmail = `developer_${Date.now()}@stickle.app`;
      const result = await submitWaitlistEmail({
        email: testEmail,
        useCase: 'Developer',
        source: 'homepage_section',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("You're on the rollout waitlist");

      const state = getWaitlistState();
      expect(state.isJoined).toBe(true);
      expect(state.email).toBe(testEmail);
      expect(state.useCase).toBe('Developer');
      expect(state.joinedAt).toBeDefined();

      // Check Discord webhook invocation
      expect(fetchMock).toHaveBeenCalledWith(
        DISCORD_WAITLIST_WEBHOOK_URL,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  describe('sendDiscordWaitlistNotification', () => {
    it('should send a formatted discord webhook payload', async () => {
      const ok = await sendDiscordWaitlistNotification({
        email: 'tester@stickle.app',
        useCase: 'AI Agent MCP',
        source: 'waitlist_page',
      });

      expect(ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        DISCORD_WAITLIST_WEBHOOK_URL,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('tester@stickle.app'),
        })
      );
    });
  });
});

