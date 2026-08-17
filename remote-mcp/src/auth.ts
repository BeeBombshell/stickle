import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key.trim()).digest('hex');
}

export function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export interface AuthenticatedUser {
  userId: string;
  keyId: string;
  keyName: string;
}

export async function validateApiKey(apiKey: string): Promise<AuthenticatedUser | null> {
  if (!apiKey || !apiKey.startsWith('sk_stickle_')) {
    return null;
  }

  try {
    const hashedKey = hashApiKey(apiKey);
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, user_id, name')
      .eq('key_hash', hashedKey)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Update last_used_at asynchronously
    (async () => {
      try {
        await supabase
          .from('api_keys')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', data.id);
      } catch (err) {
        console.error('Failed to update api_keys last_used_at:', err);
      }
    })();

    return {
      userId: data.user_id,
      keyId: data.id,
      keyName: data.name,
    };
  } catch (err) {
    console.error('Error validating API key:', err);
    return null;
  }
}
