import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { currentDailyStreak } from '../useCote';

// Build a completion timestamp at local noon, `daysAgo` local days before NOW.
function localNoon(now: number, daysAgo: number): number {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.getTime();
}

function runIn(tz: string, fn: () => void) {
  describe(`timezone ${tz}`, () => {
    const real = process.env.TZ;
    beforeAll(() => {
      process.env.TZ = tz;
    });
    afterAll(() => {
      if (real === undefined) delete process.env.TZ;
      else process.env.TZ = real;
    });
    fn();
  });
}

// A Wednesday; the exact instant doesn't matter since we rebuild from local.
const NOW = Date.parse('2026-06-17T18:00:00Z');

for (const tz of ['UTC', 'Asia/Tokyo', 'America/New_York']) {
  runIn(tz, () => {
    it('counts consecutive local days ending today', () => {
      const completed = {
        a: localNoon(NOW, 0),
        b: localNoon(NOW, 1),
        c: localNoon(NOW, 2),
      };
      expect(currentDailyStreak(completed, NOW)).toBe(3);
    });

    it('is zero when today has no completion', () => {
      const completed = { a: localNoon(NOW, 1), b: localNoon(NOW, 2) };
      expect(currentDailyStreak(completed, NOW)).toBe(0);
    });

    it('stops at the first missing day', () => {
      const completed = {
        a: localNoon(NOW, 0),
        b: localNoon(NOW, 1),
        // gap at day 2
        d: localNoon(NOW, 3),
      };
      expect(currentDailyStreak(completed, NOW)).toBe(2);
    });

    it('treats two completions on the same local day as one streak day', () => {
      const d = new Date(NOW);
      d.setHours(9, 0, 0, 0);
      const morning = d.getTime();
      d.setHours(21, 0, 0, 0);
      const evening = d.getTime();
      expect(currentDailyStreak({ a: morning, b: evening }, NOW)).toBe(1);
    });
  });
}

describe('currentDailyStreak basics', () => {
  it('returns 0 for no completions', () => {
    expect(currentDailyStreak({}, NOW)).toBe(0);
  });
});
