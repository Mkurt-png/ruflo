import { describe, it, expect } from 'vitest';
import { computeCote, type CoteInput } from '../cote';

const NOW = Date.parse('2026-06-15T12:00:00Z');
const DAY = 86_400_000;

function input(over: Partial<CoteInput> = {}): CoteInput {
  return {
    completed: {},
    mistakes: {},
    streakDays: 0,
    journalCount: 0,
    now: NOW,
    ...over,
  };
}

describe('computeCote', () => {
  it('gives a brand-new user a baseline of 15 (full review credit, nothing else)', () => {
    const c = computeCote(input());
    expect(c.parts.regularite).toBe(0);
    expect(c.parts.precision).toBe(0);
    expect(c.parts.honnete).toBe(0);
    expect(c.parts.revision).toBe(15); // no mistakes => full credit
    expect(c.score).toBe(15);
  });

  it('is deterministic for a fixed now', () => {
    const a = computeCote(input({ streakDays: 9, journalCount: 4 }));
    const b = computeCote(input({ streakDays: 9, journalCount: 4 }));
    expect(a).toEqual(b);
  });

  it('keeps the score within 0..100 and each part within its cap', () => {
    const completed: Record<string, number> = {};
    for (let i = 0; i < 200; i++) completed[`l${i}`] = NOW - DAY;
    const c = computeCote(
      input({ completed, streakDays: 10_000, journalCount: 10_000 }),
    );
    expect(c.score).toBeGreaterThanOrEqual(0);
    expect(c.score).toBeLessThanOrEqual(100);
    expect(c.parts.regularite).toBeLessThanOrEqual(35);
    expect(c.parts.precision).toBeLessThanOrEqual(30);
    expect(c.parts.honnete).toBeLessThanOrEqual(20);
    expect(c.parts.revision).toBeLessThanOrEqual(15);
    // Saturated inputs approach the ceiling.
    expect(c.score).toBeGreaterThan(95);
  });

  it('rewards a longer streak with more régularité', () => {
    const low = computeCote(input({ streakDays: 3 })).parts.regularite;
    const high = computeCote(input({ streakDays: 30 })).parts.regularite;
    expect(high).toBeGreaterThan(low);
  });

  it('penalises précision when lessons carry mistakes', () => {
    const completed = { a: NOW - DAY, b: NOW - DAY, c: NOW - DAY, d: NOW - DAY };
    const clean = computeCote(input({ completed })).parts.precision;
    const withErrors = computeCote(
      input({ completed, mistakes: { a: { loggedAt: NOW - DAY } } }),
    ).parts.precision;
    expect(withErrors).toBeLessThan(clean);
  });

  it('drops révision when a mistake goes stale (>7d, never reviewed)', () => {
    const stale = computeCote(
      input({ mistakes: { a: { loggedAt: NOW - 10 * DAY } } }),
    ).parts.revision;
    const reviewed = computeCote(
      input({ mistakes: { a: { loggedAt: NOW - 10 * DAY, reviewedAt: NOW - DAY } } }),
    ).parts.revision;
    expect(stale).toBeLessThan(15);
    expect(reviewed).toBe(15);
  });

  it('returns a 30-point trail of finite, in-range values', () => {
    const c = computeCote(input({ streakDays: 12, journalCount: 5 }));
    expect(c.trail).toHaveLength(30);
    for (const p of c.trail) {
      expect(Number.isFinite(p)).toBe(true);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    }
  });

  it('reports delta as the rounded change between the last two trail days', () => {
    const c = computeCote(input({ streakDays: 12, journalCount: 5 }));
    const expected = Math.round((c.trail[29] - c.trail[28]) * 10) / 10;
    expect(c.delta).toBe(expected);
  });
});
