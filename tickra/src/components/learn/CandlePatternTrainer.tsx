'use client';

// TICKRA-PHASE-3: candlestick-pattern trainer. Renders a synthetic pattern as
// SVG candles and asks the user to name it; reveals the meaning and awards XP.
// Pattern data + question generation live in the (unit-tested) pure module
// lib/learn/candle-patterns; this component only renders + tracks the round.

import { useMemo, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { addXp } from '@/lib/progress/xp';
import {
  buildQuestion,
  patternForSeed,
  type Candle,
} from '@/lib/learn/candle-patterns';

type Locale = 'fr' | 'en';

const XP_PER_CORRECT = 4;

const copy = {
  fr: {
    title: 'Reconnaître les figures',
    subtitle: 'Une figure dessinée, quatre noms. Entraîne ton œil.',
    prompt: 'Quelle est cette figure ?',
    next: 'Figure suivante',
    score: 'Score',
    correct: 'Correct',
    wrong: 'Raté',
    bias: { bullish: 'Haussier', bearish: 'Baissier', neutral: 'Neutre' },
    xp: 'XP',
  },
  en: {
    title: 'Spot the pattern',
    subtitle: 'One drawn pattern, four names. Train your eye.',
    prompt: 'What pattern is this?',
    next: 'Next pattern',
    score: 'Score',
    correct: 'Correct',
    wrong: 'Missed',
    bias: { bullish: 'Bullish', bearish: 'Bearish', neutral: 'Neutral' },
    xp: 'XP',
  },
};

function Candles({ candles }: { candles: Candle[] }) {
  const W = 280;
  const Hgt = 180;
  const padX = 24;
  const padY = 16;
  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const span = max - min || 1;
  const slot = (W - padX * 2) / candles.length;
  const bodyW = Math.min(28, slot * 0.5);

  const y = (price: number) => padY + (Hgt - padY * 2) * (1 - (price - min) / span);

  return (
    <svg viewBox={`0 0 ${W} ${Hgt}`} className="h-[180px] w-full" role="img" aria-label="candlestick pattern">
      {candles.map((c, i) => {
        const cx = padX + slot * (i + 0.5);
        const up = c.c >= c.o;
        const color = up ? 'rgb(var(--up))' : 'rgb(var(--down))';
        const bodyTop = y(Math.max(c.o, c.c));
        const bodyBottom = y(Math.min(c.o, c.c));
        const bodyH = Math.max(2, bodyBottom - bodyTop);
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth={1.5} />
            <rect
              x={cx - bodyW / 2}
              y={bodyTop}
              width={bodyW}
              height={bodyH}
              fill={color}
              rx={1}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function CandlePatternTrainer({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);

  const pattern = useMemo(() => patternForSeed(seed), [seed]);
  const question = useMemo(() => buildQuestion(pattern, locale, seed), [pattern, locale, seed]);

  const pick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    setRounds((r) => r + 1);
    if (idx === question.correctIndex) {
      setScore((s) => s + 1);
      addXp(XP_PER_CORRECT);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('tickra-xp-changed'));
    }
  };

  const next = () => {
    setPicked(null);
    setSeed(Math.floor(Math.random() * 1e9));
  };

  const revealed = picked !== null;

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
          <p className="mt-3 max-w-md text-[14px] text-muted">{t.subtitle}</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-subtle">{t.score}</div>
          <div className="mt-1 font-display text-2xl font-medium tabular-nums text-ink">
            {score}
            <span className="text-[15px] text-muted">/{rounds}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-sm border border-line bg-canvas p-4">
        <Candles candles={pattern.candles} />
      </div>

      <p className="mt-5 text-[14px] font-medium text-ink">{t.prompt}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctIndex;
          const isPicked = i === picked;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => pick(i)}
              disabled={revealed}
              className={cn(
                'flex items-center justify-between gap-2 rounded-sm border px-4 py-3 text-left text-[14px] transition-colors',
                !revealed && 'border-line bg-canvas text-ink hover:border-ink',
                revealed && isCorrect && 'border-up bg-up/10 text-ink',
                revealed && isPicked && !isCorrect && 'border-down bg-down/10 text-ink',
                revealed && !isCorrect && !isPicked && 'border-line bg-canvas text-muted',
              )}
            >
              <span>{opt}</span>
              {revealed && isCorrect ? <Check className="h-4 w-4 text-up" strokeWidth={2} /> : null}
              {revealed && isPicked && !isCorrect ? <X className="h-4 w-4 text-down" strokeWidth={2} /> : null}
            </button>
          );
        })}
      </div>

      {revealed ? (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-mono text-[10.5px] uppercase tracking-[0.18em]',
                picked === question.correctIndex ? 'text-up' : 'text-down',
              )}
            >
              {picked === question.correctIndex ? `${t.correct} · +${XP_PER_CORRECT} ${t.xp}` : t.wrong}
            </span>
            <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">
              {t.bias[pattern.bias]}
            </span>
          </div>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{pattern.meaning[locale]}</p>
          <button
            type="button"
            onClick={next}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[13.5px] font-medium text-canvas transition-all hover:-translate-y-0.5 hover:brightness-110"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
            {t.next}
          </button>
        </div>
      ) : null}
    </article>
  );
}
