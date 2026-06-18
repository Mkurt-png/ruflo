import { describe, it, expect } from 'vitest';
import { computeStats, buildEquityCurve } from '../stats';
import type { TradeRow } from '@/lib/db/journal-queries';

// Minimal valid TradeRow fixture; override only the fields a test cares about.
function trade(over: Partial<TradeRow>): TradeRow {
  return {
    id: over.id ?? 'id',
    email: 'a@b.c',
    pair: 'EURUSD',
    side: 'long',
    entry_price: 1,
    exit_price: null,
    size: 1,
    stop_loss: null,
    take_profit: null,
    risk_r: null,
    pnl: null,
    notes: null,
    screenshot_url: null,
    opened_at: '2026-01-01T00:00:00Z',
    closed_at: null,
    created_at: '2026-01-01T00:00:00Z',
    ...over,
  };
}

const closed = (id: string, pnl: number, closedAt: string, risk_r: number | null = null) =>
  trade({ id, pnl, risk_r, closed_at: closedAt });

describe('computeStats', () => {
  it('returns zeroed stats for no trades', () => {
    const s = computeStats([]);
    expect(s.totalTrades).toBe(0);
    expect(s.closedTrades).toBe(0);
    expect(s.winRate).toBe(0);
    expect(s.expectancy).toBe(0);
    expect(s.bestTrade).toBe(0);
    expect(s.worstTrade).toBe(0);
  });

  it('excludes open trades from closed aggregates but counts them in totals', () => {
    const s = computeStats([
      closed('a', 100, '2026-01-02T00:00:00Z'),
      trade({ id: 'open', pnl: null, closed_at: null }),
    ]);
    expect(s.totalTrades).toBe(2);
    expect(s.closedTrades).toBe(1);
    expect(s.openTrades).toBe(1);
    expect(s.totalPnl).toBe(100);
  });

  it('computes win rate, totals and averages over a mixed book', () => {
    const s = computeStats([
      closed('a', 200, '2026-01-01T00:00:00Z'),
      closed('b', 100, '2026-01-02T00:00:00Z'),
      closed('c', -100, '2026-01-03T00:00:00Z'),
      closed('d', 0, '2026-01-04T00:00:00Z'),
    ]);
    expect(s.wins).toBe(2);
    expect(s.losses).toBe(1);
    expect(s.breakEven).toBe(1);
    expect(s.winRate).toBeCloseTo(2 / 4);
    expect(s.totalPnl).toBe(200);
    expect(s.avgWin).toBe(150); // (200+100)/2
    expect(s.avgLoss).toBe(100); // |−100|/1
    expect(s.bestTrade).toBe(200);
    expect(s.worstTrade).toBe(-100);
    // expectancy = avgWin*winRate − avgLoss*(1−winRate) = 150*.5 − 100*.5
    expect(s.expectancy).toBeCloseTo(25);
  });

  it('averages risk_r only over trades that carry it', () => {
    const s = computeStats([
      closed('a', 100, '2026-01-01T00:00:00Z', 2),
      closed('b', -50, '2026-01-02T00:00:00Z', -1),
      closed('c', 10, '2026-01-03T00:00:00Z', null),
    ]);
    expect(s.avgR).toBeCloseTo((2 + -1) / 2); // null excluded
  });

  it('tracks longest win and loss streaks in chronological order', () => {
    // W W L L L W — regardless of input order
    const s = computeStats([
      closed('6', 5, '2026-01-06T00:00:00Z'),
      closed('1', 5, '2026-01-01T00:00:00Z'),
      closed('5', -5, '2026-01-05T00:00:00Z'),
      closed('2', 5, '2026-01-02T00:00:00Z'),
      closed('4', -5, '2026-01-04T00:00:00Z'),
      closed('3', -5, '2026-01-03T00:00:00Z'),
    ]);
    expect(s.longestWinStreak).toBe(2);
    expect(s.longestLossStreak).toBe(3);
  });

  it('resets streaks on a break-even trade', () => {
    const s = computeStats([
      closed('1', 5, '2026-01-01T00:00:00Z'),
      closed('2', 0, '2026-01-02T00:00:00Z'),
      closed('3', 5, '2026-01-03T00:00:00Z'),
    ]);
    expect(s.longestWinStreak).toBe(1);
  });
});

describe('buildEquityCurve', () => {
  it('is empty when there are no closed trades', () => {
    expect(buildEquityCurve([trade({ id: 'o', closed_at: null })])).toEqual([]);
  });

  it('accumulates pnl in close-date order with sequential x', () => {
    const curve = buildEquityCurve([
      closed('c', 50, '2026-01-03T00:00:00Z'),
      closed('a', 100, '2026-01-01T00:00:00Z'),
      closed('b', -30, '2026-01-02T00:00:00Z'),
    ]);
    expect(curve.map((p) => p.tradeId)).toEqual(['a', 'b', 'c']);
    expect(curve.map((p) => p.x)).toEqual([0, 1, 2]);
    expect(curve.map((p) => p.y)).toEqual([100, 70, 120]); // running sum
  });
});
