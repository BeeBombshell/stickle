import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://hipwwiftfdthbdwtmvky.supabase.co';
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    'sb_publishable_5YLqOjJTKY_KYHojfZ1A2A_rWULmcjg';

  return createSupabaseBrowserClient(url, key);
}

export { createClient as createBrowserClient };

