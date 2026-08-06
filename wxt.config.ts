import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

const posthogHost = process.env.WXT_PUBLIC_POSTHOG_HOST;

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
    permissions: ['storage', 'activeTab', 'scripting', 'contextMenus'],

    host_permissions: [
      'https://api.notion.com/*',
      ...(posthogHost ? [`${posthogHost}/*`] : []),
    ],
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
  },
});
