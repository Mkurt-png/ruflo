import { describe, it, expect } from 'vitest';
import {
  CANDLE_PATTERNS,
  buildQuestion,
  patternForSeed,
} from './candle-patterns';

describe('CANDLE_PATTERNS data integrity', () => {
  it('has unique ids', () => {
    const ids = CANDLE_PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps every candle OHLC-consistent (high is the max, low is the min)', () => {
    for (const p of CANDLE_PATTERNS) {
      for (const c of p.candles) {
        expect(c.h).toBeGreaterThanOrEqual(Math.max(c.o, c.c));
        expect(c.l).toBeLessThanOrEqual(Math.min(c.o, c.c));
        expect(c.h).toBeGreaterThanOrEqual(c.l);
      }
    }
  });

  it('provides bilingual names and meanings for every pattern', () => {
    for (const p of CANDLE_PATTERNS) {
      expect(p.name.fr.length).toBeGreaterThan(0);
      expect(p.name.en.length).toBeGreaterThan(0);
      expect(p.meaning.fr.length).toBeGreaterThan(0);
      expect(p.meaning.en.length).toBeGreaterThan(0);
    }
  });
});

describe('buildQuestion', () => {
  const pattern = CANDLE_PATTERNS[0];

  it('includes the correct answer at the reported index', () => {
    const q = buildQuestion(pattern, 'en', 123);
    expect(q.options[q.correctIndex]).toBe(pattern.name.en);
  });

  it('produces 4 options by default (1 correct + 3 distractors)', () => {
    const q = buildQuestion(pattern, 'fr', 7);
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options).size).toBe(4); // no duplicates
  });

  it('never lists the correct answer twice', () => {
    for (const p of CANDLE_PATTERNS) {
      const q = buildQuestion(p, 'en', p.id.length * 31);
      const occurrences = q.options.filter((o) => o === p.name.en).length;
      expect(occurrences).toBe(1);
    }
  });

  it('is deterministic for a given seed', () => {
    const a = buildQuestion(pattern, 'en', 999);
    const b = buildQuestion(pattern, 'en', 999);
    expect(a.options).toEqual(b.options);
    expect(a.correctIndex).toBe(b.correctIndex);
  });

  it('respects a custom distractor count', () => {
    const q = buildQuestion(pattern, 'en', 5, 2);
    expect(q.options).toHaveLength(3);
  });
});

describe('patternForSeed', () => {
  it('returns a known pattern', () => {
    const p = patternForSeed(42);
    expect(CANDLE_PATTERNS).toContainEqual(p);
  });

  it('is deterministic', () => {
    expect(patternForSeed(7).id).toBe(patternForSeed(7).id);
  });
});
