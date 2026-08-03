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
    permissions: ['storage', 'activeTab', 'scripting'],
    action: {
      default_title: 'Stickle Notes Manager',
    },
  },
});
