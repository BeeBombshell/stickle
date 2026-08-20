import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: [],
  vite: () => ({
    plugins: [preact() as any],
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
        matches: ['https://*.supabase.co/*', 'https://app.stickle.app/*'],
      },
    ],
  },
});
