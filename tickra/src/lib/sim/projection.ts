// TICKRA-PHASE-3: deterministic compound-growth projection. Counterpart to the
// Monte-Carlo tool — this one is the honest expected-value curve, used to set
// realistic expectations (5%/month is excellent; "double it monthly" is
// fantasy). Pure, no I/O.

export type ProjectionInput = {
  /** Starting balance. */
  start: number;
  /** Expected return per month, in percent (can be negative). */
  monthlyReturnPct: number;
  /** Number of months to project. */
  months: number;
  /** Optional recurring deposit added at the end of each month. */
  monthlyDeposit?: number;
};

export type ProjectionResult = {
  /** Balance per month, index 0 = start, length = months + 1. */
  curve: number[];
  /** Balance at the end. */
  final: number;
  /** Start + all deposits (the cash you put in). */
  totalDeposited: number;
  /** final - totalDeposited (the part the market gave you). */
  profit: number;
  /** final / start (growth multiple on the initial capital). */
  multiple: number;
};

export function projectGrowth(input: ProjectionInput): ProjectionResult {
  const start = Math.max(0, input.start);
  const months = Math.max(0, Math.floor(input.months));
  const deposit = Math.max(0, input.monthlyDeposit ?? 0);
  const r = input.monthlyReturnPct / 100;

  const curve: number[] = [start];
  let balance = start;
  for (let m = 0; m < months; m++) {
    balance = balance * (1 + r) + deposit;
    if (balance < 0) balance = 0;
    curve.push(balance);
  }

  const totalDeposited = start + deposit * months;
  const final = balance;
  return {
    curve,
    final,
    totalDeposited,
    profit: final - totalDeposited,
    multiple: start > 0 ? final / start : 0,
  };
}
