'use client';

import { useState } from 'react';
import Link from 'next/link';

// TICKRA-REDESIGN: public, no-auth lesson taste — one candle, four options, instant feedback.

type CandleType = 'bullish' | 'bearish' | 'doji';

type CandleSpec = {
  type: CandleType;
  correct: 'A' | 'B' | 'C' | 'D';
};

const CANDLES: CandleSpec[] = [
  { type: 'bullish', correct: 'A' },
  { type: 'bearish', correct: 'B' },
  { type: 'doji', correct: 'C' },
];

type Copy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  pair: string;
  prompt: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  explanations: Record<CandleType, string>;
  candleAria: Record<CandleType, string>;
  correct: string;
  notQuite: string;
  continueLesson: string;
  startLesson: string;
  tryAnother: string;
};

const COPY: Record<'fr' | 'en', Copy> = {
  fr: {
    eyebrow: 'Essayez une vraie leçon Tickra',
    title: 'Savez-vous lire cette bougie ?',
    subtitle: 'Pas besoin de compte. Une question. Réponse immédiate.',
    pair: 'EUR/USD · 1H',
    prompt: 'Que dit cette bougie ?',
    options: {
      A: 'Haussière — les acheteurs contrôlent',
      B: 'Baissière — les vendeurs contrôlent',
      C: 'Indécision — pas de direction claire',
      D: 'Gap haussier — ouverture en hausse',
    },
    explanations: {
      bullish:
        'Long corps vert avec une clôture bien au-dessus de l’ouverture. Les acheteurs ont absorbé chaque repli et poussé le prix jusqu’à la clôture — contrôle haussier classique.',
      bearish:
        'Long corps rouge avec une clôture bien en dessous de l’ouverture. Les vendeurs ont contrôlé la séance de l’ouverture à la clôture — pression baissière.',
      doji: 'Ouverture et clôture quasi identiques avec de longues mèches des deux côtés. Aucun camp n’a gagné — c’est une bougie d’indécision typique.',
    },
    candleAria: {
      bullish: 'Bougie haussière',
      bearish: 'Bougie baissière',
      doji: 'Bougie doji',
    },
    correct: '✓ Correct',
    notQuite: 'Pas tout à fait.',
    continueLesson: 'Passer à la leçon 04 →',
    startLesson: 'Commencer par la leçon 01 →',
    tryAnother: 'Essayer une autre bougie',
  },
  en: {
    eyebrow: 'Try a real Tickra lesson',
    title: 'Can you read this candle?',
    subtitle: 'No account needed. One question. Instant feedback.',
    pair: 'EUR/USD · 1H',
    prompt: 'What does this candle tell you?',
    options: {
      A: 'Bullish — buyers are in control',
      B: 'Bearish — sellers are in control',
      C: 'Indecision — no clear direction',
      D: 'Gap up — market opened higher',
    },
    explanations: {
      bullish:
        'Long green body with the close well above the open. Buyers absorbed every dip and pushed price higher into the close — classic bullish control.',
      bearish:
        'Long red body with the close well below the open. Sellers controlled the session from open to close — bearish pressure.',
      doji: 'Open and close are nearly identical with long wicks on both sides. Neither side won — this is a textbook indecision candle.',
    },
    candleAria: {
      bullish: 'Bullish candle',
      bearish: 'Bearish candle',
      doji: 'Doji candle',
    },
    correct: '✓ Correct',
    notQuite: 'Not quite.',
    continueLesson: 'Continue to Lesson 04 →',
    startLesson: 'Start from Lesson 01 →',
    tryAnother: 'Try another candle',
  },
};

type Props = { locale?: string };

export function PublicQuizSection({ locale = 'en' }: Props) {
  const t = COPY[locale === 'fr' ? 'fr' : 'en'];
  const [candleIdx, setCandleIdx] = useState(0);
  const [picked, setPicked] = useState<null | 'A' | 'B' | 'C' | 'D'>(null);

  const candle = CANDLES[candleIdx];
  const isAnswered = picked !== null;
  const isCorrect = picked !== null && picked === candle.correct;

  const reset = () => {
    setCandleIdx((i) => (i + 1) % CANDLES.length);
    setPicked(null);
  };

  return (
    <section
      aria-labelledby="public-quiz-title"
      className="bg-navy-900 py-24 px-6"
    >
      <div className="mx-auto w-full max-w-container text-center">
        <span className="inline-block bg-accent-blue/20 text-accent-blue text-xs font-medium px-3 py-1 rounded-full">
          {t.eyebrow}
        </span>
        <h2 id="public-quiz-title" className="text-white text-4xl font-medium mt-4">
          {t.title}
        </h2>
        <p className="text-white/60 text-lg mt-3">{t.subtitle}</p>

        <div className="max-w-lg mx-auto mt-12 text-left">
          <div className="bg-navy-800 rounded-xl p-8 text-center">
            <CandleSvg type={candle.type} ariaLabel={t.candleAria[candle.type]} />
            <div className="text-white/40 text-xs mt-4">{t.pair}</div>
            <p className="text-white text-lg font-medium text-center mt-6">{t.prompt}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              {(['A', 'B', 'C', 'D'] as const).map((key) => {
                const isPicked = picked === key;
                const isCorrectOpt = key === candle.correct;
                let className =
                  'text-left bg-navy-700 hover:bg-navy-600 text-white text-sm rounded-lg py-3 px-4 transition-colors';
                if (isAnswered) {
                  if (isCorrect && isPicked) {
                    className =
                      'text-left bg-success text-white border-2 border-success/50 text-sm rounded-lg py-3 px-4';
                  } else if (!isCorrect && isPicked) {
                    className =
                      'text-left bg-danger/20 border border-danger text-danger text-sm rounded-lg py-3 px-4';
                  } else if (!isCorrect && isCorrectOpt) {
                    className =
                      'text-left bg-success/20 border border-success text-success text-sm rounded-lg py-3 px-4';
                  } else {
                    className =
                      'text-left bg-navy-700 text-white text-sm rounded-lg py-3 px-4 opacity-40 pointer-events-none';
                  }
                }
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => !isAnswered && setPicked(key)}
                    className={className}
                    disabled={isAnswered}
                  >
                    <span className="font-medium mr-2">{key}.</span>
                    {t.options[key]}
                  </button>
                );
              })}
            </div>
          </div>

          {isAnswered ? (
            <>
              {isCorrect ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="bg-success/10 border border-success/20 rounded-xl p-5 mt-6"
                >
                  <p className="text-success font-medium">{t.correct}</p>
                  <p className="text-white/70 text-sm mt-2 leading-relaxed">
                    {t.explanations[candle.type]}
                  </p>
                  <Link
                    href={`/${locale}/learn/japanese-candles/04`}
                    className="inline-flex items-center mt-4 bg-accent-blue hover:bg-accent-blue-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {t.continueLesson}
                  </Link>
                </div>
              ) : (
                <div
                  role="status"
                  aria-live="polite"
                  className="bg-danger/10 border border-danger/20 rounded-xl p-5 mt-6"
                >
                  <p className="text-danger font-medium">{t.notQuite}</p>
                  <p className="text-white/70 text-sm mt-2 leading-relaxed">
                    {t.explanations[candle.type]}
                  </p>
                  <Link
                    href={`/${locale}/learn/japanese-candles/01`}
                    className="inline-flex items-center mt-4 bg-accent-blue hover:bg-accent-blue-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {t.startLesson}
                  </Link>
                </div>
              )}
              <button
                type="button"
                onClick={reset}
                className="mt-3 w-full border border-white/30 text-white/80 hover:bg-white/10 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {t.tryAnother}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CandleSvg({ type, ariaLabel }: { type: CandleType; ariaLabel: string }) {
  // viewBox 0 0 60 200
  if (type === 'bullish') {
    const color = '#059669';
    return (
      <svg
        viewBox="0 0 60 200"
        role="img"
        aria-label={ariaLabel}
        className="mx-auto"
        width="120"
        height="200"
      >
        <line x1={30} x2={30} y1={15} y2={40} stroke={color} strokeWidth={1.5} />
        <rect x={20} y={40} width={20} height={90} fill={color} />
        <line x1={30} x2={30} y1={130} y2={170} stroke={color} strokeWidth={1.5} />
      </svg>
    );
  }
  if (type === 'bearish') {
    const color = '#DC2626';
    return (
      <svg
        viewBox="0 0 60 200"
        role="img"
        aria-label={ariaLabel}
        className="mx-auto"
        width="120"
        height="200"
      >
        <line x1={30} x2={30} y1={20} y2={50} stroke={color} strokeWidth={1.5} />
        <rect x={20} y={50} width={20} height={100} fill={color} />
        <line x1={30} x2={30} y1={150} y2={180} stroke={color} strokeWidth={1.5} />
      </svg>
    );
  }
  // doji
  const color = '#A8A29E';
  return (
    <svg
      viewBox="0 0 60 200"
      role="img"
      aria-label={ariaLabel}
      className="mx-auto"
      width="120"
      height="200"
    >
      <line x1={30} x2={30} y1={20} y2={95} stroke={color} strokeWidth={1.5} />
      <rect x={18} y={95} width={24} height={6} fill={color} />
      <line x1={30} x2={30} y1={101} y2={180} stroke={color} strokeWidth={1.5} />
    </svg>
  );
}
