import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';
import type { UserProfile } from './types';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseCredentials(): { url: string; key: string } {
  let url = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
  let key = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

  if (typeof process !== 'undefined' && process.env) {
    if (!url) url = process.env.VITE_SUPABASE_URL || '';
    if (!key) key = process.env.VITE_SUPABASE_ANON_KEY || '';
  }

  return { url, key };
}

export function initSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return null;
  }

  supabaseInstance = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
}

export async function getSession(): Promise<Session | null> {
  const client = initSupabase();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

export async function getProfile(): Promise<UserProfile | null> {
  const session = await getSession();
  if (!session?.user) return null;

  const oauthAvatarUrl =
    session.user.user_metadata?.avatar_url ||
    session.user.user_metadata?.picture ||
    session.user.identities?.[0]?.identity_data?.avatar_url ||
    session.user.identities?.[0]?.identity_data?.picture;

  const client = initSupabase();
  if (!client) {
    return {
      id: session.user.id,
      email: session.user.email || '',
      tier: 'free',
      avatarUrl: oauthAvatarUrl || undefined,
    };
  }

  try {
    const { data, error } = await client
      .from('profiles')
      .select('id, email, tier, license_key, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!data) {
      // Auto-provision profile row if missing with photo URL saved on auth
      const defaultProfile: UserProfile = {
        id: session.user.id,
        email: session.user.email || '',
        tier: 'free',
        avatarUrl: oauthAvatarUrl || undefined,
      };
      try {
        await client.from('profiles').upsert({
          id: session.user.id,
          email: session.user.email || '',
          tier: 'free',
          avatar_url: oauthAvatarUrl || null,
        });
      } catch {}
      return defaultProfile;
    }

    // Save photo URL on auth if profile exists in DB but avatar_url was missing
    if (!data.avatar_url && oauthAvatarUrl) {
      try {
        await client
          .from('profiles')
          .update({ avatar_url: oauthAvatarUrl })
          .eq('id', session.user.id);
        data.avatar_url = oauthAvatarUrl;
      } catch {}
    }

    return {
      id: data.id,
      email: data.email,
      tier: (data.tier as UserProfile['tier']) || 'free',
      licenseKey: data.license_key,
      avatarUrl: data.avatar_url || oauthAvatarUrl || undefined,
    };
  } catch {
    return {
      id: session.user.id,
      email: session.user.email || '',
      tier: 'free',
      avatarUrl: oauthAvatarUrl || undefined,
    };
  }
}

export async function signInWithOAuth(provider: 'google' | 'github'): Promise<{ success: boolean; url?: string; error?: string }> {
  const client = initSupabase();
  if (!client) {
    return { success: false, error: 'Supabase credentials not configured in environment.' };
  }

  const redirectUrl =
    typeof chrome !== 'undefined' && chrome.runtime?.getURL
      ? chrome.runtime.getURL('auth-callback.html')
      : `${window.location.origin}/auth-callback.html`;

  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: typeof chrome !== 'undefined' && Boolean(chrome.tabs?.create),
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data?.url) {
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: data.url });
    } else {
      window.location.href = data.url;
    }
  }

  return { success: true, url: data?.url };
}

export async function signOut(): Promise<void> {
  const client = initSupabase();
  if (client) {
    await client.auth.signOut();
  }
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.remove(['stickle_user_session', 'stickle_user_profile']);
  }
}

export async function getCurrentUserAuthorInfo(): Promise<{ authorName: string; authorAvatarUrl?: string }> {
  try {
    const session = await getSession();
    const metaName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name;
    const metaAvatar =
      session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture;

    const profile = await getProfile();
    const avatarUrl = profile?.avatarUrl || metaAvatar || undefined;

    if (metaName && typeof metaName === 'string' && metaName.trim()) {
      const firstName = metaName.trim().split(' ')[0];
      return { authorName: firstName, authorAvatarUrl: avatarUrl };
    }

    if (profile?.email) {
      const handle = profile.email.split('@')[0];
      const authorName = handle.charAt(0).toUpperCase() + handle.slice(1);
      return { authorName, authorAvatarUrl: avatarUrl };
    }
  } catch {}

  return {
    authorName: 'You',
    authorAvatarUrl: undefined,
  };
}

/**
 * Validates and updates user subscription tier in extension storage.
 * Caches result for 24 hours unless forceRefresh is true.
 */
export async function validateUserTier(forceRefresh = false): Promise<UserProfile['tier']> {
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  if (!forceRefresh && typeof chrome !== 'undefined' && chrome.storage?.local) {
    try {
      const cached = await chrome.storage.local.get(['stickle_user_tier', 'stickle_tier_validated_at']);
      const tier = cached.stickle_user_tier as UserProfile['tier'] | undefined;
      const validatedAt = cached.stickle_tier_validated_at as number | undefined;

      if (tier && validatedAt && Date.now() - validatedAt < CACHE_TTL_MS) {
        return tier;
      }
    } catch {}
  }

  const profile = await getProfile();
  const activeTier: UserProfile['tier'] = profile?.tier || 'free';

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    try {
      await chrome.storage.local.set({
        stickle_user_tier: activeTier,
        stickle_user_license_key: profile?.licenseKey || null,
        stickle_tier_validated_at: Date.now(),
      });
    } catch {}
  }

  return activeTier;
}


