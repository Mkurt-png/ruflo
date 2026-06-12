'use client';

// CrieeCard — the daily question, presented as a museum-catalog card on
// the ivory editorial palette. One question, four options (shuffled
// deterministically per day so reveal feels fair). Result + the source
// lesson link appear after reveal. Once answered, the choice is sticky
// per-account for the day (no retries).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CrieeCard as CrieeCardType } from '@/lib/tickra/criee';
import { scopedKey } from '@/lib/progress/scope';
import { shuffleWithCorrect } from '@/lib/curriculum/shuffle';

type Locale = 'fr' | 'en';

const COPY = {
  fr: {
    pickPrompt: 'Choisissez. Une seule passe.',
    locked: 'Vous avez déjà répondu aujourd’hui.',
    correct: 'Juste.',
    wrong: 'Pas tout à fait.',
    sourceLine: 'Source — leçon',
    openLesson: 'Lire la leçon entière ↘',
    backTomorrow: 'Une autre demain, à la même heure.',
    options: ['A', 'B', 'C', 'D'],
  },
  en: {
    pickPrompt: 'Choose. One pass only.',
    locked: 'You already answered today.',
    correct: 'Right.',
    wrong: 'Not quite.',
    sourceLine: 'Source — lesson',
    openLesson: 'Read the full lesson ↘',
    backTomorrow: 'Another one tomorrow, same time.',
    options: ['A', 'B', 'C', 'D'],
  },
} as const;

export function CrieeCard({ card, locale }: { card: CrieeCardType; locale: Locale }) {
  const t = COPY[locale];

  // Daily-scoped shuffle so the answer doesn't always land on A.
  const shuffled = shuffleWithCorrect(
    card.options[locale],
    card.correct,
    `${card.date}::${card.lessonId}`,
  );

  // Per-account daily lock so refreshing doesn't reset the answer.
  const storeKey = scopedKey(`tickra-criee::${card.date}`);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storeKey);
      if (raw) {
        const v = Number(raw);
        if (Number.isInteger(v) && v >= 0 && v < shuffled.options.length) {
          setPicked(v);
          setRevealed(true);
        }
      }
    } catch {
      /* private mode */
    }
  }, [storeKey, shuffled.options.length]);

  const onPick = (i: number) => {
    if (revealed) return;
    setPicked(i);
    setRevealed(true);
    try {
      window.localStorage.setItem(storeKey, String(i));
    } catch {
      /* ignore */
    }
  };

  const correct = picked !== null && picked === shuffled.correct;

  return (
    <article className="mx-auto max-w-[920px] px-6 md:px-0">
      <p
        className="font-display italic font-light text-[#0E0E0E] text-balance"
        style={{ fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: 1.12, letterSpacing: '-0.02em' }}
      >
        {card.question[locale]}
      </p>

      <ol className="mt-14 grid grid-cols-1 gap-3">
        {shuffled.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = revealed && i === shuffled.correct;
          const isWrongPick = revealed && isPicked && !isCorrect;
          const base =
            'group flex items-baseline gap-6 border-b border-black/[0.10] py-5 text-left transition-colors';
          const state = revealed
            ? isCorrect
              ? 'text-[#0E0E0E]'
              : isWrongPick
                ? 'text-black/40 line-through'
                : 'text-black/35'
            : 'text-[#0E0E0E] hover:bg-black/[0.03]';
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onPick(i)}
                disabled={revealed}
                className={`${base} ${state} w-full pl-2 pr-2 disabled:cursor-default`}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-black/40 tabular-nums w-8">
                  {t.options[i] ?? String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className="font-display italic font-light"
                  style={{ fontSize: 'clamp(20px, 2.4vw, 28px)' }}
                >
                  {opt}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {!revealed && (
        <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.28em] text-black/45">
          {t.pickPrompt}
        </p>
      )}

      {revealed && (
        <footer className="mt-14 border-t border-black/[0.10] pt-10">
          <p
            className={`font-display italic font-light ${correct ? 'text-[#0E0E0E]' : 'text-black/55'}`}
            style={{ fontSize: 'clamp(28px, 3.4vw, 44px)', lineHeight: 1.12 }}
          >
            {correct ? t.correct : t.wrong}
          </p>
          <p className="mt-6 text-[15px] leading-relaxed text-black/70 max-w-[640px]">
            {card.rationale[locale]}
          </p>
          <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-black/45">
              {t.sourceLine} — {card.source.lessonTitle[locale]}
            </span>
            <Link
              href={`/${locale}/learn/${card.trackSlug}/${card.lessonSlug}`}
              className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#0E0E0E] hover:text-black/80 transition-colors"
            >
              {t.openLesson}
            </Link>
          </div>
          <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.32em] text-black/40">
            {t.backTomorrow}
          </p>
        </footer>
      )}
    </article>
  );
}

export default CrieeCard;
