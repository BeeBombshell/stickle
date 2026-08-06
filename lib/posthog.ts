import 'posthog-js/dist/exception-autocapture';
import posthog from 'posthog-js/dist/module.no-external';

const projectToken = import.meta.env.WXT_PUBLIC_POSTHOG_KEY;
const apiHost = import.meta.env.WXT_PUBLIC_POSTHOG_HOST;

if (!projectToken || !apiHost) {
  if (import.meta.env.DEV) {
    const missingVariable = !projectToken
      ? 'WXT_PUBLIC_POSTHOG_KEY'
      : 'WXT_PUBLIC_POSTHOG_HOST';

    throw new Error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`
    );
  }
} else {
  posthog.init(projectToken, {
    api_host: apiHost,
    defaults: '2026-05-30',
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
  });
}

export default posthog;
