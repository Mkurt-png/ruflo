'use client';

import Link from 'next/link';
import { Award, ArrowRight, Lock } from 'lucide-react';
import { useProgress } from '@/lib/progress/hook';
import { TRACKS } from '@/lib/curriculum/data';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Certificats de piste',
    subtitle: 'Un mini‑diplôme par piste validée. Le diplôme kNOWTrade final à la 222.',
    counter: 'obtenus',
    earnedAt: 'Obtenu le',
    resume: 'Reprendre',
    levelLabel: { foundations: 'Fondations', intermediate: 'Intermédiaire', advanced: 'Avancé', mastery: 'Maîtrise' },
  },
  en: {
    title: 'Track certificates',
    subtitle: 'One mini‑diploma per completed track. The final kNOWTrade diploma at 222.',
    counter: 'earned',
    earnedAt: 'Earned on',
    resume: 'Resume',
    levelLabel: { foundations: 'Foundations', intermediate: 'Intermediate', advanced: 'Advanced', mastery: 'Mastery' },
  },
};

export function TrackCertificates({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { state, ready } = useProgress();

  const items = TRACKS.map((tr) => {
    if (!ready) return { tr, done: false, earnedAt: null as number | null };
    const stamps = tr.lessons
      .map((l) => state.completed[l.id])
      .filter((v): v is number => Boolean(v));
    const done = stamps.length === tr.lessons.length;
    const earnedAt = done && stamps.length > 0 ? Math.max(...stamps) : null;
    return { tr, done, earnedAt };
  });

  const total = items.length;
  const earned = items.filter((i) => i.done).length;

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
          {earned} / {total} {t.counter}
        </div>
      </div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.subtitle}</p>

      <ul className="mt-8 grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {items.map(({ tr, done, earnedAt }) => (
          <li key={tr.id}>
            <Link
              href={done ? `/${locale}/certificate/${tr.slug}` : `/${locale}/learn/${tr.slug}`}
              className={cn(
                'group flex h-full flex-col gap-4 rounded-sm border p-5 transition-colors',
                done ? 'border-ink bg-elevated hover:bg-ink hover:text-canvas' : 'border-line/60 bg-canvas hover:border-line',
              )}
            >
              <div className="flex items-start justify-between">
                <span
                  aria-hidden
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border',
                    done ? 'border-ink bg-ink text-canvas group-hover:border-canvas group-hover:bg-canvas group-hover:text-ink' : 'border-line bg-surface text-subtle',
                  )}
                >
                  {done ? <Award className="h-4 w-4" strokeWidth={1.6} /> : <Lock className="h-3.5 w-3.5" strokeWidth={1.6} />}
                </span>
                <span
                  className={cn(
                    'font-mono text-[10.5px] uppercase tracking-[0.18em]',
                    done ? 'text-muted group-hover:text-canvas/70' : 'text-subtle',
                  )}
                >
                  {t.levelLabel[tr.level]}
                </span>
              </div>

              <div>
                <div
                  className={cn(
                    'font-display text-[16px] font-medium tracking-tight',
                    done ? 'text-ink group-hover:text-canvas' : 'text-muted',
                  )}
                >
                  {tr.title[locale]}
                </div>
                <div
                  className={cn(
                    'mt-1 font-mono text-[10.5px] uppercase tracking-[0.18em]',
                    done ? 'text-muted group-hover:text-canvas/60' : 'text-subtle',
                  )}
                >
                  {done && earnedAt
                    ? `${t.earnedAt} ${formatDate(earnedAt, locale)}`
                    : `${tr.lessons.filter((l) => state.completed[l.id]).length} / ${tr.lessons.length}`}
                </div>
              </div>

              <span
                className={cn(
                  'mt-auto inline-flex items-center gap-1.5 text-[12.5px]',
                  done ? 'text-ink group-hover:text-canvas' : 'text-muted',
                )}
              >
                {t.resume}
                <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}

function formatDate(ts: number, locale: 'fr' | 'en'): string {
  return new Date(ts).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
