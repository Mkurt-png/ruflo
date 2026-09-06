'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Check, X } from 'lucide-react';
import { TRACKS } from '@/lib/curriculum/data';
import { getLessonContent } from '@/lib/curriculum/lesson-content';
import { easeOutExpo } from '@/lib/motion';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    eyebrow: 'Carte du jour',
    title: 'Une question. Soixante secondes.',
    body: 'Tirée d’une leçon kNOWTrade. Identique pour tous, change tous les jours.',
    submit: 'Valider',
    correct: 'Bonne réponse.',
    incorrect: 'Pas tout à fait.',
    tomorrow: 'Reviens demain pour la suivante.',
    seeLesson: 'Voir la leçon',
    sourceLabel: 'Source',
  },
  en: {
    eyebrow: 'Card of the day',
    title: 'One question. Sixty seconds.',
    body: 'Drawn from a kNOWTrade lesson. Same for everyone, changes every day.',
    submit: 'Submit',
    correct: 'Correct.',
    incorrect: 'Not quite.',
    tomorrow: 'Come back tomorrow for the next.',
    seeLesson: 'See the lesson',
    sourceLabel: 'Source',
  },
};

// Stable index based on the day-of-year so the same card shows for everyone
// on the same date. Iterates all seeded quizzes (skipping placeholder ones).
function dayIndex(): number {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function DailyChallenge({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [choice, setChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const card = useMemo(() => {
    const all: Array<{
      lessonId: string;
      trackSlug: string;
      lessonSlug: string;
      lessonTitle: string;
      trackTitle: string;
      q: string;
      options: string[];
      correct: number;
      rationale: string;
    }> = [];
    for (const tr of TRACKS) {
      for (const lsn of tr.lessons) {
        const c = getLessonContent(tr, lsn);
        c.quiz.forEach((q) => {
          all.push({
            lessonId: lsn.id,
            trackSlug: tr.slug,
            lessonSlug: lsn.slug,
            lessonTitle: lsn.title[locale],
            trackTitle: tr.title[locale],
            q: q.q[locale],
            options: q.options[locale],
            correct: q.correct,
            rationale: q.rationale[locale],
          });
        });
      }
    }
    return all.length === 0 ? null : all[dayIndex() % all.length];
  }, [locale]);

  if (!card) return null;

  const isCorrect = choice === card.correct;

  return (
    <article className="rounded-sm border border-ink bg-ink p-7 text-canvas md:p-9">
      <div className="flex items-center gap-2.5">
        <Calendar aria-hidden className="h-4 w-4 text-canvas/70" strokeWidth={1.6} />
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-canvas/70">
          {t.eyebrow}
        </div>
      </div>
      <h2 className="mt-5 max-w-2xl font-display text-2xl font-medium tracking-tight text-balance md:text-3xl">
        {card.q}
      </h2>

      <ul className="mt-8 grid grid-cols-1 gap-2.5">
        {card.options.map((opt, i) => {
          const active = choice === i;
          const isRightRevealed = revealed && i === card.correct;
          const isWrongRevealed = revealed && active && i !== card.correct;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => !revealed && setChoice(i)}
                aria-pressed={active}
                className={cn(
                  'flex w-full items-start gap-4 rounded-sm border p-4 text-left transition-colors md:p-5',
                  revealed
                    ? isRightRevealed
                      ? 'border-up bg-up/20 text-canvas'
                      : isWrongRevealed
                        ? 'border-down bg-down/20 text-canvas'
                        : 'border-canvas/20 bg-ink text-canvas/60'
                    : active
                      ? 'border-canvas bg-canvas text-ink'
                      : 'border-canvas/20 bg-ink text-canvas hover:border-canvas',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border',
                    revealed && isRightRevealed && 'border-up bg-up text-canvas',
                    revealed && isWrongRevealed && 'border-down bg-down text-canvas',
                    !revealed && active && 'border-ink bg-ink text-canvas',
                    !revealed && !active && 'border-canvas/40',
                  )}
                >
                  {revealed && isRightRevealed ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
                  {revealed && isWrongRevealed ? <X className="h-3 w-3" strokeWidth={2.5} /> : null}
                </span>
                <span className="text-[15px] leading-snug">{opt}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {revealed ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeOutExpo }}
          className="mt-6 rounded-sm border border-canvas/20 bg-canvas/5 p-5"
        >
          <div className={cn('font-mono text-[11px] uppercase tracking-[0.22em]', isCorrect ? 'text-up' : 'text-down')}>
            {isCorrect ? t.correct : t.incorrect}
          </div>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-canvas/90">
            {card.rationale}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-canvas/60">
              {t.sourceLabel} · {card.trackTitle} · {card.lessonTitle}
            </span>
            <a
              href={`/${locale}/learn/${card.trackSlug}/${card.lessonSlug}`}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-canvas px-4 text-[13px] font-medium tracking-tight text-ink transition-colors hover:bg-canvas/90"
            >
              {t.seeLesson}
            </a>
          </div>
          <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-canvas/60">
            {t.tomorrow}
          </p>
        </motion.div>
      ) : (
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => choice !== null && setRevealed(true)}
            disabled={choice === null}
            className={cn(
              'inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-medium tracking-tight transition-colors',
              choice === null
                ? 'cursor-not-allowed bg-canvas/15 text-canvas/40'
                : 'bg-canvas text-ink hover:bg-canvas/90',
            )}
          >
            {t.submit}
          </button>
        </div>
      )}
    </article>
  );
}
