// ReadNext — petit bloc de cross-linking en pied de page éditoriale.
// Trois pièces apparentées (manuellement curatées), rendues en mode
// register : pastille mono « Suivant », trois lignes serif italiques
// avec une caption sobre. Aucun algo, juste la curation éditoriale.

import { useId } from 'react';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';

export type ReadNextRoom = {
  slug: string;
  title: { fr: string; en: string };
  caption: { fr: string; en: string };
};

const COPY = {
  fr: {
    eyebrow: 'À lire après',
    nothing: 'Plus rien à signaler pour aujourd’hui.',
  },
  en: {
    eyebrow: 'Read next',
    nothing: 'Nothing more to flag today.',
  },
} as const;

export function ReadNext({
  locale,
  rooms,
}: {
  locale: Locale;
  rooms: ReadNextRoom[];
}) {
  const t = COPY[locale];
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="mx-auto max-w-[920px] px-6 md:px-16 pb-32"
    >
      <header className="border-t border-black/15 pt-10">
        <p
          id={headingId}
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-black/65"
        >
          {t.eyebrow}
        </p>
      </header>
      {rooms.length === 0 ? (
        <p
          className="mt-6 font-display italic text-[#0E0E0E]/55 max-w-[640px]"
          style={{ fontSize: 'clamp(16px, 1.6vw, 19px)', lineHeight: 1.45 }}
        >
          {t.nothing}
        </p>
      ) : (
        <ol className="mt-8 divide-y divide-black/12">
          {rooms.map((r, i) => (
            <li key={r.slug}>
              <Link
                href={`/${locale}/${r.slug}`}
                className="grid grid-cols-[3ch_1fr] items-baseline gap-x-6 py-5 hover:bg-black/[0.02] -mx-3 px-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/80"
              >
                <span className="font-mono text-[10px] tracking-[0.22em] text-black/35 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p
                    className="font-display italic text-[#0E0E0E]"
                    style={{ fontSize: 'clamp(18px, 1.9vw, 22px)', letterSpacing: '-0.015em' }}
                  >
                    {r.title[locale]}
                  </p>
                  <p
                    className="mt-1 font-display text-[#0E0E0E]/65"
                    style={{ fontSize: 'clamp(13px, 1.3vw, 15.5px)', lineHeight: 1.4 }}
                  >
                    {r.caption[locale]}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default ReadNext;
