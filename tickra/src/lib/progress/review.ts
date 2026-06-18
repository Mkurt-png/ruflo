// Spaced-repetition logic for Tickra.
// Targets: a lesson is "due" if (now − lastTouch) ≥ interval(level).
// Levels grow each time the lesson is reviewed (3d → 7d → 14d → 30d → 90d).

import type { Mistake } from './hook';
import { TRACKS } from '@/lib/curriculum/data';
import type { LessonMeta, TrackMeta } from '@/lib/curriculum/data';

const INTERVALS_DAYS = [3, 7, 14, 30, 90];
const DAY_MS = 24 * 60 * 60 * 1000;

export type DueLesson = {
  lesson: LessonMeta;
  track: TrackMeta;
  mistake: Mistake;
  dueAt: number;
  level: number; // 0..INTERVALS_DAYS.length
};

function reviewLevel(m: Mistake): number {
  // Count rough "reviews" by spacing — without a full history we infer 0 if
  // never reviewed, 1 if reviewed at least once. Future iterations can store
  // a real `reviewCount` field.
  return m.reviewedAt ? 1 : 0;
}

export function getReviewQueue(mistakes: Record<string, Mistake> | undefined): DueLesson[] {
  if (!mistakes) return [];
  const out: DueLesson[] = [];

  for (const m of Object.values(mistakes)) {
    const found = findLesson(m.lessonId);
    if (!found) continue;
    const level = reviewLevel(m);
    const lastTouch = m.reviewedAt ?? m.loggedAt;
    const intervalDays = INTERVALS_DAYS[Math.min(level, INTERVALS_DAYS.length - 1)];
    const dueAt = lastTouch + intervalDays * DAY_MS;
    out.push({ lesson: found.lesson, track: found.track, mistake: m, dueAt, level });
  }

  // Earliest due first, including overdue.
  out.sort((a, b) => a.dueAt - b.dueAt);
  return out;
}

export function dueNow(queue: DueLesson[]): DueLesson[] {
  const now = Date.now();
  return queue.filter((q) => q.dueAt <= now);
}

function findLesson(lessonId: string): { lesson: LessonMeta; track: TrackMeta } | undefined {
  for (const t of TRACKS) {
    const l = t.lessons.find((x) => x.id === lessonId);
    if (l) return { lesson: l, track: t };
  }
  return undefined;
}
