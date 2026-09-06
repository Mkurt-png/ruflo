import { describe, it, expect } from 'vitest';
import { runMonteCarlo, type MonteCarloParams } from './monte-carlo';

const base: MonteCarloParams = {
  winRate: 0.5,
  rewardR: 2,
  lossR: 1,
  riskPerTrade: 0.01,
  trades: 100,
  runs: 500,
  seed: 42,
};

describe('runMonteCarlo', () => {
  it('is deterministic for a given seed', () => {
    const a = runMonteCarlo(base);
    const b = runMonteCarlo(base);
    expect(a.riskOfRuin).toBe(b.riskOfRuin);
    expect(a.median).toBe(b.median);
    expect(a.p5).toBe(b.p5);
    expect(a.p95).toBe(b.p95);
  });

  it('produces different distributions for different seeds', () => {
    const a = runMonteCarlo({ ...base, seed: 1 });
    const b = runMonteCarlo({ ...base, seed: 2 });
    // Vanishingly unlikely to match across every statistic by chance.
    expect(a.median === b.median && a.p5 === b.p5 && a.p95 === b.p95).toBe(false);
  });

  it('reports zero risk of ruin when every trade wins', () => {
    const r = runMonteCarlo({ ...base, winRate: 1 });
    expect(r.riskOfRuin).toBe(0);
    expect(r.profitable).toBe(1);
    expect(r.median).toBeGreaterThan(1);
  });

  it('reports very high risk of ruin when every trade loses', () => {
    // Losing 1% of a shrinking equity never quite reaches zero, but with a
    // big enough risk fraction the 50% drawdown floor is breached every run.
    const r = runMonteCarlo({ ...base, winRate: 0, riskPerTrade: 0.05 });
    expect(r.riskOfRuin).toBe(1);
    expect(r.profitable).toBe(0);
    expect(r.median).toBeLessThan(1);
  });

  it('keeps percentiles ordered p5 <= median <= p95', () => {
    const r = runMonteCarlo(base);
    expect(r.p5).toBeLessThanOrEqual(r.median);
    expect(r.median).toBeLessThanOrEqual(r.p95);
  });

  it('exposes at most five sample curves that start at 1', () => {
    const r = runMonteCarlo(base);
    expect(r.sampleCurves.length).toBeGreaterThan(0);
    expect(r.sampleCurves.length).toBeLessThanOrEqual(5);
    for (const c of r.sampleCurves) {
      expect(c[0]).toBe(1);
      expect(c).toHaveLength(base.trades + 1);
    }
  });

  it('handles the zero-runs edge case without dividing by zero', () => {
    const r = runMonteCarlo({ ...base, runs: 0 });
    expect(r.riskOfRuin).toBe(0);
    expect(r.profitable).toBe(0);
    expect(Number.isNaN(r.mean)).toBe(false);
  });

  it('shows a positive-expectancy edge rarely ruins at sane risk', () => {
    // 50% win at 2:1 with 1% risk is a healthy edge — ruin should be rare.
    const r = runMonteCarlo(base);
    expect(r.riskOfRuin).toBeLessThan(0.1);
  });
});
