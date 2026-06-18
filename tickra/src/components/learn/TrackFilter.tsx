'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { TRACKS } from '@/lib/curriculum/data';
import { TrackProgress } from '@/components/learn/TrackProgress';
import { FREE_LESSON_LIMIT } from '@/lib/curriculum/entitlement';
import { useUser } from '@/lib/auth/useUser';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';

const levelLabel: Record<string, { fr: string; en: string }> = {
  foundations: { fr: 'Fondations', en: 'Foundations' },
  intermediate: { fr: 'Intermédiaire', en: 'Intermediate' },
  advanced: { fr: 'Avancé', en: 'Advanced' },
  mastery: { fr: 'Maîtrise', en: 'Mastery' },
};

// TICKRA-DESIGN: coloured token per curriculum level — reuses --up/--brand/--accent/--down.
const levelStyle: Record<string, { dot: string; bar: string }> = {
  foundations: { dot: 'bg-up', bar: 'bg-up' },
  intermediate: { dot: 'bg-brand', bar: 'bg-brand' },
  advanced: { dot: 'bg-down', bar: 'bg-down' },
  mastery: { dot: 'bg-accent', bar: 'bg-accent' },
};

const allLabel = { fr: 'Tout', en: 'All' };
const filterLabel = { fr: 'Filtrer par niveau', en: 'Filter by level' };

export function TrackFilter({ locale }: { locale: Locale }) {
  const [level, setLevel] = useState<'all' | keyof typeof levelLabel>('all');
  const { plan } = useUser();
  const isFree = plan === 'free';

  const levels = useMemo(
    () => Array.from(new Set(TRACKS.map((t) => t.level))),
    [],
  );

  const filtered = level === 'all' ? TRACKS : TRACKS.filter((t) => t.level === level);

  // Pre-compute the global starting index of each track so we can decide
  // whether the whole track sits beyond the free-tier limit.
  const startIndex = useMemo(() => {
    const map = new Map<string, number>();
    let n = 0;
    for (const t of TRACKS) {
      map.set(t.slug, n + 1);
      n += t.lessons.length;
    }
    return map;
  }, []);

  return (
    <div>
      <div role="group" aria-label={filterLabel[locale]} className="flex flex-wrap items-center gap-2">
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
        {filtered.map((track) => {
          const start = startIndex.get(track.slug) ?? 1;
          const locked = isFree && start > FREE_LESSON_LIMIT;
          const palette = levelStyle[track.level] ?? levelStyle.foundations;
          return (
            <li key={track.id}>
              {/* TICKRA-DESIGN: track card — coloured level dot + bottom bar + hover lift + locked dimmer. */}
              <Link
                href={`/${locale}/learn/${track.slug}`}
                className={cn(
                  'group relative flex h-full flex-col justify-between overflow-hidden rounded-sm border border-line bg-surface p-7 transition-all duration-200 ease-out',
                  'hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_10px_30px_-12px_rgba(27,29,51,0.18)]',
                  locked && 'opacity-60',
                )}
              >
                <div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                      <span aria-hidden className={cn('inline-block h-2 w-2 rounded-full', palette.dot)} />
                      {levelLabel[track.level][locale]}
                    </span>
                    <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
                      {locked ? <Lock aria-hidden className="h-3 w-3" strokeWidth={2} /> : null}
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
                <span
                  aria-hidden
                  className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-[3px]', palette.bar)}
                />
              </Link>
            </li>
          );
        })}
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
