// kNOWTrade DB client. Real Supabase wiring behind a lazy import so the project
// still builds (and runtime works) when no env keys are present.
//
// Env keys required to activate:
//   SUPABASE_URL                  https://<project>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY     (server-only, never exposed to the client)

import type { SupabaseClient } from '@supabase/supabase-js';

export function isDbConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let cached: SupabaseClient | null = null;

export async function getDb(): Promise<SupabaseClient | null> {
  if (!isDbConfigured()) return null;
  if (cached) return cached;
  try {
    const mod = await import('@supabase/supabase-js');
    cached = mod.createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    return cached;
  } catch {
    return null;
  }
}
