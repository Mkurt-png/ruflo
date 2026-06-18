'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Calculateur d’espérance',
    subtitle: 'L’équation qui décide si votre stratégie tient.',
    winRate: 'Taux de réussite (%)',
    avgWin: 'Gain moyen (R)',
    avgLoss: 'Perte moyenne (R)',
    resultExpectancy: 'Espérance par trade',
    resultBreakeven: 'Taux minimum pour casser le 0',
    verdictPositive: 'Espérance positive — système viable.',
    verdictWeak: 'Espérance trop faible — les frais vont la ronger.',
    verdictNegative: 'Espérance négative — ne tradez pas ce système.',
    formula: 'E = (taux × gain) − ((1 − taux) × perte)',
  },
  en: {
    title: 'Expectancy calculator',
    subtitle: 'The equation that decides if your strategy holds.',
    winRate: 'Win rate (%)',
    avgWin: 'Avg win (R)',
    avgLoss: 'Avg loss (R)',
    resultExpectancy: 'Expectancy per trade',
    resultBreakeven: 'Min win rate to break even',
    verdictPositive: 'Positive expectancy — viable system.',
    verdictWeak: 'Too thin — fees will eat it.',
    verdictNegative: 'Negative expectancy — do not trade this system.',
    formula: 'E = (rate × win) − ((1 − rate) × loss)',
  },
};

export function ExpectancyCalculator({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [winRate, setWinRate] = useState(45);
  const [avgWin, setAvgWin] = useState(2);
  const [avgLoss, setAvgLoss] = useState(1);

  const result = useMemo(() => {
    const p = Math.min(1, Math.max(0, winRate / 100));
    const expectancy = p * avgWin - (1 - p) * avgLoss;
    // Break-even: p such that p*w - (1-p)*l = 0 → p = l / (w + l)
    const denom = avgWin + avgLoss;
    const breakeven = denom > 0 ? (avgLoss / denom) * 100 : 0;
    const verdict = expectancy >= 0.2 ? 'positive' : expectancy > 0 ? 'weak' : 'negative';
    return { expectancy, breakeven, verdict } as const;
  }, [winRate, avgWin, avgLoss]);

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.subtitle}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <NumberField label={t.winRate} value={winRate} step={1} min={0} max={100} onChange={setWinRate} />
        <NumberField label={t.avgWin} value={avgWin} step={0.1} min={0} onChange={setAvgWin} />
        <NumberField label={t.avgLoss} value={avgLoss} step={0.1} min={0} onChange={setAvgLoss} />
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-sm bg-line">
        <Stat
          label={t.resultExpectancy}
          value={`${result.expectancy >= 0 ? '+' : ''}${result.expectancy.toFixed(2)} R`}
          accent
        />
        <Stat label={t.resultBreakeven} value={`${result.breakeven.toFixed(1)} %`} />
      </dl>

      <p
        className={cn(
          'mt-5 text-[13.5px]',
          result.verdict === 'positive' && 'text-up',
          result.verdict === 'weak' && 'text-muted',
          result.verdict === 'negative' && 'text-down',
        )}
      >
        {result.verdict === 'positive'
          ? t.verdictPositive
          : result.verdict === 'weak'
            ? t.verdictWeak
            : t.verdictNegative}
      </p>

      <div className="mt-6 border-t border-line pt-5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
        {t.formula}
      </div>
    </article>
  );
}

function NumberField({
  label,
  value,
  step,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
        {label}
      </label>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
        className="mt-3 block h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] tabular-nums text-ink placeholder:text-subtle focus-visible:border-ink focus-visible:outline-none"
      />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-2 bg-surface p-5', accent && 'bg-ink text-canvas')}>
      <dt
        className={cn(
          'font-mono text-[10.5px] uppercase tracking-[0.2em]',
          accent ? 'text-canvas/70' : 'text-muted',
        )}
      >
        {label}
      </dt>
      <dd className="font-display text-2xl font-medium tracking-tight tabular-nums">{value}</dd>
    </div>
  );
}
