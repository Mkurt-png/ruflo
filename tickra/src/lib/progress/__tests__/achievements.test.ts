import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { deriveAchievements } from '../achievements';
import type { ProgressState } from '@/lib/progress/hook';

function state(completed: Record<string, number> = {}): ProgressState {
  return { completed, mistakes: {} };
}

describe('deriveAchievements', () => {
  it('returns every achievement locked for a fresh state, with stable ids', () => {
    const a = deriveAchievements(state());
    expect(a.length).toBeGreaterThanOrEqual(8);
    expect(a.every((x) => x.unlocked === false)).toBe(true);
    expect(a.map((x) => x.id)).toEqual([
      'first-lesson',
      'ten-lessons',
      'fifty-lessons',
      'foundations-complete',
      'risk-master',
      'streak-7',
      'streak-30',
      'tickra-diploma',
    ]);
  });

  it('unlocks first-lesson on the first completion and stamps it', () => {
    const ts = Date.parse('2026-06-01T10:00:00Z');
    const a = deriveAchievements(state({ x: ts }));
    const first = a.find((x) => x.id === 'first-lesson')!;
    expect(first.unlocked).toBe(true);
    expect(first.unlockedAt).toBe(ts);
  });

  it('unlocks the ten-lessons threshold only at ten completions', () => {
    const nine: Record<string, number> = {};
    for (let i = 0; i < 9; i++) nine[`l${i}`] = Date.now();
    expect(deriveAchievements(state(nine)).find((x) => x.id === 'ten-lessons')!.unlocked).toBe(false);
    nine['l9'] = Date.now();
    expect(deriveAchievements(state(nine)).find((x) => x.id === 'ten-lessons')!.unlocked).toBe(true);
  });
});

// Regression guard for a timezone bug in the streak logic: day keys are
// built from LOCAL date parts but isNextDay used to re-parse them as UTC,
// so for any zone behind UTC genuinely consecutive days were not seen as
// consecutive and streak-7 / streak-30 never unlocked. Pin a western zone
// so this suite fails if that bug ever returns.
describe('deriveAchievements streak (timezone-sensitive)', () => {
  const realTz = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = 'America/New_York';
  });
  afterAll(() => {
    if (realTz === undefined) delete process.env.TZ;
    else process.env.TZ = realTz;
  });

  const consecutiveDays = (n: number, startY = 2026, startM = 5, startD = 1) => {
    const completed: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      // Local noon on each consecutive day.
      completed[`l${i}`] = new Date(startY, startM, startD + i, 12, 0, 0).getTime();
    }
    return completed;
  };

  it('unlocks streak-7 for seven consecutive local days', () => {
    const a = deriveAchievements(state(consecutiveDays(7)));
    expect(a.find((x) => x.id === 'streak-7')!.unlocked).toBe(true);
  });

  it('does not unlock streak-7 when a day is missing', () => {
    const c = consecutiveDays(7);
    delete c['l3']; // break the run
    const a = deriveAchievements(state(c));
    expect(a.find((x) => x.id === 'streak-7')!.unlocked).toBe(false);
  });
});
