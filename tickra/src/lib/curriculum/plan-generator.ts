// TICKRA-PHASE-1.4: build a 14-day learning plan from the placement test
// result. We walk the curriculum starting at the recommended track and pick
// one SEEDED lesson per day (skipping placeholders so we never schedule
// "coming soon" content). Order respects the natural curriculum sequence.

import { TRACKS, getTrack, type LessonMeta } from './data';
import { isSeeded } from './lesson-content';

export type PlanItem = { day: number; lessonId: string };

export function generatePlan(placementTrackSlug: string | null | undefined, days = 14): PlanItem[] {
  // Find starting track. If unknown, start from the very first track.
  const startTrackIdx =
    placementTrackSlug && getTrack(placementTrackSlug)
      ? TRACKS.findIndex((t) => t.slug === placementTrackSlug)
      : 0;
  if (startTrackIdx < 0) return [];

  const ordered: LessonMeta[] = [];
  for (let i = startTrackIdx; i < TRACKS.length && ordered.length < days; i++) {
    const t = TRACKS[i];
    for (const l of t.lessons) {
      if (!isSeeded(l.id)) continue;
      ordered.push(l);
      if (ordered.length >= days) break;
    }
  }
  // If we ran out before `days`, wrap around to earlier tracks so we still
  // produce a full plan (in case the placement put the user near the end).
  if (ordered.length < days) {
    for (let i = 0; i < startTrackIdx && ordered.length < days; i++) {
      for (const l of TRACKS[i].lessons) {
        if (!isSeeded(l.id)) continue;
        if (ordered.find((x) => x.id === l.id)) continue;
        ordered.push(l);
        if (ordered.length >= days) break;
      }
    }
  }
  return ordered.slice(0, days).map((l, i) => ({ day: i + 1, lessonId: l.id }));
}
