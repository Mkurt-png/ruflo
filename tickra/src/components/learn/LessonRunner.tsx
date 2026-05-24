'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { useProgress } from '@/lib/progress/hook';
import { easeOutExpo } from '@/lib/motion';
import { cn } from '@/lib/cn';
import type { LessonContent } from '@/lib/curriculum/lesson-content';
import type { LessonMeta, TrackMeta } from '@/lib/curriculum/data';

type Locale = 'fr' | 'en';

type Neighbour = { trackSlug: string; lesson: LessonMeta } | null;

type Props = {
  locale: Locale;
  track: TrackMeta;
  lesson: LessonMeta;
  content: LessonContent;
  next: Neighbour;
  globalIndex: number;
  total: number;
};

type Phase = 'brief' | 'drill' | 'quiz' | 'done';

type Copy = {
  brief: string;
  drill: string;
  quiz: string;
  done: string;
  startDrill: string;
  submit: string;
  continue: string;
  nextLesson: string;
  nextQuestion: string;
  seeReview: string;
  correct: string;
  incorrect: string;
  quizQuestion: string;
  finished: string;
  streak: string;
  backToTrack: string;
  progress: string;
};

const copy: Record<'fr' | 'en', Copy> = {
  fr: {
    brief: 'Exposé',
    drill: 'Exercice',
    quiz: 'Quiz',
    done: 'Leçon validée',
    startDrill: 'Commencer l’exercice',
    submit: 'Valider',
    continue: 'Continuer',
    nextLesson: 'Leçon suivante',
    nextQuestion: 'Question suivante',
    seeReview: 'Voir la correction',
    correct: 'Bonne réponse.',
    incorrect: 'Pas tout à fait.',
    quizQuestion: 'Question {n} sur {total}',
    finished: 'Vous avez terminé cette leçon.',
    streak: 'Streak +1',
    backToTrack: 'Retour à la piste',
    progress: 'Progression',
  },
  en: {
    brief: 'Brief',
    drill: 'Drill',
    quiz: 'Quiz',
    done: 'Lesson complete',
    startDrill: 'Start the drill',
    submit: 'Submit',
    continue: 'Continue',
    nextLesson: 'Next lesson',
    nextQuestion: 'Next question',
    seeReview: 'See review',
    correct: 'Correct.',
    incorrect: 'Not quite.',
    quizQuestion: 'Question {n} of {total}',
    finished: 'You finished this lesson.',
    streak: 'Streak +1',
    backToTrack: 'Back to track',
    progress: 'Progress',
  },
};

export function LessonRunner({ locale, track, lesson, content, next, globalIndex, total }: Props) {
  const t = copy[locale];
  const { markComplete } = useProgress();
  const [phase, setPhase] = useState<Phase>('brief');
  const [drillChoice, setDrillChoice] = useState<number | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [drillRevealed, setDrillRevealed] = useState(false);

  const intro = content.intro[locale];
  const drillOptions = content.drill.options[locale];
  const drillPrompt = content.drill.prompt[locale];
  const drillRationale = content.drill.rationale[locale];

  const currentQuiz = content.quiz[quizIndex];
  const quizOptions = currentQuiz.options[locale];
  const quizQuestion = currentQuiz.q[locale];
  const quizRationale = currentQuiz.rationale[locale];

  const drillCorrect = drillChoice === content.drill.correct;
  const quizCorrect = quizChoice === currentQuiz.correct;

  const onSubmitDrill = () => {
    if (drillChoice === null) return;
    setDrillRevealed(true);
  };

  const onSubmitQuiz = () => {
    if (quizChoice === null) return;
    if (!quizRevealed) {
      if (quizCorrect) setQuizScore((s) => s + 1);
      setQuizRevealed(true);
    }
  };

  const onNextQuestion = () => {
    if (quizIndex < content.quiz.length - 1) {
      setQuizIndex((i) => i + 1);
      setQuizChoice(null);
      setQuizRevealed(false);
    } else {
      // Finish: mark complete then transition to done.
      markComplete(lesson.id);
      setPhase('done');
    }
  };

  const nextHref = next ? `/${locale}/learn/${next.trackSlug}/${next.lesson.slug}` : `/${locale}/learn/${track.slug}`;

  const phaseLabel = phase === 'brief' ? t.brief : phase === 'drill' ? t.drill : phase === 'quiz' ? t.quiz : t.done;

  return (
    <div className="grid grid-cols-12 gap-x-6 gap-y-10">
      <header className="col-span-12">
        <div className="flex items-center justify-between gap-4 border-b border-line pb-5">
          <div className="min-w-0">
            <Link
              href={`/${locale}/learn/${track.slug}`}
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t.backToTrack}
            </Link>
            <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              {track.title[locale]} · {phaseLabel}
            </div>
            <h1 className="mt-2 truncate font-display text-3xl font-medium tracking-tight text-balance text-ink md:text-4xl">
              {String(lesson.index).padStart(2, '0')} · {lesson.title[locale]}
            </h1>
          </div>
          <div className="hidden flex-shrink-0 text-right md:block">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.progress}</div>
            <div className="mt-1 font-display text-2xl font-medium tracking-tight text-ink">
              {globalIndex} / {total}
            </div>
          </div>
        </div>

        <PhaseStepper phase={phase} t={t} />
      </header>

      <div className="col-span-12">
        <AnimatePresence mode="wait">
          <motion.section
            key={phase}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: easeOutExpo }}
          >
            {phase === 'brief' ? (
              <article className="rounded-sm border border-line bg-surface p-6 md:p-10">
                <Eyebrow>{t.brief}</Eyebrow>
                <div className="mt-8 space-y-5 border-l border-line pl-6">
                  {intro.map((p, i) => (
                    <p key={i} className="max-w-2xl text-[16px] leading-relaxed text-ink">
                      {p}
                    </p>
                  ))}
                </div>
                <div className="mt-10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPhase('drill')}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
                  >
                    {t.startDrill}
                    <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
              </article>
            ) : null}

            {phase === 'drill' ? (
              <article className="rounded-sm border border-line bg-surface p-6 md:p-10">
                <Eyebrow>{t.drill}</Eyebrow>
                <h2 className="mt-6 max-w-3xl font-display text-2xl font-medium tracking-tight text-balance text-ink md:text-3xl">
                  {drillPrompt}
                </h2>
                <ul className="mt-8 grid grid-cols-1 gap-2.5">
                  {drillOptions.map((opt, i) => (
                    <li key={i}>
                      <OptionButton
                        active={drillChoice === i}
                        revealed={drillRevealed}
                        correct={i === content.drill.correct}
                        onClick={() => !drillRevealed && setDrillChoice(i)}
                      >
                        {opt}
                      </OptionButton>
                    </li>
                  ))}
                </ul>

                {drillRevealed ? (
                  <FeedbackBox correct={drillCorrect} message={drillRationale} t={t} />
                ) : null}

                <div className="mt-10 flex justify-end">
                  {drillRevealed ? (
                    <button
                      type="button"
                      onClick={() => setPhase('quiz')}
                      className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
                    >
                      {t.continue}
                      <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onSubmitDrill}
                      disabled={drillChoice === null}
                      className={cn(
                        'inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-medium tracking-tight transition-colors',
                        drillChoice === null
                          ? 'cursor-not-allowed bg-line text-subtle'
                          : 'bg-ink text-canvas hover:bg-ink/90',
                      )}
                    >
                      {t.submit}
                    </button>
                  )}
                </div>
              </article>
            ) : null}

            {phase === 'quiz' ? (
              <article className="rounded-sm border border-line bg-surface p-6 md:p-10">
                <div className="flex items-baseline justify-between">
                  <Eyebrow>{t.quiz}</Eyebrow>
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                    {t.quizQuestion.replace('{n}', String(quizIndex + 1)).replace('{total}', String(content.quiz.length))}
                  </span>
                </div>

                <h2 className="mt-6 max-w-3xl font-display text-2xl font-medium tracking-tight text-balance text-ink md:text-3xl">
                  {quizQuestion}
                </h2>

                <ul className="mt-8 grid grid-cols-1 gap-2.5">
                  {quizOptions.map((opt, i) => (
                    <li key={i}>
                      <OptionButton
                        active={quizChoice === i}
                        revealed={quizRevealed}
                        correct={i === currentQuiz.correct}
                        onClick={() => !quizRevealed && setQuizChoice(i)}
                      >
                        {opt}
                      </OptionButton>
                    </li>
                  ))}
                </ul>

                {quizRevealed ? <FeedbackBox correct={quizCorrect} message={quizRationale} t={t} /> : null}

                <div className="mt-10 flex justify-end">
                  {quizRevealed ? (
                    <button
                      type="button"
                      onClick={onNextQuestion}
                      className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
                    >
                      {quizIndex < content.quiz.length - 1 ? t.nextQuestion : t.continue}
                      <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onSubmitQuiz}
                      disabled={quizChoice === null}
                      className={cn(
                        'inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-medium tracking-tight transition-colors',
                        quizChoice === null
                          ? 'cursor-not-allowed bg-line text-subtle'
                          : 'bg-ink text-canvas hover:bg-ink/90',
                      )}
                    >
                      {t.submit}
                    </button>
                  )}
                </div>
              </article>
            ) : null}

            {phase === 'done' ? (
              <DoneCard t={t} score={quizScore} total={content.quiz.length} nextHref={nextHref} hasNext={Boolean(next)} />
            ) : null}
          </motion.section>
        </AnimatePresence>
      </div>
    </div>
  );
}

function PhaseStepper({ phase, t }: { phase: Phase; t: Copy }) {
  const order: Phase[] = ['brief', 'drill', 'quiz', 'done'];
  const i = order.indexOf(phase);
  const labels: Record<Phase, string> = { brief: t.brief, drill: t.drill, quiz: t.quiz, done: t.done };
  return (
    <ol className="mt-6 flex items-center gap-3">
      {order.map((p, idx) => {
        const reached = idx <= i;
        return (
          <li key={p} className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-mono uppercase tracking-[0.18em]',
                reached ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-muted',
              )}
            >
              {idx + 1}
            </span>
            <span className={cn('font-mono text-[11px] uppercase tracking-[0.22em]', reached ? 'text-ink' : 'text-muted')}>
              {labels[p]}
            </span>
            {idx < order.length - 1 ? <span aria-hidden className="h-px w-6 bg-line" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function OptionButton({
  children,
  active,
  revealed,
  correct,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  revealed: boolean;
  correct: boolean;
  onClick: () => void;
}) {
  const isWrongRevealed = revealed && active && !correct;
  const isRightRevealed = revealed && correct;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'group flex w-full items-start gap-4 rounded-sm border p-4 text-left transition-colors md:p-5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        revealed
          ? isRightRevealed
            ? 'border-up bg-up/10 text-ink'
            : isWrongRevealed
              ? 'border-down bg-down/10 text-ink'
              : 'border-line bg-canvas text-muted'
          : active
            ? 'border-ink bg-ink text-canvas'
            : 'border-line bg-canvas text-ink hover:border-ink',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border',
          revealed
            ? isRightRevealed
              ? 'border-up bg-up text-canvas'
              : isWrongRevealed
                ? 'border-down bg-down text-canvas'
                : 'border-line'
            : active
              ? 'border-canvas bg-canvas text-ink'
              : 'border-line',
        )}
      >
        {revealed && isRightRevealed ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
        {revealed && isWrongRevealed ? <X className="h-3 w-3" strokeWidth={2.5} /> : null}
        {!revealed && active ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
      </span>
      <span className="text-[15px] leading-snug">{children}</span>
    </button>
  );
}

function FeedbackBox({ correct, message, t }: { correct: boolean; message: string; t: Copy }) {
  return (
    <div
      className={cn(
        'mt-8 rounded-sm border p-5',
        correct ? 'border-up/40 bg-up/5' : 'border-down/40 bg-down/5',
      )}
    >
      <div className={cn('font-mono text-[11px] uppercase tracking-[0.22em]', correct ? 'text-up' : 'text-down')}>
        {correct ? t.correct : t.incorrect}
      </div>
      <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-ink">{message}</p>
    </div>
  );
}

function DoneCard({
  t,
  score,
  total,
  nextHref,
  hasNext,
}: {
  t: Copy;
  score: number;
  total: number;
  nextHref: string;
  hasNext: boolean;
}) {
  const allRight = useMemo(() => score === total, [score, total]);
  return (
    <article className="rounded-sm border border-ink bg-ink p-8 text-canvas md:p-12">
      <Eyebrow>
        <span className="text-canvas/70">{t.done}</span>
      </Eyebrow>
      <h2 className="mt-6 font-display text-display-md font-medium tracking-tight text-balance">
        {t.finished}
      </h2>
      <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-canvas/80">
        Score : {score} / {total} {allRight ? '— ' + t.streak : ''}
      </p>

      <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-canvas/30 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-canvas/80">
        <Sparkles aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
        {t.streak}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={nextHref}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-canvas px-6 text-[15px] font-medium tracking-tight text-ink transition-colors hover:bg-canvas/90"
        >
          {hasNext ? t.nextLesson : t.backToTrack}
          <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>
    </article>
  );
}
