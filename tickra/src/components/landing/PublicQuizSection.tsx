'use client';

import { useState } from 'react';
import Link from 'next/link';

// TICKRA-REDESIGN: public, no-auth lesson taste — one candle, four options, instant feedback.

type CandleSpec = {
  type: 'bullish' | 'bearish' | 'doji';
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
};

const CANDLES: CandleSpec[] = [
  {
    type: 'bullish',
    correct: 'A',
    explanation:
      'Long green body with the close well above the open. Buyers absorbed every dip and pushed price higher into the close — classic bullish control.',
  },
  {
    type: 'bearish',
    correct: 'B',
    explanation:
      'Long red body with the close well below the open. Sellers controlled the session from open to close — bearish pressure.',
  },
  {
    type: 'doji',
    correct: 'C',
    explanation:
      'Open and close are nearly identical with long wicks on both sides. Neither side won — this is a textbook indecision candle.',
  },
];

const OPTIONS: { key: 'A' | 'B' | 'C' | 'D'; label: string }[] = [
  { key: 'A', label: 'Bullish — buyers are in control' },
  { key: 'B', label: 'Bearish — sellers are in control' },
  { key: 'C', label: 'Indecision — no clear direction' },
  { key: 'D', label: 'Gap up — market opened higher' },
];

type Props = { locale?: string };

export function PublicQuizSection({ locale = 'en' }: Props) {
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
          Try a real Tickra lesson
        </span>
        <h2 id="public-quiz-title" className="text-white text-4xl font-medium mt-4">
          Can you read this candle?
        </h2>
        <p className="text-white/60 text-lg mt-3">
          No account needed. One question. Instant feedback.
        </p>

        <div className="max-w-lg mx-auto mt-12 text-left">
          <div className="bg-navy-800 rounded-xl p-8 text-center">
            <CandleSvg type={candle.type} />
            <div className="text-white/40 text-xs mt-4">EUR/USD · 1H</div>
            <p className="text-white text-lg font-medium text-center mt-6">
              What does this candle tell you?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              {OPTIONS.map((opt) => {
                const isPicked = picked === opt.key;
                const isCorrectOpt = opt.key === candle.correct;
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
                    key={opt.key}
                    type="button"
                    onClick={() => !isAnswered && setPicked(opt.key)}
                    className={className}
                    disabled={isAnswered}
                  >
                    <span className="font-medium mr-2">{opt.key}.</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isAnswered ? (
            <>
              {isCorrect ? (
                <div className="bg-success/10 border border-success/20 rounded-xl p-5 mt-6">
                  <p className="text-success font-medium">✓ Correct</p>
                  <p className="text-white/70 text-sm mt-2 leading-relaxed">
                    {candle.explanation}
                  </p>
                  <Link
                    href={`/${locale}/learn/japanese-candles/04`}
                    className="inline-flex items-center mt-4 bg-accent-blue hover:bg-accent-blue-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Continue to Lesson 04 →
                  </Link>
                </div>
              ) : (
                <div className="bg-danger/10 border border-danger/20 rounded-xl p-5 mt-6">
                  <p className="text-danger font-medium">Not quite.</p>
                  <p className="text-white/70 text-sm mt-2 leading-relaxed">
                    {candle.explanation}
                  </p>
                  <Link
                    href={`/${locale}/learn/japanese-candles/01`}
                    className="inline-flex items-center mt-4 bg-accent-blue hover:bg-accent-blue-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Start from Lesson 01 →
                  </Link>
                </div>
              )}
              <button
                type="button"
                onClick={reset}
                className="mt-3 w-full border border-white/30 text-white/80 hover:bg-white/10 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Try another candle
              </button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CandleSvg({ type }: { type: 'bullish' | 'bearish' | 'doji' }) {
  // viewBox 0 0 60 200
  if (type === 'bullish') {
    const color = '#059669';
    return (
      <svg
        viewBox="0 0 60 200"
        role="img"
        aria-label="Bullish candle"
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
        aria-label="Bearish candle"
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
      aria-label="Doji candle"
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
