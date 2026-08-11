import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyDodoSignature } from '../src/webhooks/dodopayments.js';

describe('remote-mcp — Dodo Payments E2E Webhook Pipeline', () => {
  const webhookSecret = 'whsec_e2e_test_secret_998877';

  it('validates signed Dodo Payments payment.succeeded webhook payload', () => {
    const payload = JSON.stringify({
      event: 'payment.succeeded',
      data: {
        id: 'pay_pro_1001',
        product_id: 'p_stickle_pro_supporter',
        license_key: 'lic_dodo_pro_1001',
        customer: { email: 'pro_user@stickle.app' },
        metadata: { user_id: 'usr_uuid_1001' },
      },
    });

    const signature = createHmac('sha256', webhookSecret).update(payload).digest('hex');
    const isSignatureValid = verifyDodoSignature(payload, signature, webhookSecret);
    expect(isSignatureValid).toBe(true);

    const parsed = JSON.parse(payload);
    expect(parsed.event).toBe('payment.succeeded');
    expect(parsed.data.metadata.user_id).toBe('usr_uuid_1001');
    expect(parsed.data.product_id).toBe('p_stickle_pro_supporter');
  });

  it('validates signed subscription.cancelled webhook payload for tier demotion', () => {
    const payload = JSON.stringify({
      event: 'subscription.cancelled',
      data: {
        id: 'sub_1002',
        customer: { email: 'canceled_user@stickle.app' },
        metadata: { user_id: 'usr_uuid_1002' },
      },
    });

    const signature = createHmac('sha256', webhookSecret).update(payload).digest('hex');
    const isSignatureValid = verifyDodoSignature(payload, signature, webhookSecret);
    expect(isSignatureValid).toBe(true);

    const parsed = JSON.parse(payload);
    expect(parsed.event).toBe('subscription.cancelled');
  });

  it('rejects tampered webhook payloads with invalid HMAC signature', () => {
    const payload = JSON.stringify({ event: 'payment.succeeded', data: { id: 'tampered' } });
    const fakeSignature = 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890';

    const isValid = verifyDodoSignature(payload, fakeSignature, webhookSecret);
    expect(isValid).toBe(false);
  });
});
