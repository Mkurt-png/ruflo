'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { searchIndex } from '@/lib/curriculum/search';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Pour aller plus loin',
  },
  en: {
    title: 'Dig deeper',
  },
};

// Light "related content" surface shown when a quiz answer is wrong.
// We pull a couple of full-text matches from the lesson title — enough to
// nudge the learner without distracting from the rationale they're reading.

export function QuizSuggestions({
  lessonId,
  query,
  locale,
}: {
  lessonId: string;
  query: string;
  locale: Locale;
}) {
  const matches = searchIndex(query, locale, 4).filter((m) => !m.id.endsWith(lessonId));
  if (matches.length === 0) return null;

  const t = copy[locale];
  return (
    <div className="mt-5 border-t border-line/60 pt-5">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
      <ul className="mt-3 grid grid-cols-1 gap-2">
        {matches.slice(0, 3).map((m) => (
          <li key={m.id}>
            <Link
              href={m.href[locale]}
              className="group flex items-start gap-3 rounded-sm border border-line/60 bg-canvas p-3 transition-colors hover:border-ink"
            >
              <span
                aria-hidden
                className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] text-ink">{m.label[locale]}</span>
                {m.snippet ? (
                  <span className="mt-0.5 block truncate text-[12px] text-muted">
                    {m.snippet[locale]}
                  </span>
                ) : null}
              </span>
              <ArrowUpRight
                aria-hidden
                className="h-3.5 w-3.5 flex-shrink-0 text-subtle transition-colors group-hover:text-ink"
                strokeWidth={1.75}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
