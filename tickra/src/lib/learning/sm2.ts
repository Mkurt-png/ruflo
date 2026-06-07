// SM-2 spaced-repetition algorithm (Piotr Wozniak, 1990) — simplified to
// 4 grade buttons (Again / Hard / Good / Easy) like Anki. Pure functions, no
// I/O, fully unit-testable.
//
// State per card:
//   easeFactor          float, starts at 2.5, floor 1.3
//   intervalDays        int, days until next review
//   consecutiveCorrect  int, resets to 0 on Again
//
// Standard SM-2 quality maps:
//   Again = 1,  Hard = 3,  Good = 4,  Easy = 5
// (q < 3 → fail → reset interval to 1; q ≥ 3 → success → grow interval)

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export type SrsState = {
  easeFactor: number;
  intervalDays: number;
  consecutiveCorrect: number;
};

export type SrsUpdate = SrsState & { nextReviewAt: Date };

const GRADE_Q: Record<Grade, number> = { again: 1, hard: 3, good: 4, easy: 5 };
const MIN_EF = 1.3;
const MAX_INTERVAL_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

export function sm2Update(prev: SrsState, grade: Grade, now: Date = new Date()): SrsUpdate {
  const q = GRADE_Q[grade];

  // Ease factor update (clamped at MIN_EF).
  const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const easeFactor = Math.max(MIN_EF, prev.easeFactor + efDelta);

  let intervalDays: number;
  let consecutiveCorrect: number;

  if (q < 3) {
    // Fail → reset.
    intervalDays = 1;
    consecutiveCorrect = 0;
  } else {
    consecutiveCorrect = prev.consecutiveCorrect + 1;
    if (consecutiveCorrect === 1) intervalDays = 1;
    else if (consecutiveCorrect === 2) intervalDays = 6;
    else intervalDays = Math.round(prev.intervalDays * easeFactor);

    // Easy bonus: stretch interval by 30%.
    if (grade === 'easy') intervalDays = Math.round(intervalDays * 1.3);
    // Hard penalty: shrink by 20% but never below previous interval.
    if (grade === 'hard') {
      intervalDays = Math.max(prev.intervalDays, Math.round(intervalDays * 0.8));
    }
  }

  intervalDays = Math.min(MAX_INTERVAL_DAYS, Math.max(1, intervalDays));
  const nextReviewAt = new Date(now.getTime() + intervalDays * DAY_MS);

  return { easeFactor, intervalDays, consecutiveCorrect, nextReviewAt };
}

// Cards a new mistake should start with — interval 1 day, fresh ease.
export const INITIAL_SRS_STATE: SrsState = {
  easeFactor: 2.5,
  intervalDays: 1,
  consecutiveCorrect: 0,
};
