'use client';

import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import { useBookmarks } from '@/lib/progress/bookmarks';
import { TRACKS } from '@/lib/curriculum/data';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Favoris',
    subtitle: 'Les leçons que vous avez marquées pour y revenir.',
    empty: 'Aucun favori encore. Posez une étoile sur une leçon pour la retrouver ici.',
    counter: 'favoris',
    open: 'Ouvrir',
  },
  en: {
    title: 'Bookmarks',
    subtitle: 'Lessons you starred to come back to.',
    empty: 'No bookmark yet. Star a lesson to find it here.',
    counter: 'starred',
    open: 'Open',
  },
};

export function Bookmarks({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { state, ready } = useBookmarks();

  const items = ready
    ? Object.entries(state.bookmarks)
        .map(([id, ts]) => {
          for (const tr of TRACKS) {
            const l = tr.lessons.find((x) => x.id === id);
            if (l) return { track: tr, lesson: l, ts };
          }
          return null;
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
        .sort((a, b) => b.ts - a.ts)
    : [];

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2.5">
          <Star aria-hidden className="h-4 w-4 text-ink" strokeWidth={1.6} />
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
        </div>
        {items.length > 0 ? (
          <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
            {items.length} {t.counter}
          </div>
        ) : null}
      </div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.subtitle}</p>

      {items.length === 0 ? (
        <p className="mt-8 text-[13px] text-subtle">{t.empty}</p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {items.slice(0, 8).map(({ track, lesson }) => (
            <li key={lesson.id} className="grid grid-cols-12 items-center gap-x-4 py-4">
              <span className="col-span-2 font-mono text-[12px] tabular-nums uppercase tracking-[0.18em] text-subtle md:col-span-1">
                {String(lesson.index).padStart(2, '0')}
              </span>
              <span className="col-span-10 md:col-span-9">
                <div className="text-[14.5px] text-ink">{lesson.title[locale]}</div>
                <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-subtle">
                  {track.title[locale]}
                </div>
              </span>
              <Link
                href={`/${locale}/learn/${track.slug}/${lesson.slug}`}
                className="col-span-12 inline-flex h-9 items-center justify-end gap-2 text-[13.5px] text-ink transition-colors hover:text-muted md:col-span-2"
              >
                {t.open}
                <ArrowRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
