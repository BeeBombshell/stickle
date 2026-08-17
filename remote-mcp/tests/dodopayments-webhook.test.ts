import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyDodoSignature } from '../src/webhooks/dodopayments';

describe('remote-mcp/src/webhooks/dodopayments — Signature & Event Validation', () => {
  const secret = 'whsec_test_secret_key_12345';
  const samplePayload = JSON.stringify({
    event: 'payment.succeeded',
    data: {
      id: 'pay_98765',
      product_id: 'p_stickle_pro_supporter',
      license_key: 'lic_abc123',
      customer: { email: 'tester@stickle.app' },
    },
  });

  it('validates a correct HMAC SHA256 signature', () => {
    const validSignature = createHmac('sha256', secret).update(samplePayload).digest('hex');
    const isValid = verifyDodoSignature(samplePayload, validSignature, secret);
    expect(isValid).toBe(true);
  });

  it('rejects an invalid HMAC signature', () => {
    const invalidSignature = 'invalid_signature_hash_value';
    const isValid = verifyDodoSignature(samplePayload, invalidSignature, secret);
    expect(isValid).toBe(false);
  });

  it('rejects verification when signature or secret is missing', () => {
    expect(verifyDodoSignature(samplePayload, null, secret)).toBe(false);
    expect(verifyDodoSignature(samplePayload, 'sig', '')).toBe(false);
  });
});
