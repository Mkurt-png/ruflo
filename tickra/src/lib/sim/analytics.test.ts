import { describe, it, expect } from 'vitest';
import { computeAnalytics, equitySparkline, type AnalyticsTrade } from './analytics';

const trade = (pnl: number, rMultiple: number | null, closedAt: number): AnalyticsTrade => ({
  pnl,
  rMultiple,
  closedAt,
});

describe('computeAnalytics', () => {
  it('returns a zeroed result for no trades', () => {
    const a = computeAnalytics([], 10_000);
    expect(a.trades).toBe(0);
    expect(a.netPnl).toBe(0);
    expect(a.winRate).toBe(0);
    expect(a.profitFactor).toBeNull();
    expect(a.avgR).toBeNull();
    expect(a.bestTrade).toBe(0);
    expect(a.worstTrade).toBe(0);
    expect(a.equityCurve).toEqual([10_000]);
  });

  it('counts wins, losses and breakevens', () => {
    const a = computeAnalytics([
      trade(100, 1, 1),
      trade(-50, -1, 2),
      trade(0, 0, 3),
      trade(200, 2, 4),
    ]);
    expect(a.trades).toBe(4);
    expect(a.wins).toBe(2);
    expect(a.losses).toBe(1);
    expect(a.breakeven).toBe(1);
    expect(a.winRate).toBe(50); // 2 of 4
    expect(a.netPnl).toBe(250);
  });

  it('computes profit factor and expectancy', () => {
    const a = computeAnalytics([trade(300, null, 1), trade(-100, null, 2)]);
    expect(a.grossProfit).toBe(300);
    expect(a.grossLoss).toBe(-100);
    expect(a.profitFactor).toBe(3); // 300 / 100
    expect(a.expectancy).toBe(100); // 200 / 2
    expect(a.avgWin).toBe(300);
    expect(a.avgLoss).toBe(-100);
  });

  it('returns null profit factor when there are no losses', () => {
    const a = computeAnalytics([trade(100, 1, 1), trade(50, 0.5, 2)]);
    expect(a.profitFactor).toBeNull();
  });

  it('averages only trades that have an R multiple', () => {
    const a = computeAnalytics([trade(100, 2, 1), trade(-100, -1, 2), trade(50, null, 3)]);
    expect(a.avgR).toBeCloseTo(0.5); // (2 + -1) / 2, the null is ignored
  });

  it('tracks best, worst and streaks', () => {
    const a = computeAnalytics([
      trade(10, null, 1),
      trade(20, null, 2),
      trade(30, null, 3), // 3-win streak
      trade(-5, null, 4),
      trade(-5, null, 5), // 2-loss streak
      trade(40, null, 6),
    ]);
    expect(a.bestTrade).toBe(40);
    expect(a.worstTrade).toBe(-5);
    expect(a.maxWinStreak).toBe(3);
    expect(a.maxLossStreak).toBe(2);
  });

  it('orders by closedAt before building the equity curve', () => {
    // Supplied out of order — must be sorted internally.
    const a = computeAnalytics(
      [trade(50, null, 3), trade(-30, null, 1), trade(20, null, 2)],
      1000,
    );
    expect(a.equityCurve).toEqual([1000, 970, 990, 1040]);
    expect(a.netPnl).toBe(40);
  });

  it('computes max drawdown from the peak', () => {
    // Equity: 1000 → 1100 (peak) → 900 → 1000. Worst drop = 200 (18.18%).
    const a = computeAnalytics(
      [trade(100, null, 1), trade(-200, null, 2), trade(100, null, 3)],
      1000,
    );
    expect(a.maxDrawdown).toBe(200);
    expect(a.maxDrawdownPct).toBeCloseTo((200 / 1100) * 100, 5);
  });
});

describe('equitySparkline', () => {
  it('returns empty string for fewer than two points', () => {
    expect(equitySparkline([], 100, 50)).toBe('');
    expect(equitySparkline([5], 100, 50)).toBe('');
  });

  it('produces one coordinate pair per point within the box', () => {
    const pts = equitySparkline([0, 10, 5], 100, 50, 2).split(' ');
    expect(pts).toHaveLength(3);
    for (const p of pts) {
      const [x, y] = p.split(',').map(Number);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(50);
    }
  });

  it('maps the maximum value to the top of the box', () => {
    // y for the max should be the padding (top), y for the min the bottom.
    const pts = equitySparkline([0, 10], 100, 50, 2).split(' ');
    const ys = pts.map((p) => Number(p.split(',')[1]));
    expect(Math.min(...ys)).toBeCloseTo(2); // top = pad
    expect(Math.max(...ys)).toBeCloseTo(48); // bottom = height - pad
  });
});
