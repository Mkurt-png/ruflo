'use client';

// TICKRA-PHASE-1.5: surface due spaced-repetition reviews as a prominent
// banner on /me. Stays hidden when nothing is due so the dashboard remains
// clean.

import Link from 'next/link';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { useProgress } from '@/lib/progress/hook';
import { getReviewQueue, dueNow } from '@/lib/progress/review';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    label: 'À réviser maintenant',
    cta: 'Ouvrir la file',
    one: 'leçon',
    many: 'leçons',
    body: 'Vos erreurs reviennent au bon moment pour que vous les mémorisiez vraiment.',
  },
  en: {
    label: 'Due now',
    cta: 'Open the queue',
    one: 'lesson',
    many: 'lessons',
    body: 'Your mistakes resurface at the right time so they actually stick.',
  },
};

export function ReviewBanner({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { state, ready } = useProgress();
  if (!ready) return null;
  const queue = getReviewQueue(state.mistakes);
  const due = dueNow(queue);
  if (due.length === 0) return null;

  // Open the first due lesson straight away in review mode.
  const first = due[0];
  const href = `/${locale}/learn/${first.track.slug}/${first.lesson.slug}?mode=review`;

  return (
    <article className="overflow-hidden rounded-sm border border-brand/40 bg-gradient-to-r from-brand/15 to-accent/15 p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <span
          aria-hidden
          className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand text-canvas glow-brand"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-medium tracking-tight text-ink">
            {due.length} {due.length > 1 ? t.many : t.one} · {t.label}
          </div>
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{t.body}</p>
        </div>
        <Link
          href={href}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium tracking-tight text-canvas hover:brightness-110"
        >
          {t.cta}
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>
    </article>
  );
}
