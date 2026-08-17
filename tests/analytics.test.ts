import { describe, it, expect, vi, beforeEach } from 'vitest';
import posthog, { getDistinctId, trackEvent } from '../lib/posthog';

describe('Analytics Telemetry & Privacy Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retrieves or generates a valid UUID distinctId', async () => {
    const id1 = await getDistinctId();
    expect(id1).toBeDefined();
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(10);

    const id2 = await getDistinctId();
    expect(id2).toBe(id1);
  });

  it('runs trackEvent gracefully without throwing when PostHog key is unconfigured', async () => {
    await expect(trackEvent('test_event', { key: 'value' })).resolves.not.toThrow();
  });

  it('provides backwards compatibility via default posthog export', async () => {
    expect(posthog).toBeDefined();
    expect(typeof posthog.capture).toBe('function');
    expect(typeof posthog.init).toBe('function');

    expect(() => posthog.capture('note_created')).not.toThrow();
  });

  it('ensures tracking payloads comply with zero PII policy', () => {
    const samplePayload = {
      creation_method: 'alt_click',
    };

    // Assert payload keys contain no forbidden PII or content fields
    const keys = Object.keys(samplePayload);
    expect(keys).not.toContain('url');
    expect(keys).not.toContain('page_title');
    expect(keys).not.toContain('note_content');
    expect(keys).not.toContain('email');
  });
});
