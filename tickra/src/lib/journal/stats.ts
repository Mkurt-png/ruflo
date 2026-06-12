// Pure stats over a list of trades — no I/O, fully unit-testable.
// Open trades (closed_at === null) are ignored unless noted.

import type { TradeRow } from '@/lib/db/journal-queries';

export type JournalStats = {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  wins: number;
  losses: number;
  breakEven: number;
  winRate: number; // 0..1
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number; // avgWin*winRate - avgLoss*(1-winRate), signed
  avgR: number; // average risk_r (R-multiple) on closed trades that have it
  bestTrade: number; // max pnl (any closed)
  worstTrade: number; // min pnl
  longestWinStreak: number;
  longestLossStreak: number;
};

export type EquityPoint = { x: number; y: number; tradeId: string; closedAt: string };

export function computeStats(trades: TradeRow[]): JournalStats {
  const closed = trades.filter((t) => t.closed_at !== null && t.pnl !== null);
  const open = trades.filter((t) => t.closed_at === null);

  const pnls = closed.map((t) => Number(t.pnl ?? 0));
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const breakEven = pnls.filter((p) => p === 0).length;
  const totalPnl = pnls.reduce((a, b) => a + b, 0);
  const avgWin = wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0;
  const winRate = closed.length ? wins.length / closed.length : 0;
  const expectancy = avgWin * winRate - avgLoss * (1 - winRate);

  const rs = closed.map((t) => t.risk_r).filter((r): r is number => typeof r === 'number');
  const avgR = rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : 0;

  const sortedByCloseAsc = [...closed].sort((a, b) =>
    String(a.closed_at).localeCompare(String(b.closed_at)),
  );
  let curStreakWin = 0;
  let curStreakLoss = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  for (const t of sortedByCloseAsc) {
    const p = Number(t.pnl ?? 0);
    if (p > 0) {
      curStreakWin += 1;
      curStreakLoss = 0;
      longestWinStreak = Math.max(longestWinStreak, curStreakWin);
    } else if (p < 0) {
      curStreakLoss += 1;
      curStreakWin = 0;
      longestLossStreak = Math.max(longestLossStreak, curStreakLoss);
    } else {
      curStreakWin = 0;
      curStreakLoss = 0;
    }
  }

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    openTrades: open.length,
    wins: wins.length,
    losses: losses.length,
    breakEven,
    winRate,
    totalPnl,
    avgWin,
    avgLoss,
    expectancy,
    avgR,
    bestTrade: pnls.length ? Math.max(...pnls) : 0,
    worstTrade: pnls.length ? Math.min(...pnls) : 0,
    longestWinStreak,
    longestLossStreak,
  };
}

export function buildEquityCurve(trades: TradeRow[]): EquityPoint[] {
  const closed = trades
    .filter((t) => t.closed_at !== null && t.pnl !== null)
    .sort((a, b) => String(a.closed_at).localeCompare(String(b.closed_at)));
  let running = 0;
  return closed.map((t, i) => {
    running += Number(t.pnl ?? 0);
    return { x: i, y: running, tradeId: t.id, closedAt: String(t.closed_at) };
  });
}
