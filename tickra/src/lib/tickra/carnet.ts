// Le Carnet d'absence — quand le lecteur revient, le carnet d'absence
// énumère ce qui s'est passé sans lui. Pure compute à partir de la
// progression locale, sans réseau.

import { getCrieeForDate } from '@/lib/tickra/criee';
import { TRACKS } from '@/lib/curriculum/data';

export type CarnetContext = {
  /** Lessons completed map (id → timestamp ms). */
  completed: Record<string, number>;
  /** Logged mistakes. */
  mistakes: Record<string, { loggedAt: number; reviewedAt?: number }>;
  /** Now timestamp (ms). Defaults to Date.now(). */
  now?: number;
};

export type CarnetMissedCriee = {
  date: string; // YYYY-MM-DD
  question: { fr: string; en: string };
  trackTitle: { fr: string; en: string };
  href: { fr: string; en: string };
};

export type CarnetNext = {
  trackSlug: string;
  lessonSlug: string;
  title: { fr: string; en: string };
};

export type Carnet = {
  /** Days since most recent activity. Zero or below means the reader is current. */
  daysAway: number;
  /** ISO date of the last activity. */
  lastActiveDate: string;
  /** Total criées that passed during the absence (capped to 14). */
  missedCriees: CarnetMissedCriee[];
  /** Number of complete weeks the reader missed (each carries a Lettre). */
  missedLettres: number;
  /** Number of mistakes still awaiting review (older than 7 days). */
  dueMistakes: number;
  /** Suggested next lesson to resume on. */
  next: CarnetNext | null;
};

const DAY = 86_400_000;
const MAX_CRIEES = 14;

function latestActivity(ctx: CarnetContext): number {
  const stamps: number[] = [];
  for (const ts of Object.values(ctx.completed)) stamps.push(ts);
  for (const m of Object.values(ctx.mistakes)) {
    stamps.push(m.loggedAt);
    if (m.reviewedAt) stamps.push(m.reviewedAt);
  }
  if (stamps.length === 0) return 0;
  return Math.max(...stamps);
}

function pickNext(completed: Record<string, number>): CarnetNext | null {
  for (const track of TRACKS) {
    for (const lesson of track.lessons) {
      if (!completed[lesson.id]) {
        return {
          trackSlug: track.slug,
          lessonSlug: lesson.slug,
          title: lesson.title,
        };
      }
    }
  }
  return null;
}

export function readCarnet(ctx: CarnetContext): Carnet {
  const now = ctx.now ?? Date.now();
  const last = latestActivity(ctx);
  const daysAway = last === 0 ? 0 : Math.floor((now - last) / DAY);

  // Walk back from now to fetch each missed Criée, newest-first.
  const missedCriees: CarnetMissedCriee[] = [];
  const start = Math.max(0, daysAway);
  for (let i = 1; i <= Math.min(start, MAX_CRIEES); i++) {
    const d = new Date(now - i * DAY);
    const card = getCrieeForDate(d);
    missedCriees.push({
      date: card.date,
      question: card.question,
      trackTitle: card.source.trackTitle,
      href: {
        fr: `/fr/learn/${card.trackSlug}/${card.lessonSlug}`,
        en: `/en/learn/${card.trackSlug}/${card.lessonSlug}`,
      },
    });
  }

  const missedLettres = Math.floor(daysAway / 7);
  const dueMistakes = Object.values(ctx.mistakes).filter(
    (m) => !m.reviewedAt && now - m.loggedAt > 7 * DAY,
  ).length;

  return {
    daysAway,
    lastActiveDate: last === 0 ? '—' : new Date(last).toISOString().slice(0, 10),
    missedCriees,
    missedLettres,
    dueMistakes,
    next: pickNext(ctx.completed ?? {}),
  };
}
