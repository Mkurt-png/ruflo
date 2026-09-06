import { describe, it, expect } from 'vitest';
import { computeCote, type CoteInput } from './cote';

const NOW = Date.UTC(2026, 5, 15, 12, 0, 0);
const DAY = 86_400_000;

const empty: CoteInput = {
  completed: {},
  mistakes: {},
  streakDays: 0,
  journalCount: 0,
  now: NOW,
};

describe('computeCote', () => {
  it('gives full revision credit when there is nothing to review', () => {
    const out = computeCote(empty);
    // regularite 0 + precision 0 + honnete 0 + revision 15 = 15
    expect(out.parts.revision).toBeCloseTo(15);
    expect(out.score).toBeCloseTo(15);
  });

  it('keeps the score within 0..100', () => {
    const completed: Record<string, number> = {};
    for (let i = 0; i < 100; i++) completed[`l${i}`] = NOW - i * DAY;
    const out = computeCote({
      completed,
      mistakes: {},
      streakDays: 500,
      journalCount: 200,
      now: NOW,
    });
    expect(out.score).toBeGreaterThan(0);
    expect(out.score).toBeLessThanOrEqual(100);
  });

  it('rewards a longer streak with a higher regularity component', () => {
    const low = computeCote({ ...empty, streakDays: 3 });
    const high = computeCote({ ...empty, streakDays: 40 });
    expect(high.parts.regularite).toBeGreaterThan(low.parts.regularite);
  });

  it('penalises stale, unreviewed mistakes in the revision component', () => {
    const fresh = computeCote({
      ...empty,
      completed: { a: NOW },
      mistakes: { m1: { loggedAt: NOW - 1 * DAY } }, // fresh (<7d)
    });
    const stale = computeCote({
      ...empty,
      completed: { a: NOW },
      mistakes: { m1: { loggedAt: NOW - 30 * DAY } }, // stale, never reviewed
    });
    expect(stale.parts.revision).toBeLessThan(fresh.parts.revision);
  });

  it('reports the score with at most one decimal place', () => {
    const out = computeCote({ ...empty, streakDays: 9, journalCount: 4 });
    expect(out.score).toBe(Math.round(out.score * 10) / 10);
  });

  it('returns a 30-point trail', () => {
    const out = computeCote({ ...empty, streakDays: 10, journalCount: 3 });
    expect(out.trail).toHaveLength(30);
    for (const v of out.trail) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it('keeps every component within its cap', () => {
    const completed: Record<string, number> = {};
    for (let i = 0; i < 50; i++) completed[`l${i}`] = NOW - i * DAY;
    const out = computeCote({
      completed,
      mistakes: {},
      streakDays: 100,
      journalCount: 50,
      now: NOW,
    });
    expect(out.parts.regularite).toBeLessThanOrEqual(35);
    expect(out.parts.precision).toBeLessThanOrEqual(30);
    expect(out.parts.honnete).toBeLessThanOrEqual(20);
    expect(out.parts.revision).toBeLessThanOrEqual(15);
  });
});
