// La Criée — daily ritual at dawn.
//
// One question, identical for every visitor, changing every UTC day.
// Pulled deterministically from the seeded lesson-content (FR + EN
// already written, no AI needed). The seed is the date in YYYY-MM-DD,
// so the same question shows up worldwide for the same day.

import { TRACKS } from '@/lib/curriculum/data';
import { getLessonContent } from '@/lib/curriculum/lesson-content';

export type CrieeCard = {
  /** YYYY-MM-DD. */
  date: string;
  /** "candles-05" — used to deep-link the source lesson. */
  lessonId: string;
  /** Track slug for the lesson link. */
  trackSlug: string;
  /** Slug of the lesson within the track. */
  lessonSlug: string;
  /** Pulled question. */
  question: { fr: string; en: string };
  /** Pulled options, kept in their original order. */
  options: { fr: string[]; en: string[] };
  /** Index of the correct option in the original arrays. */
  correct: number;
  /** Rationale shown after reveal. */
  rationale: { fr: string; en: string };
  /** Track + lesson display titles for the source line. */
  source: { trackTitle: { fr: string; en: string }; lessonTitle: { fr: string; en: string } };
};

function todayKey(d: Date = new Date()): string {
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return utc.toISOString().slice(0, 10);
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Builds today's card. Side-effect free, deterministic for the given date. */
export function getCrieeForDate(date: Date = new Date()): CrieeCard {
  const key = todayKey(date);
  const hash = djb2(key);

  // Pick a track that has at least one seeded lesson — we want a real
  // hand-written question, not a placeholder.
  const tracksWithLessons = TRACKS;
  const track = tracksWithLessons[hash % tracksWithLessons.length];
  const lesson = track.lessons[Math.floor(hash / 17) % track.lessons.length];
  const content = getLessonContent(track, lesson);

  const quiz = content.quiz[Math.floor(hash / 31) % content.quiz.length];

  return {
    date: key,
    lessonId: lesson.id,
    trackSlug: track.slug,
    lessonSlug: lesson.slug,
    question: quiz.q,
    options: quiz.options,
    correct: quiz.correct,
    rationale: quiz.rationale,
    source: { trackTitle: track.title, lessonTitle: lesson.title },
  };
}
