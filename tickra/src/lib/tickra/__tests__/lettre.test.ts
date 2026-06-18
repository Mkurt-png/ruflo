import { describe, it, expect } from 'vitest';
import { composeLetter, type LetterContext } from '../lettre';

// Wednesday 2026-06-17. ISO week starts Monday 2026-06-15 00:00:00 UTC.
const NOW = Date.parse('2026-06-17T12:00:00Z');
const WEEK_START = Date.parse('2026-06-15T00:00:00Z');

function ctx(over: Partial<LetterContext> = {}): LetterContext {
  return {
    completed: {},
    mistakes: {},
    streakDays: 0,
    cote: 50,
    coteDelta: 0,
    now: NOW,
    ...over,
  };
}

const thisWeekText = (r: ReturnType<typeof composeLetter>) =>
  r.sections.find((s) => s.id === 'cette-semaine')!.lines.map((l) => l.en).join(' ');

describe('composeLetter', () => {
  it('dates the letter with the ISO day of now', () => {
    expect(composeLetter(ctx()).date).toBe('2026-06-17');
  });

  it('always renders the three fixed sections in order', () => {
    expect(composeLetter(ctx()).sections.map((s) => s.id)).toEqual([
      'cette-semaine',
      'ce-qui-revient',
      'la-semaine-qui-vient',
    ]);
  });

  it('is empty for a brand-new, inactive context', () => {
    expect(composeLetter(ctx()).empty).toBe(true);
  });

  it('is not empty once there is activity this week', () => {
    expect(composeLetter(ctx({ completed: { a: NOW } })).empty).toBe(false);
  });

  it('counts a completion exactly at the week start as "this week"', () => {
    const r = composeLetter(ctx({ completed: { a: WEEK_START } }));
    expect(thisWeekText(r)).toContain('You finished 1 lesson');
  });

  it('excludes a completion one millisecond before the week start', () => {
    const r = composeLetter(ctx({ completed: { a: WEEK_START - 1 } }));
    // Falls into the previous week, so the "this week" tally is zero.
    expect(thisWeekText(r)).toContain('No lessons this week');
  });

  it('reports the running streak when present', () => {
    expect(thisWeekText(composeLetter(ctx({ streakDays: 5 })))).toContain('5 days');
  });

  it('is deterministic for a fixed now', () => {
    const a = composeLetter(ctx({ completed: { a: NOW }, streakDays: 3 }));
    const b = composeLetter(ctx({ completed: { a: NOW }, streakDays: 3 }));
    expect(a).toEqual(b);
  });
});
