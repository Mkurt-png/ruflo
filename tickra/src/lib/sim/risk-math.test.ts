import { describe, it, expect } from 'vitest';
import {
  recoveryGainPct,
  breakevenWinRatePct,
  expectancyR,
  recoveryTable,
} from './risk-math';

describe('recoveryGainPct', () => {
  it('needs no gain for no drawdown', () => {
    expect(recoveryGainPct(0)).toBe(0);
  });

  it('captures the classic asymmetry (50% loss → 100% gain)', () => {
    expect(recoveryGainPct(50)).toBeCloseTo(100);
  });

  it('grows faster than linearly', () => {
    expect(recoveryGainPct(10)).toBeCloseTo((10 / 90) * 100);
    expect(recoveryGainPct(90)).toBeCloseTo(900);
  });

  it('returns Infinity at or beyond a total loss', () => {
    expect(recoveryGainPct(100)).toBe(Infinity);
    expect(recoveryGainPct(120)).toBe(Infinity);
  });
});

describe('breakevenWinRatePct', () => {
  it('is 50% at 1:1', () => {
    expect(breakevenWinRatePct(1)).toBeCloseTo(50);
  });

  it('is ~33.3% at 2:1', () => {
    expect(breakevenWinRatePct(2)).toBeCloseTo(100 / 3);
  });

  it('is 25% at 3:1', () => {
    expect(breakevenWinRatePct(3)).toBeCloseTo(25);
  });

  it('handles a zero denominator gracefully', () => {
    expect(breakevenWinRatePct(0, 0)).toBe(0);
  });
});

describe('expectancyR', () => {
  it('is zero exactly at the break-even win rate', () => {
    const be = breakevenWinRatePct(2); // 33.3%
    expect(expectancyR(be, 2)).toBeCloseTo(0, 5);
  });

  it('is positive above the break-even win rate', () => {
    expect(expectancyR(50, 2)).toBeGreaterThan(0);
  });

  it('is negative below the break-even win rate', () => {
    expect(expectancyR(20, 2)).toBeLessThan(0);
  });

  it('clamps win rate into [0,100]', () => {
    expect(expectancyR(150, 2)).toBeCloseTo(2); // 100% wins → +2R
    expect(expectancyR(-50, 2)).toBeCloseTo(-1); // 0% wins → -1R
  });
});

describe('recoveryTable', () => {
  it('returns a row per requested drawdown, in order', () => {
    const t = recoveryTable([10, 50]);
    expect(t).toEqual([
      { drawdown: 10, recovery: recoveryGainPct(10) },
      { drawdown: 50, recovery: recoveryGainPct(50) },
    ]);
  });

  it('has a sensible default set', () => {
    expect(recoveryTable().length).toBeGreaterThan(5);
  });
});
