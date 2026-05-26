'use client';

import { useMemo } from 'react';
import { useProgress } from '@/lib/progress/hook';
import { TRACKS } from '@/lib/curriculum/data';

type Locale = 'fr' | 'en';

// Tickra promises ~10 minutes per lesson — we use that as the basis for time-
// spent estimates. Estimate stays honest because it is labelled as such.
const MINUTES_PER_LESSON = 10;

const copy = {
  fr: {
    title: 'Vue d’ensemble',
    lessons: 'Leçons',
    days: 'Jours actifs',
    tracks: 'Pistes commencées',
    minutes: 'Minutes (estim.)',
  },
  en: {
    title: 'Lifetime stats',
    lessons: 'Lessons',
    days: 'Active days',
    tracks: 'Tracks started',
    minutes: 'Minutes (est.)',
  },
};

export function LifetimeStats({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { state, ready } = useProgress();

  const stats = useMemo(() => {
    if (!ready) return { lessons: 0, days: 0, tracks: 0, minutes: 0 };
    const lessons = Object.keys(state.completed).length;
    const days = new Set(
      Object.values(state.completed).map((ts) => new Date(ts).toDateString()),
    ).size;
    const tracks = TRACKS.filter((tr) =>
      tr.lessons.some((l) => state.completed[l.id]),
    ).length;
    const minutes = lessons * MINUTES_PER_LESSON;
    return { lessons, days, tracks, minutes };
  }, [state, ready]);

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-sm bg-line md:grid-cols-4">
        <Stat label={t.lessons} value={String(stats.lessons)} />
        <Stat label={t.days} value={String(stats.days)} />
        <Stat label={t.tracks} value={String(stats.tracks)} />
        <Stat label={t.minutes} value={formatMinutes(stats.minutes, locale)} />
      </dl>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 bg-surface p-5">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted">{label}</span>
      <span className="font-display text-3xl font-medium tracking-tight tabular-nums text-ink">
        {value}
      </span>
    </div>
  );
}

function formatMinutes(m: number, locale: Locale): string {
  if (m < 60) return `${m}`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return locale === 'fr' ? `${h} h ${r > 0 ? r : ''}`.trim() : `${h} h ${r > 0 ? r : ''}`.trim();
}
