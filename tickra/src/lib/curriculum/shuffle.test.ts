import { describe, it, expect } from 'vitest';
import { shuffleWithCorrect } from './shuffle';

describe('shuffleWithCorrect', () => {
  it('keeps the correct index pointing at the originally-correct value', () => {
    const options = ['A', 'B', 'C', 'D'];
    for (let correct = 0; correct < options.length; correct++) {
      for (const seed of ['q1', 'q2', 'lesson-x-3', 'zz']) {
        const r = shuffleWithCorrect(options, correct, seed);
        expect(r.options[r.correct]).toBe(options[correct]);
      }
    }
  });

  it('preserves the full set of options (no loss, no duplication)', () => {
    const options = ['a', 'b', 'c', 'd', 'e'];
    const r = shuffleWithCorrect(options, 2, 'seed');
    expect([...r.options].sort()).toEqual([...options].sort());
  });

  it('is deterministic for the same seed', () => {
    const options = ['w', 'x', 'y', 'z'];
    const a = shuffleWithCorrect(options, 1, 'same');
    const b = shuffleWithCorrect(options, 1, 'same');
    expect(a.options).toEqual(b.options);
    expect(a.correct).toBe(b.correct);
  });

  it('can produce different orderings for different seeds', () => {
    const options = ['1', '2', '3', '4', '5', '6'];
    const a = shuffleWithCorrect(options, 0, 'seed-a').options.join('');
    const b = shuffleWithCorrect(options, 0, 'seed-b').options.join('');
    // Not guaranteed for tiny arrays, but for 6 items two seeds should differ.
    expect(a === b).toBe(false);
  });

  it('handles a single option', () => {
    const r = shuffleWithCorrect(['only'], 0, 'seed');
    expect(r.options).toEqual(['only']);
    expect(r.correct).toBe(0);
  });

  it('does not mutate the input array', () => {
    const options = ['a', 'b', 'c'];
    const copy = [...options];
    shuffleWithCorrect(options, 0, 'seed');
    expect(options).toEqual(copy);
  });

  it('spreads the correct answer across positions over many questions', () => {
    const options = ['A', 'B', 'C', 'D'];
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 200; i++) {
      const r = shuffleWithCorrect(options, 0, `question-${i}`);
      counts[r.correct]++;
    }
    // Every position should receive a non-trivial share (not all stuck on A).
    for (const c of counts) expect(c).toBeGreaterThan(20);
  });
});
