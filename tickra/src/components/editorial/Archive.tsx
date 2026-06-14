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
      className="relative bg-[#F4F1EA] text-[#0E0E0E] border-t border-black/[0.08]"
    >
      <div className="ed-section">
        {/* Header strip — caption + a single numeric anchor */}
        <header className="px-6 md:px-16 flex items-end justify-between gap-12">
          <div>
            <span className="ed-tag text-black/50">
              {locale === 'fr' ? 'Salle 02 — Archive' : 'Room 02 — Archive'}
            </span>
            <h2
              id="archive"
              className="mt-8 ed-display text-[#0E0E0E]"
              style={{ fontSize: 'clamp(56px, 9vw, 132px)' }}
            >
              {locale === 'fr' ? 'Le fonds.' : 'The collection.'}
            </h2>
          </div>
          <div className="hidden md:block text-right pb-3">
            <span className="ed-tag text-black/40 tabular-nums">{TRACKS.length} pistes</span>
            <span className="ed-tag text-black/40 tabular-nums block mt-2">{total} leçons</span>
          </div>
        </header>

        {/* The list */}
        <ol className="mt-16 md:mt-28 border-t border-black/[0.08]">
          {TRACKS.map((track, i) => {
            const isOn = hovered === i;
            return (
              <li
                key={track.slug}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                className="border-b border-black/[0.08]"
              >
                <Link
                  href={`/${locale}/learn/${track.slug}`}
                  className="group block px-6 md:px-16 py-6 md:py-8 grid grid-cols-12 gap-x-6 items-baseline transition-colors hover:bg-black/[0.03]"
                >
                  <span className="col-span-2 md:col-span-1 ed-tag text-black/45 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <span
                    className="col-span-10 md:col-span-7 lg:col-span-6 ed-display text-[#0E0E0E]/90 group-hover:text-[#0E0E0E] transition-colors"
                    style={{ fontSize: 'clamp(28px, 4.4vw, 64px)' }}
                  >
                    {track.title[locale]}
                  </span>

                  <span className="hidden md:block md:col-span-3 lg:col-span-4 text-black/40 text-[12.5px] leading-snug pl-2">
                    {track.summary[locale]}
                  </span>

                  <span className="hidden lg:block lg:col-span-1 text-right ed-tag text-black/40 tabular-nums">
                    {track.lessons.length}
                  </span>
                </Link>

                {/* Lesson sampler — quietly appears when the row is hovered */}
                {isOn && (
                  <div
                    aria-hidden
                    className="hidden lg:grid px-6 md:px-16 pb-10 grid-cols-12 gap-x-6 -mt-2"
                  >
                    <ol className="col-start-2 col-span-9 grid grid-cols-2 gap-x-12 gap-y-2 text-black/55 text-[13.5px] tabular-nums leading-tight">
                      {track.lessons.slice(0, 8).map((l, k) => (
                        <li key={l.slug} className="truncate">
                          <span className="text-black/35 mr-3">
                            {String(k + 1).padStart(2, '0')}
                          </span>
                          {l.title[locale]}
                        </li>
                      ))}
                      {track.lessons.length > 8 ? (
                        <li className="text-black/40 italic">
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
        <footer className="px-6 md:px-16 mt-10 flex items-center justify-between">
          <span className="ed-tag text-black/45 tabular-nums">Fin de l’index</span>
          <Link
            href={`/${locale}/learn`}
            className="ed-tag text-black/70 hover:text-[#0E0E0E] transition-colors"
          >
            {locale === 'fr' ? 'Entrer dans le fonds ↘' : 'Enter the collection ↘'}
          </Link>
        </footer>
      </div>
    </section>
  );
}

