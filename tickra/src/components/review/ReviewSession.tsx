'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { Grade } from '@/lib/learning/sm2';
import { KpiStrip, LivePulse } from '@/components/ui/KpiStrip';

export type ReviewCard = {
  lessonId: string;
  trackTitle: string;
  lessonTitle: string;
  q: string;
  options: string[];
  correct: number;
  rationale: string;
};

type Props = { cards: ReviewCard[]; locale: Locale };

const COPY = {
  fr: {
    progress: (i: number, n: number) => `Carte ${i + 1} / ${n}`,
    reveal: 'Voir la réponse',
    rate: 'Notez votre rappel',
    again: 'À refaire',
    hard: 'Difficile',
    good: 'Bien',
    easy: 'Facile',
    rationale: 'Explication',
    done: 'Session terminée',
    doneBody: 'Toutes les cartes du jour sont passées. Revenez demain.',
    next: 'Prochaine carte',
    syncing: 'Sauvegarde…',
    error: 'Échec d’enregistrement. La carte reste en file.',
  },
  en: {
    progress: (i: number, n: number) => `Card ${i + 1} / ${n}`,
    reveal: 'Show answer',
    rate: 'Rate your recall',
    again: 'Again',
    hard: 'Hard',
    good: 'Good',
    easy: 'Easy',
    rationale: 'Why',
    done: 'Session complete',
    doneBody: 'You cleared today’s queue. Come back tomorrow.',
    next: 'Next card',
    syncing: 'Saving…',
    error: 'Could not save. The card stays in queue.',
  },
} as const;

export function ReviewSession({ cards, locale }: Props) {
  const t = COPY[locale];
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const card = cards[index];
  const total = cards.length;
  const finished = index >= total;
  const graded = index;
  const accuracy = graded > 0 ? Math.round((correctCount / graded) * 100) : 0;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  const isCorrect = useMemo(
    () => (card && chosen !== null ? chosen === card.correct : null),
    [card, chosen],
  );

  async function grade(grade: Grade) {
    if (!card || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/api/review/grade', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lessonId: card.lessonId, grade }),
      });
      if (!r.ok) throw new Error('failed');
      // Advance to next card.
      if (isCorrect === true) setCorrectCount((c) => c + 1);
      setIndex((i) => i + 1);
      setChosen(null);
      setRevealed(false);
    } catch {
      setErr(t.error);
    } finally {
      setBusy(false);
    }
  }

  const headerStrip = (
    <KpiStrip
      className="mb-4"
      items={[
        { label: locale === 'fr' ? 'Carte' : 'Card', value: `${Math.min(index + 1, total)}`, hint: `/ ${total}`, tone: 'brand' },
        { label: locale === 'fr' ? 'Temps' : 'Time', value: `${mm}:${ss}` },
        { label: locale === 'fr' ? 'Précision' : 'Accuracy', value: `${accuracy}%`, tone: accuracy >= 70 ? 'up' : accuracy === 0 ? 'neutral' : 'down' },
        { label: locale === 'fr' ? 'Notées' : 'Graded', value: String(graded) },
      ]}
      trailing={<LivePulse label={locale === 'fr' ? 'session' : 'session'} />}
    />
  );

  if (finished) {
    return (
      <div className="space-y-4">
        {headerStrip}
        <div className="rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="font-display text-2xl font-medium text-ink">{t.done}</p>
          <p className="mt-2 text-sm text-muted">{t.doneBody}</p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            {graded} {locale === 'fr' ? 'cartes en' : 'cards in'} {mm}:{ss} · {accuracy}% {locale === 'fr' ? 'de réussite' : 'accuracy'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {headerStrip}
      <div className="rounded-2xl border border-line bg-surface p-6 md:p-8">
        <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
          {t.progress(index, total)}
        </p>
        <p className="text-xs text-muted">
          {card.trackTitle} · {card.lessonTitle}
        </p>
      </div>

      <h2 className="mt-4 font-display text-xl font-medium leading-snug text-ink md:text-2xl">
        {card.q}
      </h2>

      <ul className="mt-6 space-y-2">
        {card.options.map((opt, i) => {
          const picked = chosen === i;
          const correct = revealed && i === card.correct;
          const wrong = revealed && picked && i !== card.correct;
          const cls = correct
            ? 'border-up bg-up/10 text-ink'
            : wrong
              ? 'border-down bg-down/10 text-ink'
              : picked
                ? 'border-ink bg-canvas text-ink'
                : 'border-line bg-canvas text-ink hover:border-ink/40';
          return (
            <li key={i}>
              <button
                type="button"
                disabled={revealed || busy}
                onClick={() => setChosen(i)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${cls}`}
              >
                {opt}
              </button>
            </li>
          );
        })}
      </ul>

      {!revealed ? (
        <button
          type="button"
          disabled={chosen === null}
          onClick={() => setRevealed(true)}
          className="mt-6 w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {t.reveal}
        </button>
      ) : (
        <div className="mt-6">
          <div className="rounded-xl border border-line bg-canvas p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
              {t.rationale}
            </p>
            <p className="mt-1 text-sm text-ink">{card.rationale}</p>
          </div>

          <p className="mt-5 text-xs uppercase tracking-widest text-subtle">{t.rate}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <GradeBtn label={t.again} tone="down" onClick={() => grade('again')} disabled={busy} />
            <GradeBtn
              label={t.hard}
              tone="neutral"
              onClick={() => grade('hard')}
              disabled={busy || isCorrect === false}
            />
            <GradeBtn
              label={t.good}
              tone="neutral"
              onClick={() => grade('good')}
              disabled={busy || isCorrect === false}
            />
            <GradeBtn
              label={t.easy}
              tone="up"
              onClick={() => grade('easy')}
              disabled={busy || isCorrect === false}
            />
          </div>
          {err ? <p className="mt-3 text-xs text-down">{err}</p> : null}
          {busy ? <p className="mt-2 text-xs text-muted">{t.syncing}</p> : null}
        </div>
      )}
      </div>
    </div>
  );
}

function GradeBtn({
  label,
  tone,
  onClick,
  disabled,
}: {
  label: string;
  tone: 'up' | 'down' | 'neutral';
  onClick: () => void;
  disabled: boolean;
}) {
  const cls =
    tone === 'up'
      ? 'border-up text-up hover:bg-up/10'
      : tone === 'down'
        ? 'border-down text-down hover:bg-down/10'
        : 'border-line text-ink hover:bg-canvas';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${cls}`}
    >
      {label}
    </button>
  );
}
