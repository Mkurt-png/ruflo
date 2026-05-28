'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Calculateur de taille de position',
    subtitle: 'Trois variables, une équation. Tickra l’utilise sur chaque trade.',
    capital: 'Capital ($)',
    riskPct: 'Risque par trade (%)',
    entry: 'Prix d’entrée',
    stop: 'Prix du stop',
    resultRisk: 'Risque accepté',
    resultDistance: 'Distance au stop',
    resultSize: 'Taille de position',
    resultUnits: 'unités',
    resultNotional: 'Notional',
    invalid: 'Stop = entrée. Ajustez l’un des deux.',
    formula: 'Taille = (Capital × Risque%) ÷ Distance',
    legend: 'Aucune donnée saisie n’est envoyée — calcul local.',
  },
  en: {
    title: 'Position size calculator',
    subtitle: 'Three inputs, one equation. Tickra uses it on every trade.',
    capital: 'Capital ($)',
    riskPct: 'Risk per trade (%)',
    entry: 'Entry price',
    stop: 'Stop price',
    resultRisk: 'Accepted risk',
    resultDistance: 'Stop distance',
    resultSize: 'Position size',
    resultUnits: 'units',
    resultNotional: 'Notional',
    invalid: 'Stop = entry. Adjust one of the two.',
    formula: 'Size = (Capital × Risk%) ÷ Distance',
    legend: 'No value you type is sent — local computation.',
  },
};

export function PositionSizer({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [capital, setCapital] = useState(10000);
  const [riskPct, setRiskPct] = useState(1);
  const [entry, setEntry] = useState(100);
  const [stop, setStop] = useState(95);

  const result = useMemo(() => {
    const risk = capital * (riskPct / 100);
    const distance = Math.abs(entry - stop);
    if (distance === 0) return { risk, distance: 0, size: 0, notional: 0, valid: false };
    const size = risk / distance;
    const notional = size * entry;
    return { risk, distance, size, notional, valid: true };
  }, [capital, riskPct, entry, stop]);

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
        {t.title}
      </div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.subtitle}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <NumberField label={t.capital} value={capital} step={100} min={0} onChange={setCapital} />
        <NumberField label={t.riskPct} value={riskPct} step={0.1} min={0.1} max={10} onChange={setRiskPct} />
        <NumberField label={t.entry} value={entry} step={0.01} min={0} onChange={setEntry} />
        <NumberField label={t.stop} value={stop} step={0.01} min={0} onChange={setStop} />
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-sm bg-line">
        <Stat label={t.resultRisk} value={fmtMoney(result.risk, locale)} />
        <Stat label={t.resultDistance} value={fmtNumber(result.distance, locale)} />
        <Stat
          label={t.resultSize}
          value={result.valid ? `${fmtNumber(result.size, locale)} ${t.resultUnits}` : '—'}
          accent
        />
        <Stat label={t.resultNotional} value={result.valid ? fmtMoney(result.notional, locale) : '—'} />
      </dl>

      {!result.valid ? (
        <p className="mt-4 text-[13px] text-down">{t.invalid}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3 border-t border-line pt-5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
        <span>{t.formula}</span>
        <span>{t.legend}</span>
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
      <span
        className={cn(
          'font-mono text-[10.5px] uppercase tracking-[0.2em]',
          accent ? 'text-canvas/70' : 'text-muted',
        )}
      >
        {label}
      </span>
      <span className="font-display text-2xl font-medium tracking-tight tabular-nums">{value}</span>
    </div>
  );
}

function fmtMoney(n: number, locale: Locale): string {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtNumber(n: number, locale: Locale): string {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    maximumFractionDigits: 2,
  }).format(n);
}
