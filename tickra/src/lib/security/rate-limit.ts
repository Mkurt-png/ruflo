// TICKRA-FIX(security): fixed-window rate limiting backed by Postgres.
//
// Used to stop abuse of unauthenticated endpoints that cost money or
// reputation — chiefly /api/auth/magic-link, which could otherwise be looped to
// mail any address through our Resend domain.
//
// Backed by the atomic `tickra_rate_limit_hit` RPC (migration 020) so parallel
// requests can't slip through a read-then-write race.
//
// Posture when the DB is unavailable is deliberately *permissive* here, unlike
// the AI quota: sign-in must keep working if Supabase is down or unconfigured
// (dev, preview). Callers that guard money should not rely on this.

import { getDb, isDbConfigured } from '@/lib/db/supabase';

export type RateLimitResult = {
  /** False when the caller has exceeded the limit for the current window. */
  allowed: boolean;
  /** Hits recorded in the current window (0 when the check was skipped). */
  count: number;
};

/**
 * Record one hit against `key` and report whether it stays within `limit`
 * for the current `windowSeconds` bucket.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  if (!isDbConfigured()) return { allowed: true, count: 0 };
  const db = await getDb();
  if (!db) return { allowed: true, count: 0 };

  const { data, error } = await db.rpc('tickra_rate_limit_hit', {
    p_key: key,
    p_window_seconds: windowSeconds,
  });

  // Missing RPC (migration not applied yet) or a transient error must not lock
  // users out of sign-in — degrade to "allowed" and let the caller proceed.
  if (error || typeof data !== 'number') return { allowed: true, count: 0 };

  return { allowed: data <= limit, count: data };
}

/**
 * Best-effort client IP from the proxy headers Vercel sets. Returns null when
 * nothing trustworthy is present, so callers can skip the per-IP bucket rather
 * than lumping every visitor into one shared key.
 */
export function clientIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip');
}
