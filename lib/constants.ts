/**
 * Centralized application URLs, site endpoints, and external integration links.
 */
export const SITE_BASE_URL =
  (import.meta.env.WXT_PUBLIC_SITE_URL as string | undefined) ||
  'https://stickle.beebombshell.com';

// In the open-source build, the web dashboard (cloud sync) is not available.
// DASHBOARD_URL falls back to the main site landing page.
// stickle-app (commercial) overrides this via WXT_PUBLIC_DASHBOARD_URL env var.
export const DASHBOARD_URL =
  (import.meta.env.WXT_PUBLIC_DASHBOARD_URL as string | undefined) ||
  SITE_BASE_URL;

export const CHROME_WEB_STORE_URL =
  'https://chromewebstore.google.com/detail/stickle-%E2%80%94-web-note-anchor/ddahkjckhmgjkjgmmgbpmblogbioneok?hl=en-US&utm_source=ext_sidebar';

export const STICKLE_LINKS = {
  landing: SITE_BASE_URL,
  docs: `${SITE_BASE_URL}/docs`,
  onboarding: `${SITE_BASE_URL}/onboarding`,
  privacy: `${SITE_BASE_URL}/privacy`,
  dashboard: DASHBOARD_URL,
  github: 'https://github.com/BeeBombshell/stickle',
  notionIntegrations: 'https://www.notion.so/my-integrations',
  chromeWebStore: CHROME_WEB_STORE_URL,
} as const;
