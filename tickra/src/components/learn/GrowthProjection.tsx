'use client';

// TICKRA-PHASE-3: compound-growth projection. The deterministic counterpart to
// the Monte-Carlo tool — sets realistic expectations about what a monthly
// return actually compounds to. Maths in the pure lib/sim/projection module.

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { projectGrowth } from '@/lib/sim/projection';
import { equitySparkline } from '@/lib/sim/analytics';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Projection de croissance',
    subtitle: 'Ce qu’un rendement mensuel compose vraiment. Garde des attentes réalistes.',
    start: 'Capital de départ ($)',
    monthly: 'Rendement mensuel (%)',
    months: 'Durée (mois)',
    deposit: 'Apport mensuel ($)',
    final: 'Capital final',
    deposited: 'Total investi',
    profit: 'Gain du marché',
    multiple: 'Multiple',
    curve: 'Trajectoire',
    note: 'Modèle déterministe (rendement constant) — la réalité est volatile. Aucun rendement n’est garanti.',
  },
  en: {
    title: 'Growth projection',
    subtitle: 'What a monthly return actually compounds to. Keep expectations real.',
    start: 'Starting capital ($)',
    monthly: 'Monthly return (%)',
    months: 'Horizon (months)',
    deposit: 'Monthly deposit ($)',
    final: 'Final balance',
    deposited: 'Total invested',
    profit: 'Market gain',
    multiple: 'Multiple',
    curve: 'Trajectory',
    note: 'Deterministic model (constant return) — reality is volatile. No return is guaranteed.',
  },
};

function fmtUsd(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function GrowthProjection({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [start, setStart] = useState(1000);
  const [monthly, setMonthly] = useState(5);
  const [months, setMonths] = useState(36);
  const [deposit, setDeposit] = useState(0);

  const result = useMemo(
    () =>
      projectGrowth({
        start: Math.max(0, start),
        monthlyReturnPct: monthly,
        months: Math.min(600, Math.max(1, Math.round(months))),
        monthlyDeposit: Math.max(0, deposit),
      }),
    [start, monthly, months, deposit],
  );

  const points = equitySparkline(result.curve, 520, 120);
  const up = result.final >= result.totalDeposited;

  const stats: { label: string; value: string; tone?: 'up' | 'down'; accent?: boolean }[] = [
    { label: t.final, value: fmtUsd(result.final), accent: true },
    { label: t.deposited, value: fmtUsd(result.totalDeposited) },
    { label: t.profit, value: fmtUsd(result.profit), tone: result.profit >= 0 ? 'up' : 'down' },
    { label: t.multiple, value: `×${result.multiple.toFixed(1)}` },
  ];

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.subtitle}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <NumberField label={t.start} value={start} step={100} min={0} onChange={setStart} />
        <NumberField label={t.monthly} value={monthly} step={0.5} min={-50} max={100} onChange={setMonthly} />
        <NumberField label={t.months} value={months} step={1} min={1} max={600} onChange={setMonths} />
        <NumberField label={t.deposit} value={deposit} step={50} min={0} onChange={setDeposit} />
      </div>

      <div className="mt-7">
        <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-subtle">{t.curve}</div>
        <svg viewBox="0 0 520 120" className="h-[120px] w-full" preserveAspectRatio="none" role="img" aria-label={t.curve}>
          <polyline
            points={points}
            fill="none"
            stroke={up ? 'rgb(var(--up))' : 'rgb(var(--down))'}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-sm bg-line sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={cn('flex flex-col gap-2 bg-surface p-5', s.accent && 'bg-ink text-canvas')}>
            <span className={cn('font-mono text-[10px] uppercase tracking-[0.2em]', s.accent ? 'text-canvas/70' : 'text-muted')}>
              {s.label}
            </span>
            <span
              className={cn(
                'font-display text-2xl font-medium tracking-tight tabular-nums',
                !s.accent && s.tone === 'up' && 'text-up',
                !s.accent && s.tone === 'down' && 'text-down',
              )}
            >
              {s.value}
            </span>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-[12px] leading-relaxed text-muted">{t.note}</p>
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
