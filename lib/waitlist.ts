import { trackEvent } from './posthog';

export interface WaitlistSubmission {
  email: string;
  useCase?: string;
  source?: string;
}

export interface WaitlistState {
  isJoined: boolean;
  email?: string;
  joinedAt?: number;
  useCase?: string;
}

const WAITLIST_EMAIL_KEY = 'stickle_waitlist_email';
const WAITLIST_JOINED_AT_KEY = 'stickle_waitlist_joined_at';
const WAITLIST_USE_CASE_KEY = 'stickle_waitlist_use_case';

export const DISCORD_WAITLIST_WEBHOOK_URL =
  (import.meta as any).env?.VITE_DISCORD_WAITLIST_WEBHOOK_URL ||
  (import.meta as any).env?.WXT_PUBLIC_DISCORD_WAITLIST_WEBHOOK_URL ||
  (import.meta as any).env?.DISCORD_WAITLIST_WEBHOOK_URL ||
  (typeof process !== 'undefined'
    ? process.env?.VITE_DISCORD_WAITLIST_WEBHOOK_URL ||
      process.env?.WXT_PUBLIC_DISCORD_WAITLIST_WEBHOOK_URL ||
      process.env?.DISCORD_WAITLIST_WEBHOOK_URL ||
      process.env?.NEXT_PUBLIC_DISCORD_WAITLIST_WEBHOOK_URL
    : undefined) ||
  '';

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}

export function getWaitlistState(): WaitlistState {
  try {
    const email = localStorage.getItem(WAITLIST_EMAIL_KEY);
    const joinedAtStr = localStorage.getItem(WAITLIST_JOINED_AT_KEY);
    const useCase = localStorage.getItem(WAITLIST_USE_CASE_KEY) || undefined;

    if (email && validateEmail(email)) {
      return {
        isJoined: true,
        email,
        joinedAt: joinedAtStr ? parseInt(joinedAtStr, 10) : undefined,
        useCase,
      };
    }
  } catch (e) {
    console.warn('LocalStorage access failed:', e);
  }
  return { isJoined: false };
}

export async function sendDiscordWaitlistNotification(submission: WaitlistSubmission): Promise<boolean> {
  if (!DISCORD_WAITLIST_WEBHOOK_URL) return false;

  try {
    const payload = {
      content: `🎉 **New Stickle Waitlist Signup!**\n• **Email:** \`${submission.email}\`\n• **Use Case:** ${submission.useCase || 'General'}\n• **Source:** ${submission.source || 'homepage'}`,
      embeds: [
        {
          title: '🎉 New Stickle Waitlist Signup',
          color: 0xe4f579, // #E4F579 Stickle Lime
          fields: [
            { name: 'Email', value: submission.email, inline: true },
            { name: 'Use Case', value: submission.useCase || 'General', inline: true },
            { name: 'Source', value: submission.source || 'homepage', inline: true },
          ],
          footer: { text: 'Stickle Early Access Rollout' },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const res = await fetch(DISCORD_WAITLIST_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.warn('Failed to send Discord waitlist notification:', err);
    return false;
  }
}

export async function submitWaitlistEmail(submission: WaitlistSubmission): Promise<{ success: boolean; message: string; isDuplicate?: boolean }> {
  const trimmedEmail = submission.email.trim().toLowerCase();

  if (!validateEmail(trimmedEmail)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const payload = {
    email: trimmedEmail,
    use_case: submission.useCase || 'General',
    source: submission.source || 'homepage',
    created_at: new Date().toISOString(),
  };

  // 1. Save to LocalStorage immediately for instant UI responsiveness
  try {
    localStorage.setItem(WAITLIST_EMAIL_KEY, trimmedEmail);
    localStorage.setItem(WAITLIST_JOINED_AT_KEY, Date.now().toString());
    if (submission.useCase) {
      localStorage.setItem(WAITLIST_USE_CASE_KEY, submission.useCase);
    }
  } catch (e) {
    console.warn('Failed to cache waitlist entry in LocalStorage:', e);
  }

  // 2. Capture PostHog Analytics Conversion Event
  try {
    void trackEvent('waitlist_submitted', {
      email: trimmedEmail,
      use_case: submission.useCase,
      source: submission.source,
    });
  } catch (e) {
    console.warn('PostHog waitlist event capture skipped:', e);
  }

  // 3. Send Discord Webhook Notification
  try {
    void sendDiscordWaitlistNotification({
      email: trimmedEmail,
      useCase: submission.useCase,
      source: submission.source,
    });
  } catch (e) {
    console.warn('Discord webhook notification skipped:', e);
  }

  // 4. Attempt Supabase API Post if env configured
  const supabaseUrl =
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    (import.meta as any).env?.WXT_PUBLIC_SUPABASE_URL ||
    (import.meta as any).env?.SUPABASE_URL ||
    (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL : undefined);

  const supabaseAnonKey =
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.WXT_PUBLIC_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.SUPABASE_ANON_KEY ||
    (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY : undefined);

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Check for Postgres unique constraint violation (duplicate email)
        if (response.status === 409 || errorText.includes('duplicate') || errorText.includes('unique constraint')) {
          return {
            success: true,
            isDuplicate: true,
            message: "You're already on the waitlist! We'll notify you as soon as early access opens.",
          };
        }
        console.warn('Supabase waitlist insert failed, preserved locally:', errorText);
      }
    } catch (err) {
      console.warn('Network error posting waitlist to Supabase, fallback stored locally:', err);
    }
  }

  return {
    success: true,
    message: "You're on the rollout waitlist. We will notify you the moment Stickle launches.",
  };
}
