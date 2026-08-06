const projectToken = import.meta.env.WXT_PUBLIC_POSTHOG_KEY;
const rawApiHost = import.meta.env.WXT_PUBLIC_POSTHOG_HOST;
const apiHost = rawApiHost ? rawApiHost.replace(/\/$/, '') : 'https://us.i.posthog.com';

let cachedDistinctId: string | null = null;

async function getDistinctId(): Promise<string> {
  if (cachedDistinctId) return cachedDistinctId;

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    try {
      const data = await chrome.storage.local.get('stickle_distinct_id');
      if (data.stickle_distinct_id) {
        cachedDistinctId = data.stickle_distinct_id;
        return cachedDistinctId!;
      }
      const newId = crypto.randomUUID();
      await chrome.storage.local.set({ stickle_distinct_id: newId });
      cachedDistinctId = newId;
      return newId;
    } catch {
      // Fallback
    }
  }

  cachedDistinctId = crypto.randomUUID();
  return cachedDistinctId;
}

/**
 * Direct lightweight fetch-based PostHog tracker.
 * Bypasses DOM/window dependencies and complies 100% with Manifest V3 Service Workers & Content Scripts.
 */
export async function trackEvent(eventName: string, properties?: Record<string, any>): Promise<void> {
  if (!projectToken || !apiHost) {
    if (import.meta.env.DEV) {
      console.warn(
        '[Stickle Analytics] PostHog env variables (WXT_PUBLIC_POSTHOG_KEY / WXT_PUBLIC_POSTHOG_HOST) not configured. Tracking is disabled.'
      );
    }
    return;
  }

  try {
    const distinctId = await getDistinctId();

    if (import.meta.env.DEV) {
      console.log('[Stickle Analytics] 🚀 Tracking Event:', eventName, properties || {});
    }

    const payload = {
      api_key: projectToken,
      event: eventName,
      properties: {
        distinct_id: distinctId,
        $lib: 'stickle-extension',
        ...(properties || {}),
      },
      timestamp: new Date().toISOString(),
    };

    const res = await fetch(`${apiHost}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (import.meta.env.DEV) {
      if (res.ok) {
        console.log(`[Stickle Analytics] ✅ Event '${eventName}' sent successfully.`);
      } else {
        console.warn(`[Stickle Analytics] ⚠️ PostHog API returned status ${res.status}`);
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(`[Stickle Analytics] Failed to track ${eventName}:`, err);
    }
  }
}

// Export default object with capture method for backwards compatibility with posthog.capture() calls
const posthog = {
  capture: (eventName: string, properties?: Record<string, any>) => {
    void trackEvent(eventName, properties);
  },
  init: () => {},
};

export default posthog;
