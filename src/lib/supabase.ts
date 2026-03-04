import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (import.meta.env.DEV) {
  console.debug('[Supabase] URL configured:', !!supabaseUrl, 'Key present:', !!supabaseAnonKey);
}

/** Custom fetch that disables cache so CMS content always fetches fresh from Supabase */
const noCacheFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store' });

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: { fetch: noCacheFetch },
    })
  : null;

export const isSupabaseConfigured = () => !!supabase;

/** Test REST API connectivity (for diagnostic when auth fails) */
export async function testRestConnection(): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Not configured' };
  try {
    const { error } = await supabase.from('cms_content').select('key').limit(1).maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
