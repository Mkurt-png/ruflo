// Achievements derived purely from the localStorage progress state.
// Each rule returns `true` once unlocked; the UI displays a sorted list
// with the unlock timestamp where computable.

import type { ProgressState } from '@/lib/progress/hook';
import { TRACKS, totalLessons } from '@/lib/curriculum/data';

export type Achievement = {
  id: string;
  title: { fr: string; en: string };
  body: { fr: string; en: string };
  unlocked: boolean;
  unlockedAt?: number;
};

function countCompleted(state: ProgressState): number {
  return Object.keys(state.completed).length;
}

function trackCompleted(state: ProgressState, trackSlug: string): boolean {
  const tr = TRACKS.find((t) => t.slug === trackSlug);
  if (!tr) return false;
  return tr.lessons.every((l) => state.completed[l.id]);
}

function longestDailyStreak(state: ProgressState): number {
  const days = new Set<string>();
  for (const ts of Object.values(state.completed)) {
    const d = new Date(ts);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.add(key);
  }
  const sorted = Array.from(days).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of sorted) {
    if (prev && isNextDay(prev, k)) run += 1;
    else run = 1;
    if (run > best) best = run;
    prev = k;
  }
  return best;
}

function isNextDay(prev: string, next: string): boolean {
  const a = new Date(prev);
  a.setDate(a.getDate() + 1);
  const key = `${a.getFullYear()}-${String(a.getMonth() + 1).padStart(2, '0')}-${String(a.getDate()).padStart(2, '0')}`;
  return key === next;
}

function earliestCompletedAt(state: ProgressState, ids: string[]): number | undefined {
  const stamps = ids.map((id) => state.completed[id]).filter((v): v is number => Boolean(v));
  if (stamps.length === 0 || stamps.length < ids.length) return undefined;
  return Math.max(...stamps);
}

export function deriveAchievements(state: ProgressState): Achievement[] {
  const done = countCompleted(state);
  const allIds = TRACKS.flatMap((t) => t.lessons.map((l) => l.id));
  const stamps = Object.values(state.completed).sort((a, b) => a - b);
  const firstStamp = stamps[0];

  const items: Achievement[] = [
    {
      id: 'first-lesson',
      title: { fr: 'Première leçon', en: 'First lesson' },
      body: { fr: 'La plus difficile est passée.', en: 'The hardest one is done.' },
      unlocked: done >= 1,
      unlockedAt: firstStamp,
    },
    {
      id: 'ten-lessons',
      title: { fr: 'Dix leçons', en: 'Ten lessons' },
      body: { fr: 'La régularité commence à payer.', en: 'Consistency starts to pay.' },
      unlocked: done >= 10,
      unlockedAt: stamps[9],
    },
    {
      id: 'fifty-lessons',
      title: { fr: 'Cinquante leçons', en: 'Fifty lessons' },
      body: { fr: 'Vous savez déjà plus que la moyenne du forum.', en: 'You already know more than the average forum.' },
      unlocked: done >= 50,
      unlockedAt: stamps[49],
    },
    {
      id: 'foundations-complete',
      title: { fr: 'Fondations terminées', en: 'Foundations complete' },
      body: { fr: 'Bougies + Structure + Risque. Le socle est là.', en: 'Candles + Structure + Risk. The base is in.' },
      unlocked:
        trackCompleted(state, 'japanese-candles') &&
        trackCompleted(state, 'market-structure') &&
        trackCompleted(state, 'risk-management'),
      unlockedAt: earliestCompletedAt(state, [
        ...TRACKS.find((t) => t.slug === 'japanese-candles')!.lessons.map((l) => l.id),
        ...TRACKS.find((t) => t.slug === 'market-structure')!.lessons.map((l) => l.id),
        ...TRACKS.find((t) => t.slug === 'risk-management')!.lessons.map((l) => l.id),
      ]),
    },
    {
      id: 'risk-master',
      title: { fr: 'Maître du risque', en: 'Risk master' },
      body: { fr: 'La piste Gestion du risque, dans sa totalité.', en: 'The whole Risk Management track.' },
      unlocked: trackCompleted(state, 'risk-management'),
      unlockedAt: earliestCompletedAt(
        state,
        TRACKS.find((t) => t.slug === 'risk-management')!.lessons.map((l) => l.id),
      ),
    },
    {
      id: 'streak-7',
      title: { fr: 'Sept jours d’affilée', en: 'Seven days in a row' },
      body: { fr: 'Une semaine pleine, sans rater un jour.', en: 'A full week, no missed day.' },
      unlocked: longestDailyStreak(state) >= 7,
    },
    {
      id: 'streak-30',
      title: { fr: 'Trente jours d’affilée', en: 'Thirty days in a row' },
      body: { fr: 'Le streak qui change l’œil.', en: 'The streak that changes the eye.' },
      unlocked: longestDailyStreak(state) >= 30,
    },
    {
      id: 'tickra-diploma',
      title: { fr: 'Diplôme kNOWTrade', en: 'kNOWTrade diploma' },
      body: { fr: 'Les 222 leçons. Direction le marché réel.', en: 'All 222 lessons. Off to live markets.' },
      unlocked: done >= totalLessons(),
      unlockedAt: earliestCompletedAt(state, allIds),
    },
  ];

  return items;
}
