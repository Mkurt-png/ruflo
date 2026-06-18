// Le Calculateur de survie — pre-trade arithmetic, in the editorial
// register. Given an account, a risk percentage, an entry and a stop,
// computes: position size, R-multiple to break even, and how many
// consecutive losses you survive before the account is halved or
// reduced to a tenth.
//
// Pure functions. No network. Nothing stored. The numbers are honest:
// no leverage hand-waving, no fee fantasies.

export type SurvieInput = {
  /** Account size in account currency (USD by convention). */
  account: number;
  /** Percentage of the account risked on this trade (0 < r ≤ 5). */
  riskPct: number;
  /** Entry price. */
  entry: number;
  /** Stop-loss price. */
  stop: number;
  /** Optional take-profit price for R-multiple read. */
  takeProfit?: number;
};

export type SurvieOutput = {
  /** Risk in account currency on this trade. */
  riskAmount: number;
  /** Distance from entry to stop, in price units. */
  stopDistance: number;
  /** Position size (units of the traded pair). */
  positionSize: number;
  /** R-multiple of the planned take-profit, or null if none given. */
  plannedR: number | null;
  /** Break-even win-rate (%) given the planned R. */
  breakEvenWinRate: number | null;
  /** Consecutive losing trades that halve the account. */
  lossesToHalve: number;
  /** Consecutive losing trades that reduce the account to a tenth. */
  lossesToTenth: number;
  /** Honesty flags surfaced to the trader. */
  warnings: ('risk-high' | 'no-stop' | 'too-tight' | 'inverted')[];
};

const LN_HALF = Math.log(0.5);
const LN_TENTH = Math.log(0.1);

export function computeSurvie(input: SurvieInput): SurvieOutput | null {
  const { account, riskPct, entry, stop, takeProfit } = input;
  if (!Number.isFinite(account) || account <= 0) return null;
  if (!Number.isFinite(riskPct) || riskPct <= 0) return null;
  if (!Number.isFinite(entry) || entry <= 0) return null;
  if (!Number.isFinite(stop) || stop <= 0) return null;

  const stopDistance = Math.abs(entry - stop);
  const riskAmount = account * (riskPct / 100);
  const positionSize = stopDistance > 0 ? riskAmount / stopDistance : 0;

  const plannedR =
    takeProfit && Number.isFinite(takeProfit) && stopDistance > 0
      ? Math.abs(takeProfit - entry) / stopDistance
      : null;

  const breakEvenWinRate =
    plannedR !== null && plannedR > 0 ? (1 / (1 + plannedR)) * 100 : null;

  // Fraction of the account left after one losing trade. riskPct is
  // guaranteed > 0 above, so survivalRate is always < 1. When riskPct >= 100
  // the account is wiped (or worse) in a single loss, so the honest answer
  // is 1 — not Infinity, which the old `survivalRate > 0` guard wrongly
  // produced and the UI rendered as "∞ losses to halve" for a 100% risk.
  const survivalRate = 1 - riskPct / 100;
  const lossesToHalve =
    survivalRate <= 0 ? 1 : Math.ceil(LN_HALF / Math.log(survivalRate));
  const lossesToTenth =
    survivalRate <= 0 ? 1 : Math.ceil(LN_TENTH / Math.log(survivalRate));

  const warnings: SurvieOutput['warnings'] = [];
  if (riskPct >= 2) warnings.push('risk-high');
  if (stopDistance === 0) warnings.push('no-stop');
  if (stopDistance > 0 && stopDistance / entry < 0.001) warnings.push('too-tight');
  if (plannedR !== null && takeProfit !== undefined) {
    const inverted =
      (entry > stop && takeProfit !== undefined && takeProfit < entry) ||
      (entry < stop && takeProfit !== undefined && takeProfit > entry);
    if (inverted) warnings.push('inverted');
  }

  return {
    riskAmount,
    stopDistance,
    positionSize,
    plannedR,
    breakEvenWinRate,
    lossesToHalve,
    lossesToTenth,
    warnings,
  };
}
