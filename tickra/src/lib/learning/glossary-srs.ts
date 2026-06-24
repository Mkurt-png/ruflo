// TICKRA-PHASE-3: spaced-repetition store for glossary flashcards.
// Wraps the (unit-tested) SM-2 scheduler with a localStorage-backed card map
// keyed by the term's English label. The scheduling + ordering helpers are
// pure so they can be tested without a browser; only load/save touch storage.

import { sm2Update, INITIAL_SRS_STATE, type Grade, type SrsState } from './sm2';

export type CardState = SrsState & { nextReviewAt: number }; // epoch ms
export type CardMap = Record<string, CardState>;

const STORAGE_KEY = 'tickra-glossary-srs-v1';

/** Apply a grade to a card (creating a fresh one if unseen). Pure. */
export function gradeCard(prev: CardState | undefined, grade: Grade, now: Date = new Date()): CardState {
  const base: SrsState = prev
    ? { easeFactor: prev.easeFactor, intervalDays: prev.intervalDays, consecutiveCorrect: prev.consecutiveCorrect }
    : { ...INITIAL_SRS_STATE };
  const u = sm2Update(base, grade, now);
  return {
    easeFactor: u.easeFactor,
    intervalDays: u.intervalDays,
    consecutiveCorrect: u.consecutiveCorrect,
    nextReviewAt: u.nextReviewAt.getTime(),
  };
}

/** Number of cards due now (unseen cards count as due). Pure. */
export function dueCount(keys: string[], states: CardMap, now: number): number {
  return keys.filter((k) => {
    const s = states[k];
    return !s || s.nextReviewAt <= now;
  }).length;
}

/**
 * Study order: most-overdue due cards first, then unseen cards, then the
 * remaining cards by soonest next review. Pure and deterministic.
 */
export function selectStudyOrder(keys: string[], states: CardMap, now: number): string[] {
  const due: { k: string; at: number }[] = [];
  const unseen: string[] = [];
  const future: { k: string; at: number }[] = [];
  for (const k of keys) {
    const s = states[k];
    if (!s) unseen.push(k);
    else if (s.nextReviewAt <= now) due.push({ k, at: s.nextReviewAt });
    else future.push({ k, at: s.nextReviewAt });
  }
  due.sort((a, b) => a.at - b.at); // most overdue (smallest nextReviewAt) first
  future.sort((a, b) => a.at - b.at);
  return [...due.map((d) => d.k), ...unseen, ...future.map((f) => f.k)];
}

export function loadCards(): CardMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CardMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveCards(map: CardMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode — ignore */
  }
}
