import { describe, it, expect } from 'vitest';
import { gradeCard, dueCount, selectStudyOrder, type CardMap } from './glossary-srs';

const NOW = Date.UTC(2026, 0, 1, 12, 0, 0);
const DAY = 86_400_000;

describe('gradeCard', () => {
  it('creates a fresh card from undefined and schedules it forward', () => {
    const c = gradeCard(undefined, 'good', new Date(NOW));
    expect(c.consecutiveCorrect).toBe(1);
    expect(c.nextReviewAt).toBeGreaterThan(NOW);
  });

  it('resets the streak on "again"', () => {
    const first = gradeCard(undefined, 'good', new Date(NOW));
    const second = gradeCard(first, 'again', new Date(NOW));
    expect(second.consecutiveCorrect).toBe(0);
  });
});

describe('dueCount', () => {
  it('counts unseen cards as due', () => {
    expect(dueCount(['a', 'b', 'c'], {}, NOW)).toBe(3);
  });

  it('excludes cards scheduled in the future', () => {
    const states: CardMap = {
      a: { easeFactor: 2.5, intervalDays: 5, consecutiveCorrect: 1, nextReviewAt: NOW + 5 * DAY },
    };
    expect(dueCount(['a', 'b'], states, NOW)).toBe(1); // a is future, b is unseen
  });

  it('includes cards whose review time has passed', () => {
    const states: CardMap = {
      a: { easeFactor: 2.5, intervalDays: 1, consecutiveCorrect: 1, nextReviewAt: NOW - DAY },
    };
    expect(dueCount(['a'], states, NOW)).toBe(1);
  });
});

describe('selectStudyOrder', () => {
  it('puts the most-overdue due cards first, then unseen, then future', () => {
    const states: CardMap = {
      overdueOld: { easeFactor: 2.5, intervalDays: 1, consecutiveCorrect: 1, nextReviewAt: NOW - 10 * DAY },
      overdueNew: { easeFactor: 2.5, intervalDays: 1, consecutiveCorrect: 1, nextReviewAt: NOW - 1 * DAY },
      future: { easeFactor: 2.5, intervalDays: 9, consecutiveCorrect: 3, nextReviewAt: NOW + 9 * DAY },
    };
    const order = selectStudyOrder(['future', 'overdueNew', 'unseen', 'overdueOld'], states, NOW);
    expect(order).toEqual(['overdueOld', 'overdueNew', 'unseen', 'future']);
  });

  it('returns every key exactly once', () => {
    const keys = ['a', 'b', 'c', 'd'];
    const order = selectStudyOrder(keys, {}, NOW);
    expect([...order].sort()).toEqual([...keys].sort());
  });
});
