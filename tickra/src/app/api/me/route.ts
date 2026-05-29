import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';

// GET /api/me — returns current user + entitlement plan derived from DB.
// Free / Pro / Lifetime are surfaced so client gates can decide what to show.
export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ user: null, plan: 'free' });

  let plan: 'free' | 'pro' | 'lifetime' = 'free';
  if (isDbConfigured()) {
    const row = await getUser(session.email);
    if (row?.plan === 'pro' || row?.plan === 'lifetime') plan = row.plan;
  }

  return NextResponse.json({ user: { email: session.email }, plan });
}
