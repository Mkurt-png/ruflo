import { describe, it, expect } from 'vitest';
import { projectGrowth } from './projection';

describe('projectGrowth', () => {
  it('stays flat at 0% with no deposits', () => {
    const r = projectGrowth({ start: 1000, monthlyReturnPct: 0, months: 12 });
    expect(r.final).toBe(1000);
    expect(r.profit).toBe(0);
    expect(r.multiple).toBe(1);
    expect(r.curve).toHaveLength(13);
    expect(new Set(r.curve)).toEqual(new Set([1000]));
  });

  it('compounds a positive monthly return', () => {
    const r = projectGrowth({ start: 1000, monthlyReturnPct: 10, months: 12 });
    expect(r.final).toBeCloseTo(1000 * 1.1 ** 12, 4);
    expect(r.multiple).toBeCloseTo(1.1 ** 12, 6);
    expect(r.profit).toBeCloseTo(1000 * 1.1 ** 12 - 1000, 4);
  });

  it('accounts for recurring deposits in totalDeposited and profit', () => {
    const r = projectGrowth({ start: 1000, monthlyReturnPct: 0, months: 10, monthlyDeposit: 100 });
    expect(r.totalDeposited).toBe(2000); // 1000 + 100*10
    expect(r.final).toBe(2000); // 0% return → just the deposits
    expect(r.profit).toBe(0);
  });

  it('attributes only market gains to profit, not deposits', () => {
    const r = projectGrowth({ start: 1000, monthlyReturnPct: 5, months: 6, monthlyDeposit: 50 });
    expect(r.totalDeposited).toBe(1000 + 50 * 6);
    expect(r.profit).toBeCloseTo(r.final - r.totalDeposited, 6);
    expect(r.final).toBeGreaterThan(r.totalDeposited); // positive return
  });

  it('shrinks on a negative return', () => {
    const r = projectGrowth({ start: 1000, monthlyReturnPct: -10, months: 5 });
    expect(r.final).toBeLessThan(1000);
    expect(r.final).toBeCloseTo(1000 * 0.9 ** 5, 4);
  });

  it('produces a curve that starts at the initial balance', () => {
    const r = projectGrowth({ start: 5000, monthlyReturnPct: 3, months: 24 });
    expect(r.curve[0]).toBe(5000);
    expect(r.curve).toHaveLength(25);
    expect(r.curve[r.curve.length - 1]).toBeCloseTo(r.final, 6);
  });

  it('handles zero months', () => {
    const r = projectGrowth({ start: 1000, monthlyReturnPct: 10, months: 0 });
    expect(r.curve).toEqual([1000]);
    expect(r.final).toBe(1000);
  });
});
