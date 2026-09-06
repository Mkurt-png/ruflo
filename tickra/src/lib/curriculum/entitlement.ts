// Entitlement rules for the curriculum.
//
// Free plan unlocks the first FREE_LESSON_LIMIT lessons of the global
// curriculum order. Pro / Lifetime unlock everything.
//
// "Global index" is the 1-based position of a lesson across every track,
// in the order defined in `data.ts` (see `lessonGlobalIndex`).

import type { Plan } from '@/lib/auth/useUser';

export const FREE_LESSON_LIMIT = 4;

export type EntitlementPlan = Plan;

export function isLessonUnlocked(globalIndex: number, plan: EntitlementPlan): boolean {
  if (plan === 'pro' || plan === 'lifetime') return true;
  return globalIndex > 0 && globalIndex <= FREE_LESSON_LIMIT;
}

export function isPaid(plan: EntitlementPlan): boolean {
  return plan === 'pro' || plan === 'lifetime';
}
