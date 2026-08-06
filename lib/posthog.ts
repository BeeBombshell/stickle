import posthog from 'posthog-js';

const projectToken = import.meta.env.WXT_PUBLIC_POSTHOG_KEY;
const apiHost = import.meta.env.WXT_PUBLIC_POSTHOG_HOST;

let isInitialized = false;

if (projectToken && apiHost) {
  try {
    const isExtensionPage =
      typeof window !== 'undefined' &&
      (window.location.protocol.startsWith('chrome-extension:') || window.location.protocol.startsWith('http'));

    posthog.init(projectToken, {
      api_host: apiHost,
      autocapture: false,
      persistence: 'localStorage',
      disable_session_recording: true,
      capture_pageview: false,
      capture_exceptions: isExtensionPage
        ? {
            capture_unhandled_errors: true,
            capture_unhandled_rejections: true,
            capture_console_errors: false,
          }
        : false,
    });
    isInitialized = true;
  } catch (err) {
    console.warn('[Stickle Analytics] PostHog initialization skipped:', err);
  }
} else if (import.meta.env.DEV) {
  console.warn(
    '[Stickle Analytics] PostHog env variables (WXT_PUBLIC_POSTHOG_KEY / WXT_PUBLIC_POSTHOG_HOST) not configured. Tracking is disabled.'
  );
}

/**
 * Safe capture wrapper that never throws or blocks execution.
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (!isInitialized) return;
  try {
    posthog.capture(eventName, properties);
  } catch (err) {
    console.warn(`[Stickle Analytics] Failed to track ${eventName}:`, err);
  }
}

export default posthog;

