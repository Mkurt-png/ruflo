// TICKRA-PHASE-3: the "math of losses" — two asymmetries every risk lesson
// hammers home, made computable. Pure and deterministic.
//
//  1. Recovery gain: after a drawdown of d%, the gain needed to get back to
//     break-even is d / (100 - d). A 50% loss needs a 100% gain.
//  2. Break-even win rate: with a reward:risk of R (loss = 1R), the minimum
//     win rate to not lose money is 1 / (1 + R).

/** Gain (%) required to recover from a drawdown of `drawdownPct` (0..100).
 *  Returns Infinity at or beyond a total (100%) loss. */
export function recoveryGainPct(drawdownPct: number): number {
  const d = Math.max(0, drawdownPct);
  if (d >= 100) return Infinity;
  return (d / (100 - d)) * 100;
}

/** Minimum win rate (%) to break even given a reward:risk multiple.
 *  rewardR is the win size in R; lossR is the loss size in R (default 1). */
export function breakevenWinRatePct(rewardR: number, lossR = 1): number {
  const r = Math.max(0, rewardR);
  const l = Math.max(0, lossR);
  const denom = r + l;
  if (denom === 0) return 0;
  return (l / denom) * 100;
}

/** Expectancy in R for a given win rate (%) and reward:risk. Positive means a
 *  long-run edge. */
export function expectancyR(winRatePct: number, rewardR: number, lossR = 1): number {
  const p = Math.min(1, Math.max(0, winRatePct / 100));
  return p * rewardR - (1 - p) * lossR;
}

export type RecoveryRow = { drawdown: number; recovery: number };

/** A table of drawdown → recovery for display. */
export function recoveryTable(
  drawdowns: number[] = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90],
): RecoveryRow[] {
  return drawdowns.map((d) => ({ drawdown: d, recovery: recoveryGainPct(d) }));
}
