'use client';

import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { useProgress } from '@/lib/progress/hook';
import { TRACKS, totalLessons } from '@/lib/curriculum/data';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    eyebrowResume: 'Reprendre',
    eyebrowStart: 'Commencer',
    titleResume: 'Reprenez où vous en étiez.',
    titleStart: 'Première leçon.',
    cta: 'Continuer',
    ctaStart: 'Démarrer',
    progressLabel: 'Progression',
  },
  en: {
    eyebrowResume: 'Resume',
    eyebrowStart: 'Begin',
    titleResume: 'Pick up where you left off.',
    titleStart: 'First lesson.',
    cta: 'Continue',
    ctaStart: 'Start',
    progressLabel: 'Progress',
  },
};

export function LessonResumeCard({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { state, ready, completedCount } = useProgress();

  // Find the first incomplete lesson in curriculum order.
  let trackSlug = TRACKS[0].slug;
  let lesson = TRACKS[0].lessons[0];
  let trackTitle = TRACKS[0].title[locale];
  if (ready) {
    outer: for (const tr of TRACKS) {
      for (const l of tr.lessons) {
        if (!state.completed[l.id]) {
          trackSlug = tr.slug;
          lesson = l;
          trackTitle = tr.title[locale];
          break outer;
        }
      }
    }
  }

  const isResume = ready && completedCount > 0;
  const total = totalLessons();
  const ratio = total > 0 ? completedCount / total : 0;

  return (
    <article className="rounded-sm border border-ink bg-ink p-7 text-canvas md:p-10">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-canvas/60">
            {isResume ? t.eyebrowResume : t.eyebrowStart}
          </span>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
            {isResume ? t.titleResume : t.titleStart}
          </h2>
          <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-canvas/70">
            {trackTitle}
          </div>
          <div className="mt-1 font-display text-xl font-medium tracking-tight">
            {String(lesson.index).padStart(2, '0')} · {lesson.title[locale]}
          </div>
        </div>

        <div className="flex flex-col items-start gap-4 md:items-end">
          <div className="w-full md:w-64">
            <div aria-hidden className="h-1 w-full rounded-full bg-canvas/20">
              <div
                className="h-1 rounded-full bg-canvas transition-all"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </div>
            <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-canvas/70 md:text-right">
              {t.progressLabel} · {completedCount} / {total}
            </div>
          </div>

          <Link
            href={`/${locale}/learn/${trackSlug}/${lesson.slug}`}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-canvas px-6 text-[15px] font-medium tracking-tight text-ink transition-colors hover:bg-canvas/90"
          >
            {isResume ? (
              <>
                {t.cta}
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </>
            ) : (
              <>
                <Play aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                {t.ctaStart}
              </>
            )}
          </Link>
        </div>
      </div>
    </article>
  );
}
