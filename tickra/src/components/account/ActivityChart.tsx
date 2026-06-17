'use client';

import { useMemo } from 'react';
import { useProgress } from '@/lib/progress/hook';

type Locale = 'fr' | 'en';

const DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

const copy = {
  fr: {
    title: 'Activité',
    subtitle: '90 derniers jours. Une barre par jour, hauteur = nombre de leçons terminées.',
    none: 'Pas encore d’activité. Une leçon par jour pendant 90 jours change l’œil.',
    daysActive: 'jours actifs',
    peak: 'pic',
  },
  en: {
    title: 'Activity',
    subtitle: 'Last 90 days. One bar per day, height = lessons completed.',
    none: 'No activity yet. One lesson a day for 90 days changes the eye.',
    daysActive: 'active days',
    peak: 'peak',
  },
};

export function ActivityChart({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { state, ready } = useProgress();

  const data = useMemo(() => {
    const counts = new Array(DAYS).fill(0) as number[];
    if (!ready) return { counts, daysActive: 0, peak: 0 };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = now.getTime() - (DAYS - 1) * DAY_MS;

    for (const ts of Object.values(state.completed)) {
      if (ts < start) continue;
      const day = new Date(ts);
      day.setHours(0, 0, 0, 0);
      const idx = Math.round((day.getTime() - start) / DAY_MS);
      if (idx >= 0 && idx < DAYS) counts[idx] += 1;
    }
    const daysActive = counts.filter((c) => c > 0).length;
    const peak = counts.reduce((m, c) => (c > m ? c : m), 0);
    return { counts, daysActive, peak };
  }, [state, ready]);

  const max = Math.max(1, data.peak);

  return (
    <article aria-labelledby="activity-chart-title" className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="flex items-baseline justify-between">
        <h2 id="activity-chart-title" className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</h2>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
          {data.daysActive} {t.daysActive} · {t.peak} {data.peak}
        </div>
      </div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.subtitle}</p>

      <div className="mt-8">
        <ul
          aria-hidden
          className="flex h-24 items-end gap-[3px]"
        >
          {data.counts.map((c, i) => {
            const ratio = c / max;
            return (
              <li
                key={i}
                title={`${c}`}
                className="flex-1"
                style={{ height: c === 0 ? '4px' : `${Math.max(8, Math.round(ratio * 100))}%` }}
              >
                <span
                  className={
                    c === 0
                      ? 'block h-full w-full rounded-[2px] bg-line'
                      : 'block h-full w-full rounded-[2px] bg-ink'
                  }
                />
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex justify-between font-mono text-[10.5px] uppercase tracking-[0.18em] text-subtle">
          <span>−{DAYS} j</span>
          <span>{locale === 'fr' ? 'aujourd’hui' : 'today'}</span>
        </div>
      </div>

      {data.daysActive === 0 ? (
        <p className="mt-6 text-[13px] text-subtle">{t.none}</p>
      ) : null}
    </article>
  );
}
