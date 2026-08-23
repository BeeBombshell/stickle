import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';
import { readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';

/**
 * Vite plugin: escape Unicode non-characters from built JS bundles.
 *
 * Chrome's content script loader rejects files containing literal U+FFFF or U+FFFE
 * even though they are technically valid UTF-8. Dexie.js uses "\uffff" as an
 * internal sentinel key, which Vite bundles as a literal byte sequence.
 * We replace them with JS unicode escapes (\uffff / \ufffe) — identical at runtime.
 */
function escapeUnicodeNonCharacters() {
  return {
    name: 'escape-unicode-non-characters',
    closeBundle: async () => {
      // Collect all .js output files (works for both dev and prod)
      const pattern = '.output/**/*.js';
      try {
        for await (const file of glob(pattern)) {
          const content = readFileSync(file, 'utf-8');
          if (content.includes('\uffff') || content.includes('\ufffe')) {
            const fixed = content
              .replace(/\uffff/g, '\\uffff')
              .replace(/\ufffe/g, '\\ufffe');
            writeFileSync(file, fixed, 'utf-8');
            console.log(`[stickle] Escaped U+FFFF/U+FFFE in ${file}`);
          }
        }
      } catch {
        // glob may not be available in all environments; silently skip
      }
    },
  };
}

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: [],
  vite: () => ({
    plugins: [preact() as any, escapeUnicodeNonCharacters()],
  }),

  manifest: {
    name: 'Stickle — Web Note Anchoring',
    description: 'Anchor persistent floating sticky notes directly to dynamic web content',
    permissions: ['storage', 'activeTab', 'scripting', 'contextMenus', 'alarms'],

    host_permissions: ['https://api.notion.com/*', 'https://*.posthog.com/*', 'https://*.supabase.co/*'],
    icons: {
      '16': 'icon/16.png',
      '32': 'icon/32.png',
      '48': 'icon/48.png',
      '128': 'icon/128.png',
    },
    action: {
      default_title: 'Stickle Notes Manager',
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '128': 'icon/128.png',
      },
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
    web_accessible_resources: [
      {
        resources: ['auth-callback.html', 'options.html'],
        // Restrict to Supabase OAuth redirect and the Stickle dashboard only.
        // This prevents arbitrary websites from fetching extension HTML pages.
        matches: ['https://*.supabase.co/*', 'https://stickle.beebombshell.com/*', 'https://app.stickle.app/*'],
      },
    ],
  },
});
