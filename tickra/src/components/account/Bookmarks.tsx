'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import { useBookmarks } from '@/lib/progress/bookmarks';
import { TRACKS } from '@/lib/curriculum/data';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Favoris',
    subtitle: 'Les leçons que vous avez marquées pour y revenir.',
    empty: 'Aucun favori encore. Posez une étoile sur une leçon pour la retrouver ici.',
    counter: 'favoris',
    open: 'Ouvrir',
    all: 'Toutes',
  },
  en: {
    title: 'Bookmarks',
    subtitle: 'Lessons you starred to come back to.',
    empty: 'No bookmark yet. Star a lesson to find it here.',
    counter: 'starred',
    open: 'Open',
    all: 'All',
  },
};

export function Bookmarks({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { state, ready } = useBookmarks();
  const [trackFilter, setTrackFilter] = useState<string>('all');

  const items = useMemo(() => {
    if (!ready) return [];
    return Object.entries(state.bookmarks)
      .map(([id, ts]) => {
        for (const tr of TRACKS) {
          const l = tr.lessons.find((x) => x.id === id);
          if (l) return { track: tr, lesson: l, ts };
        }
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort((a, b) => b.ts - a.ts);
  }, [state, ready]);

  // Tracks that actually have at least one bookmark — only those are useful as
  // filter chips.
  const trackChoices = useMemo(() => {
    const map = new Map<string, { slug: string; title: string }>();
    for (const it of items) {
      if (!map.has(it.track.slug)) {
        map.set(it.track.slug, { slug: it.track.slug, title: it.track.title[locale] });
      }
    }
    return Array.from(map.values());
  }, [items, locale]);

  const filtered = trackFilter === 'all' ? items : items.filter((i) => i.track.slug === trackFilter);

  return (
    <article aria-labelledby="bookmarks-title" className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2.5">
          <Star aria-hidden className="h-4 w-4 text-ink" strokeWidth={1.6} />
          <h2 id="bookmarks-title" className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</h2>
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
        <>
          {trackChoices.length > 1 ? (
            <div className="mt-6 flex flex-wrap gap-1.5">
              <Pill active={trackFilter === 'all'} onClick={() => setTrackFilter('all')}>
                {t.all}
              </Pill>
              {trackChoices.map((c) => (
                <Pill
                  key={c.slug}
                  active={trackFilter === c.slug}
                  onClick={() => setTrackFilter(c.slug)}
                >
                  {c.title}
                </Pill>
              ))}
            </div>
          ) : null}

          <ul className="mt-6 divide-y divide-line border-y border-line">
            {filtered.slice(0, 12).map(({ track, lesson }) => (
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
        </>
      )}
    </article>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 items-center rounded-full px-3 font-mono text-[10.5px] uppercase tracking-[0.18em] transition-colors',
        active ? 'bg-ink text-canvas' : 'border border-line text-muted hover:border-ink hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
