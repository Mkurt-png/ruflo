'use client';

import Link from 'next/link';
import { ArrowRight, Clock, RotateCcw } from 'lucide-react';
import { useProgress } from '@/lib/progress/hook';
import { getReviewQueue, dueNow } from '@/lib/progress/review';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'À réviser',
    subtitle: 'Les leçons sur lesquelles vous vous êtes trompé reviennent après 3, 7, 14, 30, 90 jours.',
    empty: 'Aucune leçon à réviser. Continuez à progresser, tout va bien.',
    due: 'À réviser maintenant',
    upcoming: 'Programmé',
    review: 'Réviser',
    counter: 'à réviser',
  },
  en: {
    title: 'To review',
    subtitle: 'Lessons you missed come back after 3, 7, 14, 30, 90 days.',
    empty: 'Nothing to review. Keep going, you’re on track.',
    due: 'Due now',
    upcoming: 'Scheduled',
    review: 'Review',
    counter: 'to review',
  },
};

export function ReviewQueue({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { state, ready } = useProgress();
  const queue = ready ? getReviewQueue(state.mistakes) : [];
  const due = dueNow(queue);

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
        {queue.length > 0 ? (
          <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
            {due.length} / {queue.length} {t.counter}
          </div>
        ) : null}
      </div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.subtitle}</p>

      {queue.length === 0 ? (
        <p className="mt-8 text-[13px] text-subtle">{t.empty}</p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {queue.slice(0, 6).map((q) => {
            const isDue = q.dueAt <= Date.now();
            return (
              <li key={q.lesson.id} className="grid grid-cols-12 items-center gap-x-4 gap-y-2 py-4">
                <span className="col-span-2 font-mono text-[12px] tabular-nums uppercase tracking-[0.18em] text-subtle md:col-span-1">
                  {String(q.lesson.index).padStart(2, '0')}
                </span>
                <span className="col-span-10 md:col-span-7">
                  <div className="text-[14.5px] text-ink">{q.lesson.title[locale]}</div>
                  <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-subtle">
                    {q.track.title[locale]}
                  </div>
                </span>
                <span
                  className={cn(
                    'col-span-6 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] md:col-span-2',
                    isDue ? 'text-ink' : 'text-subtle',
                  )}
                >
                  {isDue ? (
                    <RotateCcw aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                  ) : (
                    <Clock aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
                  )}
                  {isDue ? t.due : formatRelative(q.dueAt, locale)}
                </span>
                <Link
                  href={`/${locale}/learn/${q.track.slug}/${q.lesson.slug}`}
                  className="col-span-6 inline-flex h-9 items-center justify-end gap-2 text-[13.5px] text-ink transition-colors hover:text-muted md:col-span-2 md:justify-end"
                >
                  {t.review}
                  <ArrowRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

function formatRelative(at: number, locale: 'fr' | 'en'): string {
  const days = Math.round((at - Date.now()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return locale === 'fr' ? 'à réviser' : 'due';
  if (days === 1) return locale === 'fr' ? 'dans 1 j' : 'in 1 d';
  return locale === 'fr' ? `dans ${days} j` : `in ${days} d`;
}
