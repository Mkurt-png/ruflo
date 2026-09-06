import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import { resolveEffectivePlan } from '@/lib/auth/plan-expiry';

// Always run per-request: the response depends on the session cookie.
export const dynamic = 'force-dynamic';

// GET /api/me — returns current user + entitlement plan derived from DB.
// Free / Pro / Lifetime are surfaced so client gates can decide what to show.
export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ user: null, plan: 'free' });

  let plan: 'free' | 'pro' | 'lifetime' = 'free';
  if (isDbConfigured()) {
    const row = await getUser(session.email);
    // TICKRA-FIX(billing): honour the paid-through date so a missed Stripe
    // webhook can't leave an account on Pro indefinitely.
    plan = resolveEffectivePlan(row);
  }

  return NextResponse.json({ user: { email: session.email }, plan });
}
