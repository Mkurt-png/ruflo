import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import {
  getOrCreateReferralSlug,
  listReferralsByInviter,
} from '@/lib/db/referral-queries';

// GET /api/me/referrals
// Returns the caller's referral slug, list of invitees, conversion count
// and pending reward days. Pro+ only (free users see nothing).

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'db_not_configured' }, { status: 501 });
  }

  const user = await getUser(session.email);
  if (!user) return NextResponse.json({ error: 'no_user' }, { status: 404 });

  const slug = await getOrCreateReferralSlug(session.email);
  const referrals = await listReferralsByInviter(session.email);
  const converted = referrals.filter((r) => r.status === 'converted').length;
  const pending = referrals.length - converted;

  return NextResponse.json({
    slug,
    plan: user.plan ?? 'free',
    referrals,
    counts: { total: referrals.length, converted, pending },
    rewardDaysPending: (user as { reward_days_pending?: number }).reward_days_pending ?? 0,
    welcomeBonusPending: (user as { welcome_bonus_pending?: number }).welcome_bonus_pending ?? 0,
  });
}
