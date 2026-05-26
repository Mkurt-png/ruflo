'use client';

import { useProgress } from '@/lib/progress/hook';
import { TRACKS } from '@/lib/curriculum/data';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Carte du curriculum',
    subtitle: 'Une cellule par leçon, une ligne par piste. Noir = validé.',
    completed: 'validées',
  },
  en: {
    title: 'Curriculum map',
    subtitle: 'One cell per lesson, one row per track. Black = done.',
    completed: 'completed',
  },
};

export function CurriculumHeatmap({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { state, ready } = useProgress();

  const total = TRACKS.reduce((n, tr) => n + tr.lessons.length, 0);
  const done = ready ? TRACKS.reduce(
    (n, tr) => n + tr.lessons.filter((l) => state.completed[l.id]).length,
    0,
  ) : 0;

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
          {done} / {total} {t.completed}
        </div>
      </div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.subtitle}</p>

      <ol className="mt-8 space-y-2.5">
        {TRACKS.map((tr) => (
          <li key={tr.id} className="grid grid-cols-12 items-center gap-x-4">
            <span className="col-span-12 truncate font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted md:col-span-3">
              {tr.title[locale]}
            </span>
            <ul className="col-span-12 flex flex-wrap gap-[3px] md:col-span-9">
              {tr.lessons.map((l) => {
                const isDone = ready && Boolean(state.completed[l.id]);
                return (
                  <li
                    key={l.id}
                    title={`${String(l.index).padStart(2, '0')} · ${l.title[locale]}`}
                    className={cn(
                      'h-4 w-4 rounded-[2px]',
                      isDone ? 'bg-ink' : 'border border-line bg-canvas',
                    )}
                  />
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </article>
  );
}
