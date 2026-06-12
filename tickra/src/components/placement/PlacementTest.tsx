'use client';

import { useState } from 'react';
import Link from 'next/link';

// 6-question diagnostic. Hardcoded bilingual content. Routes the user to one
// of four starting tracks based on the score:
//   0-1 → forex-basics, 2-3 → japanese-candles,
//   4-5 → support-resistance, 6 → trend-strategies.
// When mounted on /[locale]/placement the page passes the active locale.

type Locale = 'fr' | 'en';

type Question = {
  fr: { q: string; options: string[]; correct: number };
  en: { q: string; options: string[]; correct: number };
};

const QUESTIONS: Question[] = [
  {
    fr: { q: 'Combien vaut 1 pip sur EUR/USD ?', options: ['0.1', '0.01', '0.0001', '0.00001'], correct: 2 },
    en: { q: 'How much is 1 pip on EUR/USD?', options: ['0.1', '0.01', '0.0001', '0.00001'], correct: 2 },
  },
  {
    fr: {
      q: 'Que représente le corps d’une bougie japonaise ?',
      options: [
        'L’écart entre le plus haut et le plus bas',
        'L’écart entre l’ouverture et la clôture',
        'Le volume échangé',
        'La volatilité implicite',
      ],
      correct: 1,
    },
    en: {
      q: 'What does the body of a Japanese candle represent?',
      options: [
        'The high-low range',
        'The gap between open and close',
        'Volume traded',
        'Implied volatility',
      ],
      correct: 1,
    },
  },
  {
    fr: {
      q: 'Un support, c’est :',
      options: [
        'Un niveau où le prix a tendance à rebondir à la hausse',
        'Un niveau où le prix accélère à la baisse',
        'Une moyenne mobile à 200 périodes',
        'Un indicateur de volume',
      ],
      correct: 0,
    },
    en: {
      q: 'A support is:',
      options: [
        'A level where price tends to bounce up',
        'A level where price accelerates down',
        'A 200-period moving average',
        'A volume indicator',
      ],
      correct: 0,
    },
  },
  {
    fr: {
      q: 'Quel est le risque maximum recommandé par trade pour un débutant ?',
      options: ['5% du capital', '2% du capital', '0.5% du capital', '10% du capital'],
      correct: 1,
    },
    en: {
      q: 'What is the recommended max risk per trade for a beginner?',
      options: ['5% of capital', '2% of capital', '0.5% of capital', '10% of capital'],
      correct: 1,
    },
  },
  {
    fr: {
      q: 'Un marché en range, c’est :',
      options: [
        'Un marché qui fait des plus hauts et plus bas successifs',
        'Un marché qui oscille entre support et résistance',
        'Un marché à très haute volatilité',
        'Un marché fermé',
      ],
      correct: 1,
    },
    en: {
      q: 'A ranging market is:',
      options: [
        'A market making higher highs and higher lows',
        'A market oscillating between support and resistance',
        'A very high-volatility market',
        'A closed market',
      ],
      correct: 1,
    },
  },
  {
    fr: {
      q: 'Avec un levier 30:1 et 1 000 € de capital, quelle est l’exposition maximale ?',
      options: ['3 000 €', '30 000 €', '300 €', '300 000 €'],
      correct: 1,
    },
    en: {
      q: 'With 30:1 leverage and €1,000 of capital, what is the max exposure?',
      options: ['€3,000', '€30,000', '€300', '€300,000'],
      correct: 1,
    },
  },
];

function recommendTrack(score: number): { id: string; titleFr: string; titleEn: string } {
  if (score <= 1) return { id: 'forex-basics', titleFr: 'Marchés & forex — les bases', titleEn: 'Markets & forex — the basics' };
  if (score <= 3) return { id: 'japanese-candles', titleFr: 'Bougies japonaises', titleEn: 'Japanese candles' };
  if (score <= 5) return { id: 'support-resistance', titleFr: 'Support & résistance', titleEn: 'Support & resistance' };
  return { id: 'trend-strategies', titleFr: 'Stratégies de tendance', titleEn: 'Trend strategies' };
}

const COPY = {
  fr: {
    title: 'Test de placement',
    sub: '6 questions. Nous routons votre apprentissage selon vos réponses.',
    next: 'Suivant',
    submit: 'Terminer',
    correct: 'Bonne réponse',
    wrong: 'Mauvaise réponse',
    progress: (i: number, n: number) => `Question ${i} / ${n}`,
    resultTitle: 'Votre score',
    resultBody: (s: number) =>
      `${s} / 6 — voici la piste recommandée pour commencer.`,
    startLesson: 'Commencer la première leçon',
    retake: 'Refaire le test',
  },
  en: {
    title: 'Placement test',
    sub: '6 questions. We route your learning based on your answers.',
    next: 'Next',
    submit: 'Finish',
    correct: 'Correct',
    wrong: 'Incorrect',
    progress: (i: number, n: number) => `Question ${i} / ${n}`,
    resultTitle: 'Your score',
    resultBody: (s: number) => `${s} / 6 — here's the recommended starting track.`,
    startLesson: 'Start the first lesson',
    retake: 'Retake the test',
  },
} as const;

export function PlacementTest({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [recommendation, setRecommendation] = useState<ReturnType<typeof recommendTrack> | null>(null);

  const total = QUESTIONS.length;
  const current = QUESTIONS[index]?.[locale];

  function choose(i: number) {
    if (revealed || !current) return;
    setPicked(i);
    setRevealed(true);
    if (i === current.correct) setScore((s) => s + 1);
  }

  async function advance() {
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
      setRevealed(false);
      return;
    }
    const rec = recommendTrack(score);
    setRecommendation(rec);
    setDone(true);
    try {
      await fetch('/api/placement/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ score, recommendedTrackId: rec.id }),
      });
    } catch {
      /* ignore — anonymous flow is fine */
    }
  }

  if (done && recommendation) {
    const recTitle = locale === 'fr' ? recommendation.titleFr : recommendation.titleEn;
    return (
      <div className="rounded-xl border border-line bg-canvas p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.resultTitle}</p>
        <h2 className="mt-3 font-display text-2xl font-medium text-ink">{t.resultBody(score)}</h2>
        <p className="mt-4 text-base text-ink">{recTitle}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/learn/${recommendation.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-canvas hover:opacity-90"
          >
            {t.startLesson} →
          </Link>
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setScore(0);
              setPicked(null);
              setRevealed(false);
              setDone(false);
              setRecommendation(null);
            }}
            className="inline-flex items-center justify-center rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-canvas"
          >
            {t.retake}
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="rounded-xl border border-line bg-canvas p-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
        {t.progress(index + 1, total)}
      </p>
      <h2 className="mt-3 font-display text-xl font-medium text-ink">{current.q}</h2>

      <ul className="mt-6 space-y-3">
        {current.options.map((opt, i) => {
          const isCorrect = i === current.correct;
          const isPicked = i === picked;
          let cls = 'border-line text-ink hover:bg-canvas';
          if (revealed && isCorrect) cls = 'border-up text-up';
          else if (revealed && isPicked && !isCorrect) cls = 'border-down text-down';
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => choose(i)}
                disabled={revealed}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${cls}`}
              >
                {opt}
              </button>
            </li>
          );
        })}
      </ul>

      {revealed && (
        <div className="mt-5 flex items-center justify-between">
          <span className={picked === current.correct ? 'text-sm text-up' : 'text-sm text-down'}>
            {picked === current.correct ? t.correct : t.wrong}
          </span>
          <button
            type="button"
            onClick={advance}
            className="inline-flex items-center justify-center rounded-lg bg-ink px-5 py-2 text-sm font-medium text-canvas hover:opacity-90"
          >
            {index + 1 < total ? t.next : t.submit} →
          </button>
        </div>
      )}
    </div>
  );
}
