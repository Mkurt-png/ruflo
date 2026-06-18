import { describe, it, expect } from 'vitest';
import { getReviewQueue, dueNow, type DueLesson } from '../review';

const DAY = 24 * 60 * 60 * 1000;

// dueNow is pure over a queue, independent of curriculum data.
function due(id: string, dueAt: number): DueLesson {
  return {
    lesson: { id } as DueLesson['lesson'],
    track: {} as DueLesson['track'],
    mistake: { lessonId: id, loggedAt: 0 } as DueLesson['mistake'],
    dueAt,
    level: 0,
  };
}

describe('getReviewQueue', () => {
  it('returns an empty queue for undefined or empty mistakes', () => {
    expect(getReviewQueue(undefined)).toEqual([]);
    expect(getReviewQueue({})).toEqual([]);
  });
});

describe('dueNow', () => {
  it('keeps only entries due at or before now', () => {
    const now = Date.now();
    const q = [
      due('overdue', now - 2 * DAY),
      due('exactly-now', now),
      due('future', now + 2 * DAY),
    ];
    const ids = dueNow(q).map((d) => d.lesson.id);
    expect(ids).toContain('overdue');
    expect(ids).toContain('exactly-now');
    expect(ids).not.toContain('future');
  });

  it('returns an empty array when nothing is due', () => {
    expect(dueNow([due('a', Date.now() + DAY)])).toEqual([]);
  });
});
