// The one quiz question shown on the account page, the same for everyone that
// day.
//
// SERVER ONLY. It reads `lesson-content`, which holds every paid lesson body,
// drill answer and quiz rationale. This used to be computed inside the
// `DailyChallenge` client component, which meant Next bundled all of it into
// public JS served to anonymous visitors on every page load. One question a day
// is the intended free taster; the other ~660 are the product.
//
// `no-paid-content-in-bundle.test.ts` fails if a client component imports this.

import { TRACKS } from './data';
import { getLessonContent } from './lesson-content';

export type Locale = 'fr' | 'en';

export type DailyCard = {
  lessonId: string;
  trackSlug: string;
  lessonSlug: string;
  lessonTitle: string;
  trackTitle: string;
  q: string;
  options: string[];
  correct: number;
  rationale: string;
};

/** Day-of-year, so everyone sees the same card on the same date. */
export function dayIndex(now: Date = new Date()): number {
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  return Math.floor((now.getTime() - start) / 86_400_000);
}

export function pickCard(locale: Locale, day: number = dayIndex()): DailyCard | null {
  const all: DailyCard[] = [];
  for (const tr of TRACKS) {
    for (const lsn of tr.lessons) {
      for (const q of getLessonContent(tr, lsn).quiz) {
        all.push({
          lessonId: lsn.id,
          trackSlug: tr.slug,
          lessonSlug: lsn.slug,
          lessonTitle: lsn.title[locale],
          trackTitle: tr.title[locale],
          q: q.q[locale],
          options: q.options[locale],
          correct: q.correct,
          rationale: q.rationale[locale],
        });
      }
    }
  }
  if (all.length === 0) return null;
  return all[day % all.length];
}
