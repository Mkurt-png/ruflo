'use client';

// TICKRA-PHASE-3: "math of losses" tool. Two asymmetries that decide survival:
// the gain needed to recover a drawdown, and the win rate needed to break even
// at a given reward:risk. All maths in the pure lib/sim/risk-math module.

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import {
  recoveryGainPct,
  recoveryTable,
  breakevenWinRatePct,
  expectancyR,
} from '@/lib/sim/risk-math';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'La math des pertes',
    subtitle: 'Deux asymétries qui décident de ta survie. Aucune donnée envoyée.',
    ddTitle: 'Récupérer un drawdown',
    ddInput: 'Drawdown (%)',
    ddResult: 'Gain nécessaire pour revenir à zéro',
    ddTable: 'Le mur grandit vite',
    beTitle: 'Win-rate de rentabilité',
    beInput: 'Ratio gain:risque (R)',
    beWin: 'Win-rate de seuil',
    beYourWin: 'Ton win-rate (%)',
    beExp: 'Espérance',
    beEdge: 'Edge positif ✓',
    beNoEdge: 'Pas d’edge ✗',
    infinite: 'Irrécupérable',
  },
  en: {
    title: 'The math of losses',
    subtitle: 'Two asymmetries that decide your survival. No data sent.',
    ddTitle: 'Recovering a drawdown',
    ddInput: 'Drawdown (%)',
    ddResult: 'Gain needed to get back to flat',
    ddTable: 'The wall grows fast',
    beTitle: 'Break-even win rate',
    beInput: 'Reward:risk ratio (R)',
    beWin: 'Break-even win rate',
    beYourWin: 'Your win rate (%)',
    beExp: 'Expectancy',
    beEdge: 'Positive edge ✓',
    beNoEdge: 'No edge ✗',
    infinite: 'Unrecoverable',
  },
};

export function LossMathPanel({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [drawdown, setDrawdown] = useState(50);
  const [reward, setReward] = useState(2);
  const [yourWin, setYourWin] = useState(45);

  const recovery = useMemo(() => recoveryGainPct(drawdown), [drawdown]);
  const table = useMemo(() => recoveryTable(), []);
  const beWin = useMemo(() => breakevenWinRatePct(reward), [reward]);
  const exp = useMemo(() => expectancyR(yourWin, reward), [yourWin, reward]);
  const hasEdge = exp > 0;

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.subtitle}</p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Drawdown recovery */}
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">{t.ddTitle}</div>
          <div className="mt-4">
            <NumberField label={t.ddInput} value={drawdown} step={1} min={0} max={99} onChange={setDrawdown} />
          </div>
          <div className="mt-4 rounded-sm border border-down/40 bg-down/10 p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t.ddResult}</div>
            <div className="mt-1 font-display text-3xl font-medium tabular-nums text-down">
              {Number.isFinite(recovery) ? `+${recovery.toFixed(0)}%` : t.infinite}
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-subtle">{t.ddTable}</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px] tabular-nums">
              {table.slice(2).map((row) => (
                <div key={row.drawdown} className="flex justify-between border-b border-line/60 py-0.5">
                  <dt className="text-muted">-{row.drawdown}%</dt>
                  <dd className="font-medium text-ink">
                    {Number.isFinite(row.recovery) ? `+${row.recovery.toFixed(0)}%` : '∞'}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Break-even win rate */}
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">{t.beTitle}</div>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <NumberField label={t.beInput} value={reward} step={0.1} min={0.1} max={10} onChange={setReward} />
            <NumberField label={t.beYourWin} value={yourWin} step={1} min={0} max={100} onChange={setYourWin} />
          </div>
          <div className="mt-4 rounded-sm border border-line bg-elevated p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t.beWin}</div>
            <div className="mt-1 font-display text-3xl font-medium tabular-nums text-ink">{beWin.toFixed(1)}%</div>
          </div>
          <div
            className={cn(
              'mt-3 rounded-sm border p-4',
              hasEdge ? 'border-up bg-up/10' : 'border-down bg-down/10',
            )}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t.beExp}</div>
            <div
              className={cn(
                'mt-1 font-display text-2xl font-medium tabular-nums',
                hasEdge ? 'text-up' : 'text-down',
              )}
            >
              {exp >= 0 ? '+' : ''}
              {exp.toFixed(2)}R · {hasEdge ? t.beEdge : t.beNoEdge}
            </div>
          </div>
        </div>
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
