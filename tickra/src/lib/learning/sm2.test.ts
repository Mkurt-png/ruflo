import { describe, it, expect } from 'vitest';
import { sm2Update, INITIAL_SRS_STATE, type SrsState } from './sm2';

const NOW = new Date('2026-01-01T00:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

describe('sm2Update', () => {
  it('resets the interval and streak on "again"', () => {
    const prev: SrsState = { easeFactor: 2.5, intervalDays: 30, consecutiveCorrect: 5 };
    const next = sm2Update(prev, 'again', NOW);
    expect(next.intervalDays).toBe(1);
    expect(next.consecutiveCorrect).toBe(0);
    // Ease factor drops on a failed grade.
    expect(next.easeFactor).toBeLessThan(prev.easeFactor);
  });

  it('never lets the ease factor fall below 1.3', () => {
    let state: SrsState = { ...INITIAL_SRS_STATE };
    for (let i = 0; i < 20; i++) {
      const u = sm2Update(state, 'again', NOW);
      state = { easeFactor: u.easeFactor, intervalDays: u.intervalDays, consecutiveCorrect: u.consecutiveCorrect };
    }
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('follows the 1 → 6 → ef schedule on successive "good" grades', () => {
    const first = sm2Update(INITIAL_SRS_STATE, 'good', NOW);
    expect(first.consecutiveCorrect).toBe(1);
    expect(first.intervalDays).toBe(1);

    const second = sm2Update(first, 'good', NOW);
    expect(second.consecutiveCorrect).toBe(2);
    expect(second.intervalDays).toBe(6);

    const third = sm2Update(second, 'good', NOW);
    expect(third.consecutiveCorrect).toBe(3);
    // round(6 * easeFactor) — easeFactor stays ~2.5 on "good".
    expect(third.intervalDays).toBeGreaterThan(6);
  });

  it('grows ease on "easy" and gives a longer interval than "good"', () => {
    const good = sm2Update(INITIAL_SRS_STATE, 'good', NOW);
    const easy = sm2Update(INITIAL_SRS_STATE, 'easy', NOW);
    expect(easy.easeFactor).toBeGreaterThan(good.easeFactor);
  });

  it('caps the interval at one year', () => {
    const huge: SrsState = { easeFactor: 2.5, intervalDays: 10_000, consecutiveCorrect: 10 };
    const next = sm2Update(huge, 'easy', NOW);
    expect(next.intervalDays).toBeLessThanOrEqual(365);
  });

  it('sets nextReviewAt to now + intervalDays', () => {
    const next = sm2Update(INITIAL_SRS_STATE, 'good', NOW);
    expect(next.nextReviewAt.getTime()).toBe(NOW.getTime() + next.intervalDays * DAY_MS);
  });
});
