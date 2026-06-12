// Server-side helper: derive the current user's plan from the session cookie
// and the DB row (if DB is configured). Mirrors what /api/me returns, but
// callable from server components without a fetch.

import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import type { Plan } from '@/lib/auth/useUser';

export async function getCurrentPlan(): Promise<{ email: string | null; plan: Plan }> {
  const session = getSession();
  if (!session) return { email: null, plan: 'free' };
  if (!isDbConfigured()) return { email: session.email, plan: 'free' };
  const row = await getUser(session.email);
  const plan: Plan =
    row?.plan === 'pro' || row?.plan === 'lifetime' ? row.plan : 'free';
  return { email: session.email, plan };
}
