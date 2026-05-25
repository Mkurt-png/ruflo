// Tickra DB client. Wraps the Supabase JS client behind a lazy import so the
// project still builds when no env keys are present. All callers must check
// `isConfigured()` first — otherwise they should fall back to client-side state.
//
// Env keys required to activate:
//   SUPABASE_URL                  https://<project>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY     (server-only, never exposed to the client)

export function isDbConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

type SupabaseClient = {
  from: (table: string) => {
    select: (cols?: string) => Promise<{ data: unknown; error: unknown }>;
    upsert: (rows: unknown, opts?: unknown) => Promise<{ data: unknown; error: unknown }>;
    delete: () => unknown;
  };
};

let cached: unknown = null;

export async function getDb() {
  if (!isDbConfigured()) return null;
  if (cached) return cached as SupabaseClient;

  try {
    const mod = (await import('@supabase/supabase-js')) as {
      createClient: (url: string, key: string, opts?: unknown) => unknown;
    };
    cached = mod.createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    return cached as SupabaseClient;
  } catch {
    // @supabase/supabase-js not installed yet — keep the route graceful.
    return null;
  }
}
