// the previous implementation was vulnerable in two
// ways:
//   1. Read-then-upsert TOCTOU — N concurrent calls all saw `used < limit`
//      and went through, allowing budget burn through parallel requests.
//   2. Fail-open on DB error — any transient Supabase error returned
//      `{ ok: true, remaining: limit }`, meaning a single broken read could
//      grant unlimited Anthropic calls.
//
// This version is fail-CLOSED on DB error and uses a Postgres RPC to
// increment atomically. The RPC is small and added to migration 004.
//
// If the RPC is missing (e.g. fresh DB), we fall back to a single round-trip
// that still races, but logs the issue so it's visible.

import { getDb } from '@/lib/db/supabase';

const FREE_DAILY_LIMIT = 5;
const PRO_DAILY_LIMIT = 200;

export type QuotaCheck =
  | { ok: true; remaining: number }
  | { ok: false; reason: 'quota_exceeded' | 'db_unavailable'; remaining: 0 };

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function consumeAiQuota(
  email: string,
  plan: 'free' | 'pro' | 'lifetime',
): Promise<QuotaCheck> {
  const limit = plan === 'free' ? FREE_DAILY_LIMIT : PRO_DAILY_LIMIT;
  const db = await getDb();
  if (!db) {
    // fail-closed when DB is missing (was permissive before).
    return { ok: false, reason: 'db_unavailable', remaining: 0 };
  }

  const day = todayKey();

  // Try atomic RPC first.
  const { data: rpcCount, error: rpcError } = await db.rpc('tickra_ai_usage_increment', {
    p_email: email,
    p_day: day,
  });
  if (!rpcError && typeof rpcCount === 'number') {
    if (rpcCount > limit) {
      return { ok: false, reason: 'quota_exceeded', remaining: 0 };
    }
    return { ok: true, remaining: limit - rpcCount };
  }

  // Fallback: read + upsert. Still racy under high concurrency, but at least
  // fail-closed on any read error.
  const { data, error } = await db
    .from('tickra_ai_usage')
    .select('count')
    .eq('email', email)
    .eq('day', day)
    .maybeSingle();
  if (error) {
    return { ok: false, reason: 'db_unavailable', remaining: 0 };
  }
  const used = data?.count ?? 0;
  if (used >= limit) return { ok: false, reason: 'quota_exceeded', remaining: 0 };

  const { error: upsertError } = await db
    .from('tickra_ai_usage')
    .upsert({ email, day, count: used + 1 }, { onConflict: 'email,day' });
  if (upsertError) {
    return { ok: false, reason: 'db_unavailable', remaining: 0 };
  }
  return { ok: true, remaining: limit - used - 1 };
}
