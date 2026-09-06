import { describe, it, expect } from 'vitest';
import { FREE_LESSON_LIMIT, isLessonUnlocked, isPaid } from './entitlement';

describe('FREE_LESSON_LIMIT', () => {
  it('grants exactly four free lessons', () => {
    expect(FREE_LESSON_LIMIT).toBe(4);
  });
});

describe('isLessonUnlocked — free plan', () => {
  it('unlocks the first four lessons', () => {
    for (let i = 1; i <= 4; i++) {
      expect(isLessonUnlocked(i, 'free')).toBe(true);
    }
  });

  it('locks the fifth lesson and everything after it', () => {
    expect(isLessonUnlocked(5, 'free')).toBe(false);
    expect(isLessonUnlocked(6, 'free')).toBe(false);
    expect(isLessonUnlocked(240, 'free')).toBe(false);
  });

  it('rejects a non-positive global index', () => {
    expect(isLessonUnlocked(0, 'free')).toBe(false);
    expect(isLessonUnlocked(-1, 'free')).toBe(false);
  });
});

describe('isLessonUnlocked — paid plans', () => {
  it('unlocks every lesson for pro and lifetime', () => {
    for (const plan of ['pro', 'lifetime'] as const) {
      expect(isLessonUnlocked(1, plan)).toBe(true);
      expect(isLessonUnlocked(5, plan)).toBe(true);
      expect(isLessonUnlocked(240, plan)).toBe(true);
    }
  });
});

describe('isPaid', () => {
  it('is true only for pro and lifetime', () => {
    expect(isPaid('pro')).toBe(true);
    expect(isPaid('lifetime')).toBe(true);
    expect(isPaid('free')).toBe(false);
  });
});
