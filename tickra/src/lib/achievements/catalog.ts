// Static catalog of achievements. Each entry has bilingual copy, an icon
// tone, and a `criteria` predicate that takes a snapshot of the user's
// state and returns true when unlocked. Pure — no I/O.

import { TRACKS } from '@/lib/curriculum/data';
import type { ProgressRow, MistakeRow } from '@/lib/db/queries';

export type Snapshot = {
  completedAt: Record<string, number>; // lessonId → epoch ms
  mistakes: MistakeRow[];
  now: number;
};

export type AchievementTone = 'bronze' | 'silver' | 'gold' | 'platinum';

export type Achievement = {
  id: string;
  tone: AchievementTone;
  title: { fr: string; en: string };
  description: { fr: string; en: string };
  criteria: (s: Snapshot) => boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Longest streak of consecutive days ending today (or yesterday).
function currentStreak(s: Snapshot): number {
  const days = new Set<string>();
  for (const ts of Object.values(s.completedAt)) {
    days.add(new Date(ts).toISOString().slice(0, 10));
  }
  if (days.size === 0) return 0;
  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    const d = new Date(s.now - i * DAY_MS).toISOString().slice(0, 10);
    if (days.has(d)) streak += 1;
    else if (i === 0) {
      // Allow missing today if yesterday is the most recent.
      continue;
    } else break;
  }
  return streak;
}

function completedLessonsCount(s: Snapshot): number {
  return Object.keys(s.completedAt).length;
}

function trackCompleted(s: Snapshot, trackId: string): boolean {
  const track = TRACKS.find((t) => t.id === trackId);
  if (!track) return false;
  return track.lessons.every((l) => s.completedAt[l.id]);
}

function anyTrackCompleted(s: Snapshot): boolean {
  return TRACKS.some((t) => trackCompleted(s, t.id));
}

function completedAtHour(s: Snapshot, predicate: (h: number) => boolean): boolean {
  for (const ts of Object.values(s.completedAt)) {
    const h = new Date(ts).getUTCHours();
    if (predicate(h)) return true;
  }
  return false;
}

function weekendDouble(s: Snapshot): boolean {
  // True if at least one Saturday AND one Sunday both have a completion in
  // the same ISO week (any week, not just current).
  const buckets = new Map<string, { sat: boolean; sun: boolean }>();
  for (const ts of Object.values(s.completedAt)) {
    const d = new Date(ts);
    const day = d.getUTCDay(); // 0=Sun, 6=Sat
    if (day !== 0 && day !== 6) continue;
    const isoWeek = `${d.getUTCFullYear()}-W${Math.floor(d.getUTCDate() / 7)}`;
    const cur = buckets.get(isoWeek) ?? { sat: false, sun: false };
    if (day === 6) cur.sat = true;
    if (day === 0) cur.sun = true;
    buckets.set(isoWeek, cur);
    if (cur.sat && cur.sun) return true;
  }
  return false;
}

function perfectQuiz(s: Snapshot): boolean {
  // At least one lesson completed with NO mistake row attached. The schema
  // logs a mistake only when the user gets a quiz wrong, so absence is
  // sufficient evidence of a perfect first attempt.
  const wrong = new Set(s.mistakes.map((m) => m.lesson_id));
  for (const lessonId of Object.keys(s.completedAt)) {
    if (!wrong.has(lessonId)) return true;
  }
  return false;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_lesson',
    tone: 'bronze',
    title: { fr: 'Première leçon', en: 'First lesson' },
    description: {
      fr: 'Vous avez terminé votre toute première leçon.',
      en: 'You completed your very first lesson.',
    },
    criteria: (s) => completedLessonsCount(s) >= 1,
  },
  {
    id: 'streak_7',
    tone: 'silver',
    title: { fr: 'Série de 7 jours', en: '7-day streak' },
    description: {
      fr: 'Sept jours consécutifs avec au moins une leçon.',
      en: 'Seven days in a row with at least one lesson.',
    },
    criteria: (s) => currentStreak(s) >= 7,
  },
  {
    id: 'streak_30',
    tone: 'gold',
    title: { fr: 'Série de 30 jours', en: '30-day streak' },
    description: {
      fr: 'Trente jours d’affilée. La discipline paie.',
      en: 'Thirty days in a row. Discipline pays off.',
    },
    criteria: (s) => currentStreak(s) >= 30,
  },
  {
    id: 'streak_100',
    tone: 'platinum',
    title: { fr: 'Série de 100 jours', en: '100-day streak' },
    description: {
      fr: 'Cent jours sans rater. Niveau pro.',
      en: 'A hundred days without missing. Pro tier.',
    },
    criteria: (s) => currentStreak(s) >= 100,
  },
  {
    id: 'ten_in_a_week',
    tone: 'silver',
    title: { fr: '10 leçons en 7 jours', en: '10 lessons in 7 days' },
    description: {
      fr: 'Vous avez fait dix leçons sur les sept derniers jours.',
      en: 'You completed ten lessons over the last seven days.',
    },
    criteria: (s) => {
      const cutoff = s.now - 7 * DAY_MS;
      let count = 0;
      for (const ts of Object.values(s.completedAt)) if (ts >= cutoff) count += 1;
      return count >= 10;
    },
  },
  {
    id: 'fifty_lessons',
    tone: 'silver',
    title: { fr: '50 leçons', en: '50 lessons' },
    description: {
      fr: 'Vous avez terminé cinquante leçons au total.',
      en: 'You crossed fifty completed lessons.',
    },
    criteria: (s) => completedLessonsCount(s) >= 50,
  },
  {
    id: 'hundred_lessons',
    tone: 'gold',
    title: { fr: '100 leçons', en: '100 lessons' },
    description: {
      fr: 'Cent leçons. Vous êtes à mi-parcours.',
      en: 'One hundred lessons. You’re halfway through.',
    },
    criteria: (s) => completedLessonsCount(s) >= 100,
  },
  {
    id: 'first_track_complete',
    tone: 'gold',
    title: { fr: 'Premier track terminé', en: 'First track completed' },
    description: {
      fr: 'Vous avez bouclé l’intégralité d’un module.',
      en: 'You finished an entire track end-to-end.',
    },
    criteria: anyTrackCompleted,
  },
  {
    id: 'perfect_quiz',
    tone: 'bronze',
    title: { fr: 'Quiz parfait', en: 'Perfect quiz' },
    description: {
      fr: 'Une leçon sans aucune erreur au quiz.',
      en: 'Cleared a quiz without a single wrong answer.',
    },
    criteria: perfectQuiz,
  },
  {
    id: 'early_bird',
    tone: 'bronze',
    title: { fr: 'Lève-tôt', en: 'Early bird' },
    description: {
      fr: 'Au moins une leçon avant 7h UTC.',
      en: 'At least one lesson before 7am UTC.',
    },
    criteria: (s) => completedAtHour(s, (h) => h < 7),
  },
  {
    id: 'night_owl',
    tone: 'bronze',
    title: { fr: 'Couche-tard', en: 'Night owl' },
    description: {
      fr: 'Au moins une leçon entre minuit et 4h UTC.',
      en: 'At least one lesson between midnight and 4am UTC.',
    },
    criteria: (s) => completedAtHour(s, (h) => h >= 0 && h < 4),
  },
  {
    id: 'weekend_warrior',
    tone: 'silver',
    title: { fr: 'Guerrier du week-end', en: 'Weekend warrior' },
    description: {
      fr: 'Samedi ET dimanche dans la même semaine.',
      en: 'Both Saturday AND Sunday in the same week.',
    },
    criteria: weekendDouble,
  },
];

export function buildSnapshot(args: {
  progress: ProgressRow[];
  mistakes: MistakeRow[];
  now?: number;
}): Snapshot {
  const completedAt: Record<string, number> = {};
  for (const r of args.progress) completedAt[r.lesson_id] = new Date(r.completed_at).getTime();
  return { completedAt, mistakes: args.mistakes, now: args.now ?? Date.now() };
}

export function evaluateAll(snapshot: Snapshot): string[] {
  return ACHIEVEMENTS.filter((a) => a.criteria(snapshot)).map((a) => a.id);
}

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
