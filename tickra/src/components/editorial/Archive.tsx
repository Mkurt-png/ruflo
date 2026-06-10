'use client';

// Archive — Index 03. The 200+ lessons as a typographic catalogue.
// Not cards. Not a grid. A long, sober list of track titles in giant
// italic serif, each row revealing a sample of its lessons on hover —
// the way a museum index card lifts when touched. Numbers run on the
// left in monospace; the lessons themselves appear as a faint column
// on the right when the row is active.

import { useState } from 'react';
import Link from 'next/link';
import { TRACKS, totalLessons } from '@/lib/curriculum/data';
import type { Locale } from '@/lib/i18n/config';

type Props = { locale: Locale };

export function Archive({ locale }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = totalLessons();

  return (
    <section
      aria-labelledby="archive"
      className="relative bg-black text-white border-t border-white/[0.06]"
    >
      <div className="ed-section">
        {/* Header strip — caption + a single numeric anchor */}
        <header className="px-8 md:px-16 flex items-end justify-between gap-12">
          <div>
            <span className="ed-tag text-white/40">
              {locale === 'fr' ? 'Salle 02 — Archive' : 'Room 02 — Archive'}
            </span>
            <h2
              id="archive"
              className="mt-8 ed-display text-white"
              style={{ fontSize: 'clamp(56px, 9vw, 132px)' }}
            >
              {locale === 'fr' ? 'Le fonds.' : 'The collection.'}
            </h2>
          </div>
          <div className="hidden md:block text-right pb-3">
            <span className="ed-tag text-white/30 tabular-nums">{TRACKS.length} pistes</span>
            <span className="ed-tag text-white/30 tabular-nums block mt-2">{total} leçons</span>
          </div>
        </header>

        {/* The list */}
        <ol className="mt-16 md:mt-28 border-t border-white/[0.06]">
          {TRACKS.map((track, i) => {
            const isOn = hovered === i;
            return (
              <li
                key={track.slug}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                className="border-b border-white/[0.06]"
              >
                <Link
                  href={`/${locale}/learn/${track.slug}`}
                  className="group block px-8 md:px-16 py-6 md:py-8 grid grid-cols-12 gap-x-6 items-baseline transition-colors hover:bg-white/[0.02]"
                >
                  <span className="col-span-2 md:col-span-1 ed-tag text-white/35 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <span
                    className="col-span-10 md:col-span-7 lg:col-span-6 ed-display text-white/90 group-hover:text-white transition-colors"
                    style={{ fontSize: 'clamp(28px, 4.4vw, 64px)' }}
                  >
                    {track.title[locale]}
                  </span>

                  <span className="hidden md:block md:col-span-3 lg:col-span-4 text-white/30 text-[12.5px] leading-snug pl-2">
                    {track.summary[locale]}
                  </span>

                  <span className="hidden lg:block lg:col-span-1 text-right ed-tag text-white/30 tabular-nums">
                    {track.lessons.length}
                  </span>
                </Link>

                {/* Lesson sampler — quietly appears when the row is hovered */}
                {isOn && (
                  <div
                    aria-hidden
                    className="hidden lg:grid px-8 md:px-16 pb-10 grid-cols-12 gap-x-6 -mt-2"
                  >
                    <ol className="col-start-2 col-span-9 grid grid-cols-2 gap-x-12 gap-y-2 text-white/45 text-[13.5px] tabular-nums leading-tight">
                      {track.lessons.slice(0, 8).map((l, k) => (
                        <li key={l.slug} className="truncate">
                          <span className="text-white/25 mr-3">
                            {String(k + 1).padStart(2, '0')}
                          </span>
                          {l.title[locale]}
                        </li>
                      ))}
                      {track.lessons.length > 8 ? (
                        <li className="text-white/30 italic">
                          + {track.lessons.length - 8} {locale === 'fr' ? 'autres entrées' : 'more entries'} →
                        </li>
                      ) : null}
                    </ol>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {/* End-of-list signature */}
        <footer className="px-8 md:px-16 mt-10 flex items-center justify-between">
          <span className="ed-tag text-white/35 tabular-nums">Fin de l’index</span>
          <Link
            href={`/${locale}/learn`}
            className="ed-tag text-white/70 hover:text-white transition-colors"
          >
            {locale === 'fr' ? 'Entrer dans le fonds ↘' : 'Enter the collection ↘'}
          </Link>
        </footer>
      </div>
    </section>
  );
}

export default Archive;
