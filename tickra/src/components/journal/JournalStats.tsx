'use client';

import type { Locale } from '@/lib/i18n/config';
import type { JournalStats as Stats, EquityPoint } from '@/lib/journal/stats';

type Props = { stats: Stats; curve: EquityPoint[]; locale: Locale };

const COPY = {
  fr: {
    winRate: 'Win-rate',
    trades: 'Trades',
    pnl: 'P&L total',
    expectancy: 'Espérance',
    avgR: 'R moyen',
    best: 'Meilleur',
    worst: 'Pire',
    streakW: 'Série gains',
    streakL: 'Série pertes',
    curve: 'Courbe d’equity',
    empty: 'Aucun trade clôturé pour l’instant. La courbe apparaîtra dès la première clôture.',
  },
  en: {
    winRate: 'Win rate',
    trades: 'Trades',
    pnl: 'Total P&L',
    expectancy: 'Expectancy',
    avgR: 'Avg R',
    best: 'Best',
    worst: 'Worst',
    streakW: 'Win streak',
    streakL: 'Loss streak',
    curve: 'Equity curve',
    empty: 'No closed trade yet. The curve appears as soon as you close one.',
  },
} as const;

function fmt(n: number, digits = 2) {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function JournalStats({ stats, curve, locale }: Props) {
  const t = COPY[locale];
  const pnlClass = stats.totalPnl > 0 ? 'text-up' : stats.totalPnl < 0 ? 'text-down' : 'text-ink';

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t.winRate} value={pct(stats.winRate)} sub={`${stats.wins}/${stats.closedTrades}`} />
        <Stat label={t.pnl} value={fmt(stats.totalPnl)} valueClass={pnlClass} />
        <Stat label={t.expectancy} value={fmt(stats.expectancy)} />
        <Stat label={t.avgR} value={`${fmt(stats.avgR, 2)}R`} />
        <Stat label={t.trades} value={String(stats.totalTrades)} sub={`${stats.openTrades} open`} />
        <Stat label={t.best} value={fmt(stats.bestTrade)} valueClass="text-up" />
        <Stat label={t.worst} value={fmt(stats.worstTrade)} valueClass="text-down" />
        <Stat
          label={`${t.streakW} / ${t.streakL}`}
          value={`${stats.longestWinStreak} / ${stats.longestLossStreak}`}
        />
      </dl>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">{t.curve}</p>
        {curve.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{t.empty}</p>
        ) : (
          <EquitySvg curve={curve} ariaLabel={t.curve} />
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  valueClass = 'text-ink',
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">{label}</dt>
      <dd className={`mt-2 font-display text-2xl font-medium ${valueClass}`}>
        {value}
        {sub ? <span className="mt-1 block text-xs font-normal text-muted">{sub}</span> : null}
      </dd>
    </div>
  );
}

// Inline SVG equity curve — pure stroke path, auto-fit to viewBox.
// Zero-line drawn for orientation; cumulative P&L plotted left→right.
function EquitySvg({ curve, ariaLabel }: { curve: EquityPoint[]; ariaLabel: string }) {
  const W = 600;
  const H = 180;
  const PAD = 16;
  const xs = curve.map((p) => p.x);
  const ys = curve.map((p) => p.y);
  const minX = 0;
  const maxX = Math.max(1, xs[xs.length - 1] ?? 1);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(0, ...ys);
  const rangeY = maxY - minY || 1;

  const px = (x: number) => PAD + ((x - minX) / (maxX - minX || 1)) * (W - PAD * 2);
  const py = (y: number) => H - PAD - ((y - minY) / rangeY) * (H - PAD * 2);

  const d = curve
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(p.x).toFixed(2)} ${py(p.y).toFixed(2)}`)
    .join(' ');

  const lastY = curve[curve.length - 1]?.y ?? 0;
  const stroke = lastY >= 0 ? 'rgb(var(--up))' : 'rgb(var(--down))';

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-4 h-44 w-full"
      role="img"
      aria-label={ariaLabel}
    >
      {/* Zero line */}
      <line
        x1={PAD}
        x2={W - PAD}
        y1={py(0)}
        y2={py(0)}
        stroke="rgb(var(--line))"
        strokeDasharray="3 4"
      />
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} />
    </svg>
  );
}
