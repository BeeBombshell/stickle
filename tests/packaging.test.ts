import { describe, it, expect } from 'vitest';
import { runPackagingChecks } from '../scripts/verify-packaging';

describe('Packaging & Manifest Compliance Verification', () => {
  it('passes all packaging checks for the root repository structure', () => {
    const result = runPackagingChecks();
    expect(result.passed).toBe(true);
    expect(result.checks.length).toBeGreaterThanOrEqual(4);
    
    const failedChecks = result.checks.filter(c => !c.success);
    expect(failedChecks).toEqual([]);
  });

  it('validates icon assets dimensions and non-zero sizes', () => {
    const result = runPackagingChecks();
    const iconCheck = result.checks.find(c => c.name.includes('Icon Assets Checklist'));
    expect(iconCheck).toBeDefined();
    expect(iconCheck?.success).toBe(true);
  });

  it('verifies permission scope safeguards in wxt.config.ts', () => {
    const result = runPackagingChecks();
    const permCheck = result.checks.find(c => c.name.includes('Permission Scope Safeguard'));
    expect(permCheck).toBeDefined();
    expect(permCheck?.success).toBe(true);
  });
});
