import { describe, it, expect } from 'vitest';
import { hashApiKey } from '../src/auth.js';

describe('Remote MCP Authentication', () => {
  it('hashes API key with SHA-256 correctly', () => {
    const rawKey = 'sk_stickle_test_key_12345';
    const hashed = hashApiKey(rawKey);

    expect(hashed).toBeDefined();
    expect(hashed.length).toBe(64); // 64 hex characters for SHA-256
    expect(hashed).toBe(hashApiKey(rawKey)); // Deterministic
  });

  it('trims whitespace before hashing API key', () => {
    const key1 = 'sk_stickle_sample_key';
    const key2 = '   sk_stickle_sample_key  \n';

    expect(hashApiKey(key1)).toBe(hashApiKey(key2));
  });
});
