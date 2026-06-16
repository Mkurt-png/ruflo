'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { GLOSSARY, categoryLabel, tagsFor, tagLabel, type GlossaryTerm } from '@/lib/curriculum/glossary';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';
type Cat = GlossaryTerm['category'] | 'all';

const placeholder = { fr: 'Chercher un terme…', en: 'Search a term…' };
const noResult = { fr: 'Aucun terme ne correspond.', en: 'No term matches.' };

export function GlossaryClient({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<Cat>('all');

  // If the reader deep-linked from <Term> (eg. /fr/glossary#stop-loss),
  // the active filter may hide the target. Reset to 'all' on mount and
  // re-scroll the matching <li> into view once it's rendered.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.location.hash) return;
    setCat('all');
    setQuery('');
    const id = window.location.hash.slice(1);
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ block: 'start' });
    });
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(GLOSSARY.map((g) => g.category)));
    return cats;
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY.filter((g) => {
      if (cat !== 'all' && g.category !== cat) return false;
      if (!q) return true;
      const hay = `${g.term[locale]} ${g.definition[locale]}`.toLowerCase();
      return hay.includes(q);
    });
  }, [cat, query, locale]);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            strokeWidth={1.6}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder[locale]}
            aria-label={placeholder[locale]}
            className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-5 text-[14.5px] text-ink placeholder:text-subtle focus-visible:border-ink focus-visible:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <CategoryButton active={cat === 'all'} onClick={() => setCat('all')}>
            {locale === 'fr' ? 'Tout' : 'All'}
          </CategoryButton>
          {categories.map((c) => (
            <CategoryButton key={c} active={cat === c} onClick={() => setCat(c)}>
              {categoryLabel(c, locale)}
            </CategoryButton>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-16 text-center text-[14.5px] text-muted"
        >
          {noResult[locale]}
        </p>
      ) : (
        <ul className="mt-12 divide-y divide-line border-y border-line">
          {results.map((g) => (
            <li
              key={g.term.en}
              id={encodeURIComponent(g.term[locale])}
              className="grid grid-cols-12 gap-x-6 gap-y-3 py-7 md:py-8 scroll-mt-24"
            >
              <div className="col-span-12 md:col-span-4">
                <h2 className="font-display text-xl font-medium tracking-tight text-ink md:text-2xl">
                  {g.term[locale]}
                </h2>
                <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted">
                  {categoryLabel(g.category, locale)}
                </div>
              </div>
              <div className="col-span-12 md:col-span-8">
                <p className="max-w-2xl text-[15.5px] leading-relaxed text-muted">
                  {g.definition[locale]}
                </p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {tagsFor(g).map((tag) => (
                    <li
                      key={tag}
                      className="inline-flex h-6 items-center rounded-full border border-line bg-canvas px-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted"
                    >
                      #{tagLabel(tag, locale)}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryButton({
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
        'inline-flex h-9 items-center rounded-full px-3.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
        active ? 'bg-ink text-canvas' : 'border border-line text-muted hover:border-ink hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
