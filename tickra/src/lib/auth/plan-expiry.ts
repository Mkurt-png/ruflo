// TICKRA-FIX(billing): defence-in-depth on paid entitlements.
//
// Until now the effective plan was read straight off `user.plan`, which is only
// ever corrected by the Stripe webhook. `current_period_end` was stored but
// never consulted — so a single missed webhook (misconfigured endpoint, outage,
// a delivery that errored) left the account on Pro forever, for free.
//
// This module re-derives the plan from the paid-through date so entitlements
// expire on their own even when no webhook arrives.
//
// Deliberately forgiving, because a false "expired" locks out a paying
// customer, which is far worse than a few extra free days:
//   - `lifetime` never expires.
//   - A missing or unparseable `current_period_end` keeps Pro. It is legitimately
//     null in the window between checkout and the first subscription event.
//   - Past-due access survives a grace period, covering Stripe's own dunning
//     retries and clock skew.

import type { Plan } from '@/lib/auth/useUser';

/** Days of access kept after `current_period_end` before Pro is withdrawn. */
export const PLAN_GRACE_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type PlanBearer = {
  plan?: Plan | null;
  current_period_end?: string | null;
};

/**
 * The plan a user should actually be treated as having, right now.
 * Pure — pass `now` to test.
 */
export function resolveEffectivePlan(user: PlanBearer | null, now: Date = new Date()): Plan {
  if (!user) return 'free';

  // One-off purchase: nothing to renew, nothing to expire.
  if (user.plan === 'lifetime') return 'lifetime';

  if (user.plan !== 'pro') return 'free';

  // No paid-through date recorded — normal right after checkout, before the
  // subscription webhook lands. Keep access rather than bounce a fresh customer.
  if (!user.current_period_end) return 'pro';

  const endsAt = Date.parse(user.current_period_end);
  // Corrupt value: fail open. Never lock someone out over unreadable data.
  if (Number.isNaN(endsAt)) return 'pro';

  return now.getTime() <= endsAt + PLAN_GRACE_DAYS * DAY_MS ? 'pro' : 'free';
}

/** True when the plan is paid *and* still valid. */
export function hasPaidAccess(user: PlanBearer | null, now: Date = new Date()): boolean {
  const plan = resolveEffectivePlan(user, now);
  return plan === 'pro' || plan === 'lifetime';
}
