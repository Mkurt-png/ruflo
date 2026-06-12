'use client';

// Client search over the in-page SEARCH_INDEX. No network, no fuse.
// Lexical accent-insensitive match, grouped by kind. The index is
// passed in via props (server -> client) so the page can build it
// at request time.

import { useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import { type SearchEntry, normalizeQuery } from '@/lib/tickra/recherche-index';

type Locale = 'fr' | 'en';

const COPY = {
  fr: {
    placeholder: 'Cherchez un mot, une leçon, une pièce…',
    nothing: 'Rien ne correspond. Reformulez en moins de mots.',
    intro: 'Indexée localement : leçons, pièces éditoriales, glossaire. La recherche se fait dans votre navigateur — aucune requête envoyée.',
    counts: (n: number, total: number) =>
      `${n} sur ${total} entrées correspondent.`,
    headings: { piece: 'Pièces éditoriales', lesson: 'Leçons', term: 'Glossaire' },
  },
  en: {
    placeholder: 'Search a word, a lesson, a room…',
    nothing: 'Nothing matches. Try fewer words.',
    intro: 'Indexed locally: lessons, editorial rooms, glossary. The search runs in your browser — no request is sent.',
    counts: (n: number, total: number) =>
      `${n} of ${total} entries match.`,
    headings: { piece: 'Editorial rooms', lesson: 'Lessons', term: 'Glossary' },
  },
} as const;

const KIND_ORDER: Array<SearchEntry['kind']> = ['piece', 'lesson', 'term'];

export function RechercheClient({
  index,
  locale,
}: {
  index: SearchEntry[];
  locale: Locale;
}) {
  const [q, setQ] = useState('');
  const deferred = useDeferredValue(q);
  const t = COPY[locale];

  const results = useMemo(() => {
    const needle = normalizeQuery(deferred);
    if (!needle) return [];
    const tokens = needle.split(/\s+/).filter(Boolean);
    return index.filter((e) =>
      tokens.every((tok) => e.haystack[locale].includes(tok)),
    );
  }, [deferred, index, locale]);

  const grouped = useMemo(() => {
    const buckets: Record<SearchEntry['kind'], SearchEntry[]> = {
      piece: [],
      lesson: [],
      term: [],
    };
    for (const r of results) buckets[r.kind].push(r);
    return buckets;
  }, [results]);

  const showResults = q.trim().length > 0;

  return (
    <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
      <div className="border-b border-black/15 pb-2 mt-12">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.placeholder}
          autoFocus
          aria-label={t.placeholder}
          className="w-full bg-transparent py-4 font-display italic text-[#0E0E0E] outline-none placeholder:text-black/35 focus-visible:outline-none"
          style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', letterSpacing: '-0.02em' }}
        />
      </div>

      <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.28em] text-black/65 tabular-nums">
        {showResults ? t.counts(results.length, index.length) : t.intro}
      </p>

      {showResults && results.length === 0 && (
        <p
          className="mt-16 font-display italic text-[#0E0E0E]/65 max-w-[640px]"
          style={{ fontSize: 'clamp(18px, 2vw, 24px)', lineHeight: 1.3 }}
        >
          {t.nothing}
        </p>
      )}

      {showResults && results.length > 0 && (
        <div className="mt-12 space-y-16">
          {KIND_ORDER.filter((k) => grouped[k].length > 0).map((k) => (
            <section key={k} aria-labelledby={`grp-${k}`}>
              <h2
                id={`grp-${k}`}
                className="font-mono text-[10px] uppercase tracking-[0.32em] text-black/65 border-b border-black/15 pb-3"
              >
                {t.headings[k]} · {grouped[k].length}
              </h2>
              <ol className="mt-6 divide-y divide-black/12">
                {grouped[k].slice(0, 40).map((e) => (
                  <li key={e.href}>
                    <Link
                      href={e.href.replace('__LOCALE__', locale)}
                      className="block py-3 hover:bg-black/[0.02] -mx-3 px-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/80"
                    >
                      <p
                        className="font-display italic text-[#0E0E0E]"
                        style={{ fontSize: 'clamp(17px, 1.8vw, 21px)', letterSpacing: '-0.015em' }}
                      >
                        {e.title[locale]}
                      </p>
                      <p
                        className="mt-1 font-display text-[#0E0E0E]/65 text-balance"
                        style={{ fontSize: 'clamp(13px, 1.3vw, 15.5px)', lineHeight: 1.4 }}
                      >
                        {e.caption[locale]}
                      </p>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

export default RechercheClient;
