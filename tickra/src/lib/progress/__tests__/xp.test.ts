import { describe, it, expect } from 'vitest';
import { deriveLevel } from '../xp';

// Level curve (from xp.ts): xpForLevel = 100*level for L1-5, then 500 + (level-5)*150.
// Cumulative thresholds: L1 @100, L2 @300, L3 @600, L4 @1000, L5 @1500, L6 @2150, ...
describe('deriveLevel', () => {
  it('starts at level 0 with no XP', () => {
    const r = deriveLevel(0);
    expect(r.level).toBe(0);
    expect(r.intoLevel).toBe(0);
    expect(r.needed).toBe(100); // XP to reach level 1
    expect(r.pct).toBe(0);
  });

  it('reaches level 1 exactly at 100 XP', () => {
    const r = deriveLevel(100);
    expect(r.level).toBe(1);
    expect(r.intoLevel).toBe(0);
    expect(r.pct).toBe(0);
  });

  it('reports progress within a level', () => {
    // 150 XP = level 1 (100 spent) + 50 into the 200 needed for level 2
    const r = deriveLevel(150);
    expect(r.level).toBe(1);
    expect(r.intoLevel).toBe(50);
    expect(r.needed).toBe(200);
    expect(r.pct).toBe(25);
  });

  it('crosses the L5->L6 curve change correctly', () => {
    // Cumulative to L5 = 100+200+300+400+500 = 1500. L6 needs 650 more.
    const atL5 = deriveLevel(1500);
    expect(atL5.level).toBe(5);
    expect(atL5.needed).toBe(650); // 500 + (6-5)*150
    const midL5 = deriveLevel(1500 + 325);
    expect(midL5.level).toBe(5);
    expect(midL5.pct).toBe(50);
  });

  it('keeps pct within 0..100 for any total', () => {
    for (const total of [0, 1, 99, 100, 1499, 1500, 5000, 99999]) {
      const { pct } = deriveLevel(total);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  it('is monotonic in level as XP grows', () => {
    let prev = -1;
    for (const total of [0, 100, 300, 600, 1000, 1500, 2150, 4000]) {
      const { level } = deriveLevel(total);
      expect(level).toBeGreaterThanOrEqual(prev);
      prev = level;
    }
  });
});
