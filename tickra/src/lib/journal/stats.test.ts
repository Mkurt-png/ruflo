import { describe, it, expect } from 'vitest';
import { computeStats } from './stats';
import type { TradeRow } from '@/lib/db/journal-queries';

let seq = 0;
function trade(partial: Partial<TradeRow>): TradeRow {
  seq += 1;
  return {
    id: `t${seq}`,
    email: 'u@example.com',
    pair: 'EURUSD',
    side: 'long',
    entry_price: 1,
    exit_price: 1,
    size: 1,
    stop_loss: null,
    take_profit: null,
    risk_r: null,
    pnl: null,
    notes: null,
    screenshot_url: null,
    opened_at: '2026-01-01T00:00:00.000Z',
    closed_at: '2026-01-01T01:00:00.000Z',
    created_at: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('computeStats', () => {
  it('returns zeros for an empty list', () => {
    const s = computeStats([]);
    expect(s.totalTrades).toBe(0);
    expect(s.closedTrades).toBe(0);
    expect(s.winRate).toBe(0);
    expect(s.totalPnl).toBe(0);
    expect(s.expectancy).toBe(0);
  });

  it('separates open from closed trades', () => {
    const s = computeStats([
      trade({ pnl: 100, closed_at: '2026-01-02T00:00:00Z' }),
      trade({ pnl: null, closed_at: null }), // open
    ]);
    expect(s.totalTrades).toBe(2);
    expect(s.closedTrades).toBe(1);
    expect(s.openTrades).toBe(1);
  });

  it('computes win rate, totals and averages', () => {
    const s = computeStats([
      trade({ pnl: 200, closed_at: '2026-01-02T00:00:00Z' }),
      trade({ pnl: 100, closed_at: '2026-01-03T00:00:00Z' }),
      trade({ pnl: -50, closed_at: '2026-01-04T00:00:00Z' }),
    ]);
    expect(s.wins).toBe(2);
    expect(s.losses).toBe(1);
    expect(s.winRate).toBeCloseTo(2 / 3);
    expect(s.totalPnl).toBe(250);
    expect(s.avgWin).toBe(150);
    expect(s.avgLoss).toBe(50); // stored as a positive magnitude
    // expectancy = avgWin*winRate - avgLoss*(1-winRate)
    expect(s.expectancy).toBeCloseTo(150 * (2 / 3) - 50 * (1 / 3));
  });

  it('tracks best, worst and streaks in close order', () => {
    const s = computeStats([
      trade({ pnl: 10, closed_at: '2026-01-01T00:00:00Z' }),
      trade({ pnl: 20, closed_at: '2026-01-02T00:00:00Z' }),
      trade({ pnl: -5, closed_at: '2026-01-03T00:00:00Z' }),
      trade({ pnl: -8, closed_at: '2026-01-04T00:00:00Z' }),
      trade({ pnl: -1, closed_at: '2026-01-05T00:00:00Z' }),
      trade({ pnl: 99, closed_at: '2026-01-06T00:00:00Z' }),
    ]);
    expect(s.bestTrade).toBe(99);
    expect(s.worstTrade).toBe(-8);
    expect(s.longestWinStreak).toBe(2);
    expect(s.longestLossStreak).toBe(3);
  });

  it('averages risk_r only over trades that carry it', () => {
    const s = computeStats([
      trade({ pnl: 100, risk_r: 2, closed_at: '2026-01-02T00:00:00Z' }),
      trade({ pnl: -50, risk_r: -1, closed_at: '2026-01-03T00:00:00Z' }),
      trade({ pnl: 10, risk_r: null, closed_at: '2026-01-04T00:00:00Z' }),
    ]);
    expect(s.avgR).toBeCloseTo(0.5); // (2 + -1) / 2
  });

  it('counts break-even trades separately', () => {
    const s = computeStats([
      trade({ pnl: 0, closed_at: '2026-01-02T00:00:00Z' }),
      trade({ pnl: 50, closed_at: '2026-01-03T00:00:00Z' }),
    ]);
    expect(s.breakEven).toBe(1);
    expect(s.wins).toBe(1);
    expect(s.losses).toBe(0);
  });
});
