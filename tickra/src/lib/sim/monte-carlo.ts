// TICKRA-PHASE-3: Monte-Carlo risk-of-ruin simulator.
// Answers the question every risk-management lesson raises but few tools make
// tangible: "with this win rate and this reward:risk, how likely am I to blow
// up before the edge plays out?"
//
// Pure + deterministic: the RNG is seedable (mulberry32) so the same inputs
// always produce the same distribution — which also makes it unit-testable.

export type MonteCarloParams = {
  /** Win probability, 0..1. */
  winRate: number;
  /** Reward per winning trade, in R (e.g. 2 means +2R on a win). */
  rewardR: number;
  /** Loss per losing trade, in R (almost always 1 — you lose your stop). */
  lossR: number;
  /** Fraction of current equity risked per trade, 0..1 (e.g. 0.01 = 1%). */
  riskPerTrade: number;
  /** Number of trades per simulated run. */
  trades: number;
  /** Number of independent runs to simulate. */
  runs: number;
  /** Drawdown from the *starting* balance counted as ruin, 0..1 (default 0.5). */
  ruinDrawdown?: number;
  /** RNG seed for reproducibility. */
  seed?: number;
};

export type MonteCarloResult = {
  /** Fraction of runs that hit the ruin threshold at any point, 0..1. */
  riskOfRuin: number;
  /** Final-equity distribution as a multiple of the starting balance. */
  median: number;
  p5: number;
  p95: number;
  mean: number;
  /** Fraction of runs that ended above the starting balance. */
  profitable: number;
  /** A handful of full equity curves (multiples of start) for display. */
  sampleCurves: number[][];
};

// mulberry32 — tiny, fast, good-enough deterministic PRNG.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.round(p * (sortedAsc.length - 1))));
  return sortedAsc[idx];
}

export function runMonteCarlo(params: MonteCarloParams): MonteCarloResult {
  const {
    winRate,
    rewardR,
    lossR,
    riskPerTrade,
    trades,
    runs,
    ruinDrawdown = 0.5,
    seed = 0x1a2b3c4d,
  } = params;

  const rng = mulberry32(seed);
  const ruinFloor = 1 - ruinDrawdown; // equity multiple below which we're ruined
  const finals: number[] = [];
  let ruinCount = 0;
  let profitableCount = 0;
  const sampleCurves: number[][] = [];
  const sampleEvery = Math.max(1, Math.floor(runs / 5));

  for (let r = 0; r < runs; r++) {
    let equity = 1; // normalised starting balance
    let ruined = false;
    const curve: number[] = [1];
    for (let i = 0; i < trades; i++) {
      const risk = equity * riskPerTrade;
      if (rng() < winRate) equity += risk * rewardR;
      else equity -= risk * lossR;
      if (equity < 0) equity = 0;
      curve.push(equity);
      if (!ruined && equity <= ruinFloor) ruined = true;
    }
    if (ruined) ruinCount++;
    if (equity > 1) profitableCount++;
    finals.push(equity);
    if (r % sampleEvery === 0 && sampleCurves.length < 5) sampleCurves.push(curve);
  }

  finals.sort((a, b) => a - b);
  const mean = finals.reduce((a, b) => a + b, 0) / (finals.length || 1);

  return {
    riskOfRuin: runs ? ruinCount / runs : 0,
    median: percentile(finals, 0.5),
    p5: percentile(finals, 0.05),
    p95: percentile(finals, 0.95),
    mean,
    profitable: runs ? profitableCount / runs : 0,
    sampleCurves,
  };
}
