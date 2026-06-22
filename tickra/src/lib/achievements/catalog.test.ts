import { describe, it, expect } from 'vitest';
import { buildSnapshot, evaluateAll, getAchievement, ACHIEVEMENTS } from './catalog';
import type { ProgressRow, MistakeRow } from '@/lib/db/queries';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 5, 15, 12, 0, 0); // fixed reference

function progress(lessonId: string, iso: string): ProgressRow {
  return { lesson_id: lessonId, completed_at: iso };
}

describe('buildSnapshot', () => {
  it('maps progress rows to completion timestamps', () => {
    const snap = buildSnapshot({
      progress: [progress('l1', '2026-06-15T12:00:00.000Z')],
      mistakes: [],
      now: NOW,
    });
    expect(snap.completedAt['l1']).toBe(Date.parse('2026-06-15T12:00:00.000Z'));
    expect(snap.now).toBe(NOW);
  });

  it('defaults now to the current time when omitted', () => {
    const before = Date.now();
    const snap = buildSnapshot({ progress: [], mistakes: [] });
    expect(snap.now).toBeGreaterThanOrEqual(before);
  });
});

describe('evaluateAll', () => {
  it('unlocks nothing for an empty snapshot', () => {
    const snap = buildSnapshot({ progress: [], mistakes: [], now: NOW });
    expect(evaluateAll(snap)).toEqual([]);
  });

  it('unlocks "first_lesson" after a single completion', () => {
    const snap = buildSnapshot({
      progress: [progress('l1', new Date(NOW).toISOString())],
      mistakes: [],
      now: NOW,
    });
    expect(evaluateAll(snap)).toContain('first_lesson');
  });

  it('unlocks a 7-day streak for seven consecutive days', () => {
    const rows: ProgressRow[] = [];
    for (let i = 0; i < 7; i++) {
      rows.push(progress(`l${i}`, new Date(NOW - i * DAY_MS).toISOString()));
    }
    const snap = buildSnapshot({ progress: rows, mistakes: [], now: NOW });
    expect(evaluateAll(snap)).toContain('streak_7');
  });

  it('does not unlock a 7-day streak with a gap', () => {
    const rows = [
      progress('a', new Date(NOW).toISOString()),
      progress('b', new Date(NOW - 2 * DAY_MS).toISOString()), // gap on day-1
      progress('c', new Date(NOW - 3 * DAY_MS).toISOString()),
    ];
    const snap = buildSnapshot({ progress: rows, mistakes: [], now: NOW });
    expect(evaluateAll(snap)).not.toContain('streak_7');
  });

  it('returns only valid achievement ids', () => {
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
    const rows = [progress('l1', new Date(NOW).toISOString())];
    const snap = buildSnapshot({ progress: rows, mistakes: [] as MistakeRow[], now: NOW });
    for (const id of evaluateAll(snap)) expect(ids.has(id)).toBe(true);
  });
});

describe('getAchievement', () => {
  it('finds a known achievement and returns undefined otherwise', () => {
    expect(getAchievement('first_lesson')?.id).toBe('first_lesson');
    expect(getAchievement('nope')).toBeUndefined();
  });

  it('gives every achievement bilingual copy', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.title.fr && a.title.en).toBeTruthy();
      expect(a.description.fr && a.description.en).toBeTruthy();
    }
  });
});
