'use client';

// TICKRA-PHASE-3: Monte-Carlo risk-of-ruin tool. Makes the abstract "your edge
// needs to survive variance" lesson concrete by simulating thousands of trade
// sequences and showing the distribution of outcomes. All maths runs locally
// in lib/sim/monte-carlo (unit-tested); this is presentation only.

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { runMonteCarlo } from '@/lib/sim/monte-carlo';
import { equitySparkline } from '@/lib/sim/analytics';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Simulateur de risque de ruine',
    subtitle: 'Ton edge survit-il à la variance ? 1 000 séquences simulées localement.',
    winRate: 'Taux de réussite (%)',
    reward: 'Gain par trade (R)',
    risk: 'Risque par trade (%)',
    trades: 'Trades par séquence',
    ruinLabel: 'Risque de ruine',
    ruinHint: 'Proba de perdre 50 % du capital',
    median: 'Capital médian',
    p5: 'Pire 5 %',
    p95: 'Meilleur 5 %',
    profitable: 'Séquences gagnantes',
    curves: 'Quelques trajectoires',
    legend: 'Aucune donnée envoyée — simulation locale (Monte-Carlo).',
    note: 'Hypothèse : perte = 1R par trade perdant. Le R saisi est le gain moyen sur un trade gagnant.',
  },
  en: {
    title: 'Risk-of-ruin simulator',
    subtitle: 'Does your edge survive variance? 1,000 sequences simulated locally.',
    winRate: 'Win rate (%)',
    reward: 'Reward per trade (R)',
    risk: 'Risk per trade (%)',
    trades: 'Trades per sequence',
    ruinLabel: 'Risk of ruin',
    ruinHint: 'Probability of losing 50% of capital',
    median: 'Median capital',
    p5: 'Worst 5%',
    p95: 'Best 5%',
    profitable: 'Winning sequences',
    curves: 'A few trajectories',
    legend: 'No data sent — local Monte-Carlo simulation.',
    note: 'Assumption: loss = 1R per losing trade. The R you set is the average gain on a winning trade.',
  },
};

export function RiskOfRuinSimulator({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [winRate, setWinRate] = useState(45);
  const [reward, setReward] = useState(2);
  const [risk, setRisk] = useState(1);
  const [trades, setTrades] = useState(200);

  const result = useMemo(
    () =>
      runMonteCarlo({
        winRate: Math.min(1, Math.max(0, winRate / 100)),
        rewardR: Math.max(0, reward),
        lossR: 1,
        riskPerTrade: Math.min(1, Math.max(0, risk / 100)),
        trades: Math.min(2000, Math.max(1, Math.round(trades))),
        runs: 1000,
        ruinDrawdown: 0.5,
        seed: 0x7c5cd9, // fixed so the same inputs give the same answer
      }),
    [winRate, reward, risk, trades],
  );

  const ruinPct = result.riskOfRuin * 100;
  const ruinTone = ruinPct >= 25 ? 'down' : ruinPct >= 5 ? 'warn' : 'up';

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.subtitle}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <NumberField label={t.winRate} value={winRate} step={1} min={0} max={100} onChange={setWinRate} />
        <NumberField label={t.reward} value={reward} step={0.1} min={0.1} max={10} onChange={setReward} />
        <NumberField label={t.risk} value={risk} step={0.25} min={0.25} max={20} onChange={setRisk} />
        <NumberField label={t.trades} value={trades} step={10} min={10} max={2000} onChange={setTrades} />
      </div>

      {/* Headline: risk of ruin */}
      <div
        className={cn(
          'mt-8 rounded-sm border p-5',
          ruinTone === 'down' && 'border-down bg-down/10',
          ruinTone === 'warn' && 'border-line bg-elevated',
          ruinTone === 'up' && 'border-up bg-up/10',
        )}
      >
        <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted">{t.ruinLabel}</div>
        <div
          className={cn(
            'mt-2 font-display text-4xl font-medium tracking-tight tabular-nums',
            ruinTone === 'down' && 'text-down',
            ruinTone === 'up' && 'text-up',
            ruinTone === 'warn' && 'text-ink',
          )}
        >
          {ruinPct.toFixed(1)}%
        </div>
        <p className="mt-1 text-[12.5px] text-muted">{t.ruinHint}</p>
      </div>

      {/* Distribution stats */}
      <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-sm bg-line sm:grid-cols-4">
        <Stat label={t.median} value={`×${result.median.toFixed(2)}`} accent />
        <Stat label={t.p5} value={`×${result.p5.toFixed(2)}`} tone="down" />
        <Stat label={t.p95} value={`×${result.p95.toFixed(2)}`} tone="up" />
        <Stat label={t.profitable} value={`${(result.profitable * 100).toFixed(0)}%`} />
      </dl>

      {/* Sample trajectories */}
      <div className="mt-6">
        <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">{t.curves}</div>
        <svg viewBox="0 0 520 120" className="h-[120px] w-full" preserveAspectRatio="none" aria-hidden>
          {result.sampleCurves.map((curve, i) => {
            const last = curve[curve.length - 1];
            return (
              <polyline
                key={i}
                points={equitySparkline(curve, 520, 120)}
                fill="none"
                stroke={last >= 1 ? 'rgb(var(--up))' : 'rgb(var(--down))'}
                strokeWidth={1}
                strokeOpacity={0.7}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-muted">{t.note}</p>
      <div className="mt-5 border-t border-line pt-5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
        {t.legend}
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
      <label className="block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{label}</label>
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

function Stat({ label, value, accent, tone }: { label: string; value: string; accent?: boolean; tone?: 'up' | 'down' }) {
  return (
    <div className={cn('flex flex-col gap-2 bg-surface p-5', accent && 'bg-ink text-canvas')}>
      <span className={cn('font-mono text-[10.5px] uppercase tracking-[0.2em]', accent ? 'text-canvas/70' : 'text-muted')}>
        {label}
      </span>
      <span
        className={cn(
          'font-display text-2xl font-medium tracking-tight tabular-nums',
          !accent && tone === 'up' && 'text-up',
          !accent && tone === 'down' && 'text-down',
        )}
      >
        {value}
      </span>
    </div>
  );
}
