'use client';

// TICKRA-PHASE-3: performance analytics for the paper-trading simulator.
// Renders the metrics computed by lib/sim/analytics over the user's closed
// trades, plus an equity-curve sparkline. Purely presentational — all the
// number-crunching lives in the (unit-tested) analytics module.

import { useMemo } from 'react';
import { Activity, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { computeAnalytics, equitySparkline, type AnalyticsTrade } from '@/lib/sim/analytics';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Analyse de performance',
    desc: 'Calculée sur tes trades fermés. Pas un score — un miroir.',
    empty: 'Ferme quelques trades pour voir ton analyse de performance apparaître ici.',
    equity: 'Courbe d’équité',
    winRate: 'Taux de réussite',
    profitFactor: 'Profit factor',
    expectancy: 'Espérance / trade',
    avgR: 'R moyen',
    maxDd: 'Drawdown max',
    netPnl: 'P&L net',
    best: 'Meilleur',
    worst: 'Pire',
    streaks: 'Séries (gains / pertes)',
    trades: 'trades',
    na: '—',
  },
  en: {
    title: 'Performance analysis',
    desc: 'Computed on your closed trades. Not a score — a mirror.',
    empty: 'Close a few trades to see your performance analysis appear here.',
    equity: 'Equity curve',
    winRate: 'Win rate',
    profitFactor: 'Profit factor',
    expectancy: 'Expectancy / trade',
    avgR: 'Avg R',
    maxDd: 'Max drawdown',
    netPnl: 'Net P&L',
    best: 'Best',
    worst: 'Worst',
    streaks: 'Streaks (win / loss)',
    trades: 'trades',
    na: '—',
  },
};

function fmtUsd(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function SimAnalyticsPanel({
  trades,
  startBalance,
  locale,
}: {
  trades: AnalyticsTrade[];
  startBalance: number;
  locale: Locale;
}) {
  const t = copy[locale];
  const a = useMemo(() => computeAnalytics(trades, startBalance), [trades, startBalance]);

  if (a.trades === 0) {
    return (
      <section className="rounded-sm border border-line bg-surface p-6">
        <Header t={t} />
        <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{t.empty}</p>
      </section>
    );
  }

  const W = 520;
  const H = 120;
  const points = equitySparkline(a.equityCurve, W, H);
  const lastUp = a.equityCurve[a.equityCurve.length - 1] >= startBalance;

  const metrics: { label: string; value: string; tone?: 'up' | 'down' }[] = [
    { label: t.netPnl, value: fmtUsd(a.netPnl), tone: a.netPnl >= 0 ? 'up' : 'down' },
    { label: t.winRate, value: `${a.winRate.toFixed(0)}%` },
    { label: t.profitFactor, value: a.profitFactor === null ? t.na : a.profitFactor.toFixed(2) },
    { label: t.expectancy, value: fmtUsd(a.expectancy), tone: a.expectancy >= 0 ? 'up' : 'down' },
    { label: t.avgR, value: a.avgR === null ? t.na : `${a.avgR >= 0 ? '+' : ''}${a.avgR.toFixed(2)}R` },
    { label: t.maxDd, value: `${fmtUsd(a.maxDrawdown)} · ${a.maxDrawdownPct.toFixed(0)}%`, tone: 'down' },
    { label: t.best, value: fmtUsd(a.bestTrade), tone: 'up' },
    { label: t.worst, value: fmtUsd(a.worstTrade), tone: 'down' },
    { label: t.streaks, value: `${a.maxWinStreak} / ${a.maxLossStreak}` },
  ];

  return (
    <section className="rounded-sm border border-line bg-surface p-6">
      <Header t={t} />

      {/* Equity curve */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.18em] text-subtle">
          <span>{t.equity}</span>
          <span>
            {a.trades} {t.trades}
          </span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[120px] w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label={t.equity}
        >
          <polyline
            points={points}
            fill="none"
            stroke={lastUp ? 'rgb(var(--up))' : 'rgb(var(--down))'}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* Metrics grid */}
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">{m.label}</div>
            <div
              className={cn(
                'mt-1 text-[18px] font-semibold tracking-tight tabular-nums',
                m.tone === 'up' && 'text-up',
                m.tone === 'down' && 'text-down',
                !m.tone && 'text-ink',
              )}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Header({ t }: { t: (typeof copy)['fr'] }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-brand">
          <Activity className="h-3 w-3" strokeWidth={2} />
          {t.title}
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{t.desc}</p>
      </div>
      <div className="hidden gap-1 text-muted sm:flex">
        <TrendingUp className="h-4 w-4 text-up" strokeWidth={1.75} />
        <TrendingDown className="h-4 w-4 text-down" strokeWidth={1.75} />
      </div>
    </div>
  );
}
