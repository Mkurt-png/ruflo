import { describe, it, expect } from 'vitest';
import { generatePlan } from './plan-generator';
import { isSeeded } from './lesson-content';
import { TRACKS } from './data';

describe('generatePlan', () => {
  it('produces a sequentially-numbered plan capped at the requested length', () => {
    const plan = generatePlan(null, 14);
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.length).toBeLessThanOrEqual(14);
    plan.forEach((item, i) => expect(item.day).toBe(i + 1));
  });

  it('only ever schedules seeded lessons (never "coming soon")', () => {
    const plan = generatePlan(null, 14);
    for (const item of plan) {
      expect(isSeeded(item.lessonId)).toBe(true);
    }
  });

  it('never schedules the same lesson twice', () => {
    const plan = generatePlan(null, 14);
    const ids = plan.map((p) => p.lessonId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('respects a custom day count', () => {
    expect(generatePlan(null, 3).length).toBeLessThanOrEqual(3);
    expect(generatePlan(null, 1)).toHaveLength(1);
  });

  it('falls back to the first track for an unknown placement slug', () => {
    const unknown = generatePlan('does-not-exist', 5);
    const fromStart = generatePlan(null, 5);
    expect(unknown).toEqual(fromStart);
  });

  it('starts from the requested track when it has seeded lessons', () => {
    // Pick a track that has at least one seeded lesson.
    const track = TRACKS.find((t) => t.lessons.some((l) => isSeeded(l.id)));
    expect(track).toBeDefined();
    const plan = generatePlan(track!.slug, 1);
    expect(plan).toHaveLength(1);
    expect(isSeeded(plan[0].lessonId)).toBe(true);
  });
});
