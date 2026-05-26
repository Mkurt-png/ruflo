'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { TRACKS } from '@/lib/curriculum/data';
import { TrackProgress } from '@/components/learn/TrackProgress';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';

const levelLabel: Record<string, { fr: string; en: string }> = {
  foundations: { fr: 'Fondations', en: 'Foundations' },
  intermediate: { fr: 'Intermédiaire', en: 'Intermediate' },
  advanced: { fr: 'Avancé', en: 'Advanced' },
  mastery: { fr: 'Maîtrise', en: 'Mastery' },
};

const allLabel = { fr: 'Tout', en: 'All' };

export function TrackFilter({ locale }: { locale: Locale }) {
  const [level, setLevel] = useState<'all' | keyof typeof levelLabel>('all');

  const levels = useMemo(
    () => Array.from(new Set(TRACKS.map((t) => t.level))),
    [],
  );

  const filtered = level === 'all' ? TRACKS : TRACKS.filter((t) => t.level === level);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Pill active={level === 'all'} onClick={() => setLevel('all')}>
          {allLabel[locale]}
        </Pill>
        {levels.map((l) => (
          <Pill key={l} active={level === l} onClick={() => setLevel(l)}>
            {levelLabel[l][locale]}
          </Pill>
        ))}
      </div>

      <ul className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((track) => (
          <li key={track.id}>
            <Link
              href={`/${locale}/learn/${track.slug}`}
              className="group flex h-full flex-col justify-between rounded-sm border border-line bg-surface p-7 transition-colors hover:border-ink"
            >
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                    {levelLabel[track.level][locale]}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
                    × {track.lessons.length}
                  </span>
                </div>
                <h2 className="mt-4 font-display text-2xl font-medium tracking-tight text-balance text-ink">
                  {track.title[locale]}
                </h2>
                <p className="mt-3 max-w-sm text-[14.5px] leading-relaxed text-muted">
                  {track.summary[locale]}
                </p>
              </div>
              <div className="mt-8 flex items-end justify-between gap-4 border-t border-line pt-6">
                <TrackProgress lessonIds={track.lessons.map((l) => l.id)} locale={locale} />
                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                  strokeWidth={1.75}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
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
        'inline-flex h-9 items-center rounded-full px-3.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
        active ? 'bg-ink text-canvas' : 'border border-line text-muted hover:border-ink hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
