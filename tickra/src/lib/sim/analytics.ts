// TICKRA-PHASE-3: pure trading-performance analytics.
// Decoupled from the simulator UI and from the symbol table so it can be unit
// tested in isolation: callers pass already-computed pnl and (optional) R
// multiples. Every function is pure — no I/O, no Date.now(), deterministic.

export type AnalyticsTrade = {
  pnl: number;
  /** R multiple (pnl / risk). Null when the stop distance is unknown. */
  rMultiple: number | null;
  /** Unix ms — used only to order the equity curve. */
  closedAt: number;
};

export type SimAnalytics = {
  trades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number; // 0..100
  netPnl: number;
  grossProfit: number;
  grossLoss: number; // negative or zero
  /** grossProfit / |grossLoss|. Null when there are no losing trades. */
  profitFactor: number | null;
  /** Average pnl per trade. */
  expectancy: number;
  avgWin: number;
  avgLoss: number; // negative or zero
  /** Average R multiple across trades that have one. Null when none. */
  avgR: number | null;
  bestTrade: number;
  worstTrade: number;
  maxWinStreak: number;
  maxLossStreak: number;
  /** Largest peak-to-trough drop on the equity curve, as a positive number. */
  maxDrawdown: number;
  /** Same drop relative to the running peak, 0..100. */
  maxDrawdownPct: number;
  /** Cumulative equity oldest→newest, starting at `startBalance`. */
  equityCurve: number[];
};

export function computeAnalytics(
  trades: AnalyticsTrade[],
  startBalance = 0,
): SimAnalytics {
  const ordered = [...trades].sort((a, b) => a.closedAt - b.closedAt);
  const n = ordered.length;

  let wins = 0;
  let losses = 0;
  let breakeven = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let netPnl = 0;
  let bestTrade = n ? -Infinity : 0;
  let worstTrade = n ? Infinity : 0;

  let curWin = 0;
  let curLoss = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;

  const rValues: number[] = [];
  const equityCurve: number[] = [startBalance];
  let equity = startBalance;
  let peak = startBalance;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;

  for (const t of ordered) {
    const pnl = t.pnl;
    netPnl += pnl;
    if (pnl > 0) {
      wins += 1;
      grossProfit += pnl;
      curWin += 1;
      curLoss = 0;
    } else if (pnl < 0) {
      losses += 1;
      grossLoss += pnl;
      curLoss += 1;
      curWin = 0;
    } else {
      breakeven += 1;
      curWin = 0;
      curLoss = 0;
    }
    if (curWin > maxWinStreak) maxWinStreak = curWin;
    if (curLoss > maxLossStreak) maxLossStreak = curLoss;

    if (pnl > bestTrade) bestTrade = pnl;
    if (pnl < worstTrade) worstTrade = pnl;

    if (t.rMultiple !== null && Number.isFinite(t.rMultiple)) rValues.push(t.rMultiple);

    equity += pnl;
    equityCurve.push(equity);
    if (equity > peak) peak = equity;
    const drop = peak - equity;
    if (drop > maxDrawdown) {
      maxDrawdown = drop;
      maxDrawdownPct = peak > 0 ? (drop / peak) * 100 : 0;
    }
  }

  const winRate = n ? (wins / n) * 100 : 0;
  const profitFactor = grossLoss < 0 ? grossProfit / Math.abs(grossLoss) : null;
  const expectancy = n ? netPnl / n : 0;
  const avgWin = wins ? grossProfit / wins : 0;
  const avgLoss = losses ? grossLoss / losses : 0;
  const avgR = rValues.length
    ? rValues.reduce((a, b) => a + b, 0) / rValues.length
    : null;

  return {
    trades: n,
    wins,
    losses,
    breakeven,
    winRate,
    netPnl,
    grossProfit,
    grossLoss,
    profitFactor,
    expectancy,
    avgWin,
    avgLoss,
    avgR,
    bestTrade: n ? bestTrade : 0,
    worstTrade: n ? worstTrade : 0,
    maxWinStreak,
    maxLossStreak,
    maxDrawdown,
    maxDrawdownPct,
    equityCurve,
  };
}

/** Build an SVG polyline `points` string from an equity curve, normalised to
 * the given pixel box. Pure helper — handy for a sparkline and for tests. */
export function equitySparkline(
  curve: number[],
  width: number,
  height: number,
  pad = 2,
): string {
  if (curve.length < 2) return '';
  const min = Math.min(...curve);
  const max = Math.max(...curve);
  const span = max - min || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  return curve
    .map((v, i) => {
      const x = pad + (i / (curve.length - 1)) * innerW;
      const y = pad + innerH - ((v - min) / span) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}
