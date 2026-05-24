'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { cn } from '@/lib/cn';
import { easeOutExpo } from '@/lib/motion';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

type TrackKey = 'zero' | 'low' | 'mid' | 'high';

export function PlacementTest({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.onboarding;
  const total = t.questions.length;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => Array(total).fill(-1));
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => computeScore(t.questions, answers), [t.questions, answers]);
  const trackKey = pickTrack(score, total);
  const track = t.result.tracks[trackKey];

  const current = t.questions[step];
  const selected = answers[step];
  const canNext = selected >= 0;
  const isLast = step === total - 1;

  const setAnswer = (idx: number) => {
    setAnswers((prev) => prev.map((v, i) => (i === step ? idx : v)));
  };

  if (submitted) {
    return (
      <ResultCard
        dict={dict}
        locale={locale}
        score={score}
        total={t.questions.filter((q) => q.correct !== -1).length}
        track={track}
        onBack={() => setSubmitted(false)}
      />
    );
  }

  return (
    <div className="rounded-sm border border-line bg-surface p-6 md:p-10">
      <div className="flex items-center justify-between border-b border-line pb-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {t.progress.replace('{n}', String(step + 1)).replace('{total}', String(total))}
        </span>
        <ProgressDots total={total} active={step} answered={answers.map((a) => a >= 0)} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: easeOutExpo }}
        >
          <h2 className="mt-10 font-display text-2xl font-medium tracking-tight text-balance text-ink md:text-3xl">
            {current.q}
          </h2>

          <ul className="mt-8 grid grid-cols-1 gap-2.5">
            {current.options.map((opt, i) => {
              const active = selected === i;
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setAnswer(i)}
                    aria-pressed={active}
                    className={cn(
                      'group flex w-full items-start gap-4 rounded-sm border p-4 text-left transition-colors md:p-5',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
                      active
                        ? 'border-ink bg-ink text-canvas'
                        : 'border-line bg-canvas text-ink hover:border-ink',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border',
                        active ? 'border-canvas bg-canvas text-ink' : 'border-line group-hover:border-ink',
                      )}
                    >
                      {active ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
                    </span>
                    <span className="text-[15px] leading-snug">{opt}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className={cn(
            'inline-flex items-center gap-2 text-[14px] transition-colors',
            step === 0
              ? 'cursor-not-allowed text-subtle'
              : 'text-muted hover:text-ink focus-visible:text-ink',
          )}
        >
          <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          {t.back}
        </button>

        <button
          type="button"
          onClick={() => {
            if (!canNext) return;
            if (isLast) setSubmitted(true);
            else setStep((s) => s + 1);
          }}
          disabled={!canNext}
          className={cn(
            'inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-medium tracking-tight transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
            canNext
              ? 'bg-ink text-canvas hover:bg-ink/90'
              : 'cursor-not-allowed bg-line text-subtle',
          )}
        >
          {isLast ? t.submit : t.next}
          <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <p className="mt-8 text-center font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
        {t.legal}
      </p>
    </div>
  );
}

function ProgressDots({
  total,
  active,
  answered,
}: {
  total: number;
  active: number;
  answered: boolean[];
}) {
  return (
    <div aria-hidden className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 w-6 rounded-full transition-colors',
            i === active
              ? 'bg-ink'
              : answered[i]
                ? 'bg-muted'
                : 'bg-line',
          )}
        />
      ))}
    </div>
  );
}

function computeScore(
  questions: Dictionary['onboarding']['questions'],
  answers: number[],
): number {
  let s = 0;
  questions.forEach((q, i) => {
    if (q.correct === -1) return;
    if (answers[i] === q.correct) s += 1;
  });
  return s;
}

function pickTrack(score: number, _total: number): TrackKey {
  if (score <= 1) return 'zero';
  if (score === 2) return 'low';
  if (score === 3) return 'mid';
  return 'high';
}

function ResultCard({
  dict,
  locale,
  score,
  total,
  track,
  onBack,
}: {
  dict: Dictionary;
  locale: Locale;
  score: number;
  total: number;
  track: { name: string; body: string };
  onBack: () => void;
}) {
  const t = dict.onboarding.result;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOutExpo }}
      className="rounded-sm border border-ink bg-ink p-8 text-canvas md:p-12"
    >
      <Eyebrow>
        <span className="text-canvas/70">{t.title}</span>
      </Eyebrow>

      <h2 className="mt-6 font-display text-display-md font-medium tracking-tight text-balance">
        {track.name}
      </h2>
      <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-canvas/80">{track.body}</p>

      <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-canvas/30 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-canvas/80">
        <Sparkles aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
        {t.score.replace('{score}', String(score)).replace('{total}', String(total))}
      </div>

      <p className="mt-10 max-w-xl text-[15px] leading-relaxed text-canvas/70">{t.subtitle}</p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link
          href={`/${locale}/signin`}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-canvas px-6 text-[15px] font-medium tracking-tight text-ink transition-colors hover:bg-canvas/90"
        >
          {t.cta}
          <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-12 items-center gap-2 rounded-full border border-canvas/30 px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:border-canvas hover:bg-canvas hover:text-ink"
        >
          {t.back}
        </button>
      </div>
    </motion.div>
  );
}

