'use client';

// TICKRA-PHASE-3: adaptive AI quiz at the end of a lesson.
// Self-contained: on demand it asks /api/ai/quiz to generate fresh questions
// grounded on the lesson, then runs an interactive single-choice quiz with
// instant rationale + a final score. Degrades gracefully when AI is offline.

import { useState } from 'react';
import { Check, Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import { useUser } from '@/lib/auth/useUser';
import { addXp } from '@/lib/progress/xp';
import { cn } from '@/lib/cn';

// XP awarded per correct answer when an AI quiz is completed. Mirrors the
// simulator's "every action rewards XP" model so the quiz feeds the same
// gamification loop (levels, daily quests).
const XP_PER_CORRECT = 5;

type Locale = 'fr' | 'en';

type Question = {
  q: string;
  options: string[];
  correct: number;
  rationale: string;
};

const copy = {
  fr: {
    eyebrow: 'Quiz adaptatif',
    title: 'Teste ta compréhension',
    desc: 'Des questions générées sur mesure à partir de cette leçon. À chaque essai, elles changent.',
    generate: 'Générer un quiz',
    regenerate: 'Nouveau quiz',
    loading: 'Génération en cours…',
    next: 'Question suivante',
    finish: 'Voir le score',
    scoreLabel: 'Ton score',
    perfect: 'Sans faute. Tu maîtrises cette leçon.',
    good: 'Solide. Relis la rationale des questions ratées.',
    weak: 'À retravailler — reprends la leçon puis relance un quiz.',
    notAuth: 'Connecte-toi pour générer un quiz personnalisé.',
    notConfigured: "Le quiz IA n'est pas activé sur cette instance.",
    quota: 'Limite quotidienne atteinte. Passe Pro pour 200 requêtes/jour.',
    error: 'Impossible de générer le quiz. Réessaie.',
    correctTag: 'Bonne réponse',
    wrongTag: 'Mauvaise réponse',
    xpEarned: 'XP gagnés',
  },
  en: {
    eyebrow: 'Adaptive quiz',
    title: 'Test your understanding',
    desc: 'Questions generated on the fly from this lesson. They change every attempt.',
    generate: 'Generate a quiz',
    regenerate: 'New quiz',
    loading: 'Generating…',
    next: 'Next question',
    finish: 'See score',
    scoreLabel: 'Your score',
    perfect: 'Flawless. You own this lesson.',
    good: 'Solid. Re-read the rationale on missed questions.',
    weak: 'Needs work — revisit the lesson then run a new quiz.',
    notAuth: 'Sign in to generate a personalised quiz.',
    notConfigured: 'AI quiz is not enabled on this instance.',
    quota: 'Daily limit reached. Upgrade to Pro for 200 requests/day.',
    error: 'Could not generate the quiz. Try again.',
    correctTag: 'Correct',
    wrongTag: 'Incorrect',
    xpEarned: 'XP earned',
  },
};

export function LessonAiQuiz({
  trackSlug,
  lessonSlug,
  locale,
}: {
  trackSlug: string;
  lessonSlug: string;
  locale: Locale;
}) {
  const t = copy[locale];
  const { user, ready } = useUser();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const generate = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    setQuestions(null);
    setCurrent(0);
    setPicked(null);
    setAnswers([]);
    setDone(false);
    try {
      const r = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ trackSlug, lessonSlug, locale, count: 4 }),
      });
      if (r.status === 401) return setError(t.notAuth);
      if (r.status === 429) return setError(t.quota);
      if (r.status === 501) return setError(t.notConfigured);
      if (!r.ok) return setError(t.error);
      const data = (await r.json()) as { questions?: Question[] };
      if (!data.questions || data.questions.length === 0) return setError(t.error);
      setQuestions(data.questions);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const pick = (idx: number) => {
    if (picked !== null || !questions) return;
    setPicked(idx);
    setAnswers((a) => [...a, idx === questions[current].correct]);
  };

  const advance = () => {
    if (!questions) return;
    if (current + 1 >= questions.length) {
      // Quiz finished — award XP for correct answers and notify the XP badge.
      const correct = answers.filter(Boolean).length;
      if (correct > 0) {
        addXp(correct * XP_PER_CORRECT);
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('tickra-xp-changed'));
      }
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setPicked(null);
    }
  };

  if (!ready) return null;

  const score = answers.filter(Boolean).length;
  const total = questions?.length ?? 0;

  return (
    <section className="rounded-sm border border-line bg-surface p-5 md:p-6">
      <div className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-brand">
        <Sparkles className="h-3 w-3" strokeWidth={2} />
        {t.eyebrow}
      </div>
      <h3 className="mt-2 text-[18px] font-semibold text-ink">{t.title}</h3>
      <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{t.desc}</p>

      {/* Idle / empty state */}
      {!questions && !loading ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={generate}
            disabled={!user}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[13.5px] font-medium text-canvas transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-accent" strokeWidth={2} />
            {t.generate}
          </button>
          {!user ? <p className="mt-3 text-[12.5px] text-muted">{t.notAuth}</p> : null}
          {error ? (
            <p className="mt-3 rounded-sm border border-down/40 bg-down/10 p-3 text-[12.5px] text-ink">{error}</p>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 inline-flex items-center gap-2 text-[13.5px] text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
          {t.loading}
        </p>
      ) : null}

      {/* Active quiz */}
      {questions && !done ? (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            <span>
              {current + 1} / {questions.length}
            </span>
            <span>
              {score} ✓
            </span>
          </div>
          <p className="text-[15px] font-medium leading-relaxed text-ink">{questions[current].q}</p>
          <div className="mt-3 space-y-2">
            {questions[current].options.map((opt, i) => {
              const isCorrect = i === questions[current].correct;
              const isPicked = i === picked;
              const reveal = picked !== null;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(i)}
                  disabled={reveal}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-sm border px-3 py-2.5 text-left text-[13.5px] transition-colors',
                    !reveal && 'border-line bg-canvas text-ink hover:border-ink',
                    reveal && isCorrect && 'border-up bg-up/10 text-ink',
                    reveal && isPicked && !isCorrect && 'border-down bg-down/10 text-ink',
                    reveal && !isCorrect && !isPicked && 'border-line bg-canvas text-muted',
                  )}
                >
                  <span>{opt}</span>
                  {reveal && isCorrect ? <Check className="h-4 w-4 flex-shrink-0 text-up" strokeWidth={2} /> : null}
                  {reveal && isPicked && !isCorrect ? <X className="h-4 w-4 flex-shrink-0 text-down" strokeWidth={2} /> : null}
                </button>
              );
            })}
          </div>

          {picked !== null ? (
            <div className="mt-3">
              <p
                className={cn(
                  'font-mono text-[10.5px] uppercase tracking-[0.18em]',
                  picked === questions[current].correct ? 'text-up' : 'text-down',
                )}
              >
                {picked === questions[current].correct ? t.correctTag : t.wrongTag}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{questions[current].rationale}</p>
              <button
                type="button"
                onClick={advance}
                className="mt-3 inline-flex h-10 items-center rounded-full border border-ink px-4 text-[13px] font-medium text-ink transition-colors hover:bg-ink hover:text-canvas"
              >
                {current + 1 >= questions.length ? t.finish : t.next}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Result */}
      {done && questions ? (
        <div className="mt-5">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-subtle">{t.scoreLabel}</div>
          <div className="mt-1 text-[34px] font-semibold tracking-tight text-ink">
            {score}
            <span className="text-[18px] text-muted"> / {total}</span>
          </div>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
            {score === total ? t.perfect : score >= Math.ceil(total * 0.6) ? t.good : t.weak}
          </p>
          {score > 0 ? (
            <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
              <Sparkles className="h-3 w-3" strokeWidth={2} />
              +{score * XP_PER_CORRECT} {t.xpEarned}
            </p>
          ) : null}
          <button
            type="button"
            onClick={generate}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[13.5px] font-medium text-canvas transition-all hover:-translate-y-0.5 hover:brightness-110"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
            {t.regenerate}
          </button>
        </div>
      ) : null}
    </section>
  );
}
