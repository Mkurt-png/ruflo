// TICKRA-PHASE-2.1: per-user daily quota for AskTickra.
// Free plan: 5 questions/day. Pro/Lifetime: unlimited.
// Stored in localStorage on the client AND verified in the API route via a
// signed token in the cookie when DB isn't available.
//
// For simplicity v1: just track on the server in memory? No — serverless is
// stateless. Track in Supabase via tickra_ai_usage table OR fall back to a
// per-IP cap via a Map (best-effort, resets on cold start). We choose the
// Supabase path when DB is configured, and a permissive fallback otherwise.

import { getDb } from '@/lib/db/supabase';

const FREE_DAILY_LIMIT = 5;
const PRO_DAILY_LIMIT = 200;

export type QuotaCheck =
  | { ok: true; remaining: number }
  | { ok: false; reason: 'quota_exceeded'; remaining: 0 };

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
    // Permissive when DB is unavailable — don't break the feature in dev.
    return { ok: true, remaining: limit };
  }

  const day = todayKey();
  const { data, error } = await db
    .from('tickra_ai_usage')
    .select('count')
    .eq('email', email)
    .eq('day', day)
    .maybeSingle();
  if (error) return { ok: true, remaining: limit }; // table missing → permissive

  const used = data?.count ?? 0;
  if (used >= limit) return { ok: false, reason: 'quota_exceeded', remaining: 0 };

  await db
    .from('tickra_ai_usage')
    .upsert({ email, day, count: used + 1 }, { onConflict: 'email,day' });
  return { ok: true, remaining: limit - used - 1 };
}
