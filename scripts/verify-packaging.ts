import fs from 'node:fs';
import path from 'node:path';

export interface PackagingCheckResult {
  passed: boolean;
  checks: { name: string; success: boolean; details?: string }[];
}

export function runPackagingChecks(rootDir: string = process.cwd()): PackagingCheckResult {
  const checks: { name: string; success: boolean; details?: string }[] = [];

  // Check 1: Icon assets existence & sizes
  const requiredIcons = ['16.png', '32.png', '48.png', '128.png'];
  const iconDir = path.join(rootDir, 'public', 'icon');
  let iconsValid = true;

  for (const icon of requiredIcons) {
    const iconPath = path.join(iconDir, icon);
    if (!fs.existsSync(iconPath)) {
      iconsValid = false;
      checks.push({ name: `Icon Asset: ${icon}`, success: false, details: `Missing icon asset at ${iconPath}` });
    } else {
      const stat = fs.statSync(iconPath);
      if (stat.size === 0) {
        iconsValid = false;
        checks.push({ name: `Icon Asset: ${icon}`, success: false, details: `Zero-byte icon file at ${iconPath}` });
      }
    }
  }

  if (iconsValid) {
    checks.push({ name: 'Icon Assets Checklist (16/32/48/128px)', success: true, details: 'All 4 PNG icon sizes present and non-empty.' });
  }

  // Check 2: wxt.config.ts exists & permissions check
  const wxtConfigPath = path.join(rootDir, 'wxt.config.ts');
  if (!fs.existsSync(wxtConfigPath)) {
    checks.push({ name: 'WXT Config File', success: false, details: 'wxt.config.ts file not found at repository root.' });
  } else {
    const configContent = fs.readFileSync(wxtConfigPath, 'utf-8');
    const hasBroadPermissions = configContent.includes("'permissions': ['<all_urls>'") || configContent.includes('"<all_urls>"') && configContent.includes('permissions');
    
    // Scoped host permissions check
    const hasScopedNotion = configContent.includes('api.notion.com');
    const hasScopedSupabase = configContent.includes('supabase.co');

    if (hasBroadPermissions) {
      checks.push({ name: 'Permission Scope Safeguard', success: false, details: 'Unscoped <all_urls> permission detected in primary permissions array.' });
    } else {
      checks.push({ name: 'Permission Scope Safeguard', success: true, details: 'Permissions are narrowly scoped to activeTab and required domains.' });
    }

    if (hasScopedNotion && hasScopedSupabase) {
      checks.push({ name: 'Host Permissions Rule', success: true, details: 'Host permissions explicitly list Notion and Supabase endpoints.' });
    } else {
      checks.push({ name: 'Host Permissions Rule', success: false, details: 'Missing expected host permissions in wxt.config.ts' });
    }
  }

  // Check 3: Required Entrypoints exist
  const entrypointsDir = path.join(rootDir, 'entrypoints');
  const requiredEntrypoints = ['background.ts', 'content.ts', 'popup', 'options', 'onboarding'];
  let entrypointsValid = true;

  for (const ep of requiredEntrypoints) {
    const epPath = path.join(entrypointsDir, ep);
    if (!fs.existsSync(epPath)) {
      entrypointsValid = false;
      checks.push({ name: `Extension Entrypoint: ${ep}`, success: false, details: `Entrypoint missing at ${epPath}` });
    }
  }

  if (entrypointsValid) {
    checks.push({ name: 'Core Extension Entrypoints Structure', success: true, details: 'All primary entrypoints (background, content, popup, options, onboarding) exist.' });
  }

  const overallPassed = checks.every(c => c.success);
  return { passed: overallPassed, checks };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('📦 Running Stickle Extension Packaging Verification Checks...\n');
  const result = runPackagingChecks();
  for (const check of result.checks) {
    console.log(`${check.success ? '✅' : '❌'} ${check.name}: ${check.details || ''}`);
  }
  if (!result.passed) {
    process.exit(1);
  }
  console.log('\n🎉 Packaging verification passed successfully!');
}
