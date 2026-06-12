// La Cote — Tickra's single number. Replaces a dashboard of widgets
// with one cotation-style figure: TCKR 61.4 ▲ +0.8
//
// Composition (out of 100):
//   · Régularité   /35  derived from current streak (days)
//   · Précision    /30  quiz / drill correctness
//   · Honnêteté    /20  journal entries (count, recency)
//   · Révision     /15  spaced-repetition due rate kept under control
//
// Pure functions, no side effects. The caller passes the inputs it
// already has (progress, mistakes, journal count, streak). The 30-day
// trail is reconstructed from progress timestamps so the sparkline is
// honest — no fake history.

export type CoteInput = {
  /** Lessons completed map (id → timestamp ms). */
  completed: Record<string, number>;
  /** Mistakes map (id → { loggedAt, reviewedAt? }). */
  mistakes: Record<string, { loggedAt: number; reviewedAt?: number }>;
  /** Current consecutive-day streak. */
  streakDays: number;
  /** Journal entries written so far. */
  journalCount: number;
  /** "now" for deterministic tests. Defaults to Date.now. */
  now?: number;
};

export type CoteOutput = {
  /** 0–100, one decimal. */
  score: number;
  /** Components, for the detail panel. */
  parts: {
    regularite: number; // /35
    precision: number;  // /30
    honnete: number;    // /20
    revision: number;   // /15
  };
  /** Movement since 24h ago. Positive = up. */
  delta: number;
  /** 30 points, one per day going back. Last = today. */
  trail: number[];
};

const DAY = 86_400_000;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Logistic-ish map to scale a "raw" count into a 0..max bucket. */
function curve(raw: number, target: number, max: number): number {
  // Reaches ~63% of max at `target`, asymptotes to max.
  return max * (1 - Math.exp(-raw / target));
}

function regulariteScore(streakDays: number): number {
  // 0 days → 0; 7 days → ~22; 30 days → ~31; 60+ days → 35.
  return curve(streakDays, 14, 35);
}

function precisionScore(completed: Record<string, number>, mistakes: Record<string, unknown>): number {
  const done = Object.keys(completed).length;
  if (done === 0) return 0;
  const wrong = Object.keys(mistakes).length;
  // Mistakes counted as a fraction of lessons reviewed. A perfect 0-mistake
  // streak across many lessons is rewarded more than a mistake-free 2-lesson
  // start (volume matters).
  const cleanliness = clamp(1 - wrong / Math.max(done, 1), 0, 1);
  const volume = curve(done, 30, 1); // 0..1, saturates around 30 lessons
  return 30 * cleanliness * volume;
}

function honneteteScore(journalCount: number): number {
  // 1 entry → ~3; 5 entries → ~11; 20+ → ~19.
  return curve(journalCount, 6, 20);
}

function revisionScore(
  mistakes: Record<string, { loggedAt: number; reviewedAt?: number }>,
  now: number,
): number {
  const entries = Object.values(mistakes);
  if (entries.length === 0) return 15; // nothing to review → full credit
  // A mistake is "stale" if it has been logged > 7 days ago and never
  // reviewed. Score is the share of mistakes kept either reviewed or
  // fresh (< 7 days old).
  const stale = entries.filter(
    (m) => !m.reviewedAt && now - m.loggedAt > 7 * DAY,
  ).length;
  const ratio = 1 - stale / entries.length;
  return 15 * clamp(ratio, 0, 1);
}

type Parts = CoteOutput['parts'];

function computeParts(input: CoteInput, now: number): Parts {
  return {
    regularite: regulariteScore(input.streakDays),
    precision: precisionScore(input.completed, input.mistakes),
    honnete: honneteteScore(input.journalCount),
    revision: revisionScore(input.mistakes, now),
  };
}

function partsSum(p: Parts): number {
  return p.regularite + p.precision + p.honnete + p.revision;
}

export function computeCote(input: CoteInput): CoteOutput {
  const now = input.now ?? Date.now();
  const parts = computeParts(input, now);
  const score = Math.round(partsSum(parts) * 10) / 10;

  // 30-day trail — for each day, recompute parts as if "now" were the
  // end of that day, using only completions/mistakes whose timestamps
  // are <= that day's end. Streak + journal counts can't be honestly
  // backfilled, so we apply a linear decay with distance — the trail
  // tells the truth about progress without inventing specific past days.
  const trail: number[] = [];
  const todayEnd = endOfDayMs(now);
  for (let d = 29; d >= 0; d--) {
    const cutoff = todayEnd - d * DAY;
    const cCompleted: Record<string, number> = {};
    for (const [k, ts] of Object.entries(input.completed)) {
      if (ts <= cutoff) cCompleted[k] = ts;
    }
    const cMistakes: Record<string, { loggedAt: number; reviewedAt?: number }> = {};
    for (const [k, m] of Object.entries(input.mistakes)) {
      if (m.loggedAt <= cutoff) {
        cMistakes[k] = {
          loggedAt: m.loggedAt,
          reviewedAt: m.reviewedAt && m.reviewedAt <= cutoff ? m.reviewedAt : undefined,
        };
      }
    }
    const decay = Math.max(0, 1 - d / 30);
    const dayParts = computeParts(
      {
        completed: cCompleted,
        mistakes: cMistakes,
        streakDays: input.streakDays * decay,
        journalCount: input.journalCount * decay,
      },
      cutoff,
    );
    trail.push(Math.round(partsSum(dayParts) * 10) / 10);
  }

  const previous = trail[trail.length - 2] ?? trail[trail.length - 1];
  const delta = Math.round((trail[trail.length - 1] - previous) * 10) / 10;

  return {
    score,
    parts: {
      regularite: Math.round(parts.regularite * 10) / 10,
      precision: Math.round(parts.precision * 10) / 10,
      honnete: Math.round(parts.honnete * 10) / 10,
      revision: Math.round(parts.revision * 10) / 10,
    },
    delta,
    trail,
  };
}

function endOfDayMs(ts: number): number {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}
