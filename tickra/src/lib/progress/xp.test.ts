import { describe, it, expect } from 'vitest';
import { deriveLevel } from './xp';

describe('deriveLevel', () => {
  it('starts at level 0 with no XP', () => {
    const d = deriveLevel(0);
    expect(d.level).toBe(0);
    expect(d.intoLevel).toBe(0);
    expect(d.needed).toBe(100); // xpForLevel(1)
    expect(d.pct).toBe(0);
  });

  it('reaches level 1 at exactly 100 XP', () => {
    expect(deriveLevel(99).level).toBe(0);
    expect(deriveLevel(100).level).toBe(1);
  });

  it('follows the 100×level curve for the first five levels', () => {
    // Cumulative thresholds: L1=100, L2=300, L3=600, L4=1000, L5=1500.
    expect(deriveLevel(100).level).toBe(1);
    expect(deriveLevel(300).level).toBe(2);
    expect(deriveLevel(600).level).toBe(3);
    expect(deriveLevel(1000).level).toBe(4);
    expect(deriveLevel(1500).level).toBe(5);
  });

  it('switches to +150 XP per level after level 5', () => {
    // L6 needs 650 more (xpForLevel(6) = 500 + 150). 1500 + 650 = 2150.
    expect(deriveLevel(2149).level).toBe(5);
    expect(deriveLevel(2150).level).toBe(6);
  });

  it('reports progress within the current level', () => {
    const d = deriveLevel(150); // level 1 (cumulative 100), 50 into level 2 (needs 200)
    expect(d.level).toBe(1);
    expect(d.intoLevel).toBe(50);
    expect(d.needed).toBe(200);
    expect(d.pct).toBe(25);
  });

  it('never reports more than 100%', () => {
    for (const xp of [0, 50, 250, 999, 5000, 100000]) {
      expect(deriveLevel(xp).pct).toBeLessThanOrEqual(100);
      expect(deriveLevel(xp).pct).toBeGreaterThanOrEqual(0);
    }
  });
});
