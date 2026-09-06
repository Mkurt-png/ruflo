import { describe, it, expect } from 'vitest';
import { resolveEffectivePlan, hasPaidAccess, PLAN_GRACE_DAYS } from './plan-expiry';

const NOW = new Date('2026-09-06T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const at = (offsetDays: number) => new Date(NOW.getTime() + offsetDays * DAY).toISOString();

describe('resolveEffectivePlan — free and unknown users', () => {
  it('treats a missing user as free', () => {
    expect(resolveEffectivePlan(null, NOW)).toBe('free');
  });

  it('treats an unset plan as free', () => {
    expect(resolveEffectivePlan({}, NOW)).toBe('free');
    expect(resolveEffectivePlan({ plan: null }, NOW)).toBe('free');
    expect(resolveEffectivePlan({ plan: 'free' }, NOW)).toBe('free');
  });
});

describe('resolveEffectivePlan — lifetime', () => {
  it('never expires, even with a long-past period end', () => {
    expect(resolveEffectivePlan({ plan: 'lifetime', current_period_end: at(-3650) }, NOW)).toBe(
      'lifetime',
    );
  });
});

describe('resolveEffectivePlan — pro', () => {
  it('keeps pro while the period is still running', () => {
    expect(resolveEffectivePlan({ plan: 'pro', current_period_end: at(20) }, NOW)).toBe('pro');
  });

  it('keeps pro inside the grace period after the period ends', () => {
    expect(resolveEffectivePlan({ plan: 'pro', current_period_end: at(-1) }, NOW)).toBe('pro');
    expect(
      resolveEffectivePlan({ plan: 'pro', current_period_end: at(-PLAN_GRACE_DAYS + 0.5) }, NOW),
    ).toBe('pro');
  });

  it('drops to free once the grace period has passed — the missed-webhook case', () => {
    expect(
      resolveEffectivePlan({ plan: 'pro', current_period_end: at(-PLAN_GRACE_DAYS - 0.5) }, NOW),
    ).toBe('free');
    expect(resolveEffectivePlan({ plan: 'pro', current_period_end: at(-400) }, NOW)).toBe('free');
  });

  it('keeps pro when no period end is recorded yet (fresh checkout)', () => {
    expect(resolveEffectivePlan({ plan: 'pro' }, NOW)).toBe('pro');
    expect(resolveEffectivePlan({ plan: 'pro', current_period_end: null }, NOW)).toBe('pro');
  });

  it('fails open on an unparseable date rather than locking a payer out', () => {
    expect(resolveEffectivePlan({ plan: 'pro', current_period_end: 'not-a-date' }, NOW)).toBe(
      'pro',
    );
  });

  it('is exact at the grace boundary', () => {
    // Exactly at end + grace is still allowed; one millisecond later is not.
    const boundary = new Date(NOW.getTime() - PLAN_GRACE_DAYS * DAY).toISOString();
    expect(resolveEffectivePlan({ plan: 'pro', current_period_end: boundary }, NOW)).toBe('pro');
    const justPast = new Date(NOW.getTime() - PLAN_GRACE_DAYS * DAY - 1).toISOString();
    expect(resolveEffectivePlan({ plan: 'pro', current_period_end: justPast }, NOW)).toBe('free');
  });
});

describe('hasPaidAccess', () => {
  it('is true for a valid pro and for lifetime', () => {
    expect(hasPaidAccess({ plan: 'pro', current_period_end: at(5) }, NOW)).toBe(true);
    expect(hasPaidAccess({ plan: 'lifetime' }, NOW)).toBe(true);
  });

  it('is false for an expired pro and for free', () => {
    expect(hasPaidAccess({ plan: 'pro', current_period_end: at(-30) }, NOW)).toBe(false);
    expect(hasPaidAccess({ plan: 'free' }, NOW)).toBe(false);
    expect(hasPaidAccess(null, NOW)).toBe(false);
  });
});
