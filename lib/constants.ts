/**
 * Centralized application URLs, site endpoints, and external integration links.
 */
export const SITE_BASE_URL =
  (import.meta.env.WXT_PUBLIC_SITE_URL as string | undefined) ||
  'https://stickle.beebombshell.com';

export const DASHBOARD_URL =
  (import.meta.env.WXT_PUBLIC_DASHBOARD_URL as string | undefined) ||
  `${SITE_BASE_URL}/notes`;

export const STICKLE_LINKS = {
  landing: SITE_BASE_URL,
  docs: `${SITE_BASE_URL}/docs`,
  onboarding: `${SITE_BASE_URL}/onboarding`,
  privacy: `${SITE_BASE_URL}/privacy`,
  dashboard: DASHBOARD_URL,
  github: 'https://github.com/BeeBombshell/stickle',
  notionIntegrations: 'https://www.notion.so/my-integrations',
} as const;
