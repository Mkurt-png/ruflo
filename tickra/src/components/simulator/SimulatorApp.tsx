'use client';

// TICKRA-SPRINT-B: Paper-trading simulator — gated to Pro/Lifetime users.
// Self-contained client app:
//  - TradingView widget for the chart (free embed, no API key).
//  - Virtual balance + open/closed positions persisted in localStorage so the
//    user keeps state across sessions until we wire a Supabase table.
//  - Synthetic price walk per open position so P&L moves realistically without
//    needing a market-data subscription.
//
// Buy/Sell flow: pick symbol, size in lots, stop loss in pips, take profit in
// pips → opens a position. Auto-closes when SL or TP is hit.

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Lock, RotateCcw, TrendingDown, TrendingUp, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { useUser } from '@/lib/auth/useUser';
import { TradingViewWidget } from './TradingViewWidget';
import { PaywallCard } from '@/components/learn/PaywallCard';

type Locale = 'fr' | 'en';

type Side = 'long' | 'short';

type SymbolKey = 'EURUSD' | 'GBPUSD' | 'USDJPY' | 'XAUUSD' | 'BTCUSD' | 'SPX';

const SYMBOLS: Record<SymbolKey, { tv: string; label: string; pip: number; price: number; pipValuePerLot: number }> = {
  // pip = price granularity for 1 pip; price = baseline used as entry seed.
  // pipValuePerLot = USD per pip for 1 standard lot.
  EURUSD: { tv: 'FX:EURUSD', label: 'EUR/USD', pip: 0.0001, price: 1.085, pipValuePerLot: 10 },
  GBPUSD: { tv: 'FX:GBPUSD', label: 'GBP/USD', pip: 0.0001, price: 1.27,  pipValuePerLot: 10 },
  USDJPY: { tv: 'FX:USDJPY', label: 'USD/JPY', pip: 0.01,   price: 150.5, pipValuePerLot: 9  },
  XAUUSD: { tv: 'OANDA:XAUUSD', label: 'Or (XAU/USD)', pip: 0.1, price: 2350, pipValuePerLot: 10 },
  BTCUSD: { tv: 'COINBASE:BTCUSD', label: 'BTC/USD', pip: 1, price: 67500, pipValuePerLot: 1 },
  SPX:    { tv: 'TVC:SPX', label: 'S&P 500', pip: 0.25, price: 5300, pipValuePerLot: 5 },
};

type Position = {
  id: string;
  symbol: SymbolKey;
  side: Side;
  size: number;      // in lots (can be 0.01 micro to 1 standard)
  entry: number;     // entry price
  current: number;   // last simulated price
  stopPips: number;  // stop distance in pips
  tpPips: number;    // take-profit distance in pips
  openedAt: number;  // unix ms
};

type ClosedPosition = Position & { closedAt: number; closeReason: 'tp' | 'sl' | 'manual'; pnl: number };

type State = {
  balance: number;        // virtual USD
  open: Position[];
  closed: ClosedPosition[];
};

const INITIAL: State = { balance: 10_000, open: [], closed: [] };
const STORAGE_KEY = 'tickra-simulator-v1';

function loadState(): State {
  if (typeof window === 'undefined') return INITIAL;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL;
    const parsed = JSON.parse(raw) as State;
    if (typeof parsed.balance !== 'number') return INITIAL;
    return parsed;
  } catch {
    return INITIAL;
  }
}

function saveState(s: State): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* quota or private mode — silently ignore */
  }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function pnlOf(p: Position): number {
  const meta = SYMBOLS[p.symbol];
  const pips = ((p.current - p.entry) / meta.pip) * (p.side === 'long' ? 1 : -1);
  return pips * meta.pipValuePerLot * p.size;
}

function fmtUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

const COPY = {
  fr: {
    title: 'Simulateur de trading',
    subtitle: 'Compte démo à 10 000 $. Aucun argent réel. Vos positions sont sauvegardées localement.',
    balance: 'Solde',
    floating: 'P&L flottant',
    equity: 'Equity',
    openPositions: 'Positions ouvertes',
    closedPositions: 'Historique',
    none: 'Aucune position pour le moment.',
    none2: 'Pas encore de trade clôturé.',
    symbol: 'Instrument',
    side: 'Sens',
    size: 'Taille (lots)',
    stop: 'Stop (pips)',
    tp: 'TP (pips)',
    long: 'Acheter (Long)',
    short: 'Vendre (Short)',
    risk: 'Risque',
    reward: 'Gain potentiel',
    rr: 'R:R',
    open: 'Ouvrir la position',
    close: 'Clôturer',
    closeReasonTp: 'Take-profit',
    closeReasonSl: 'Stop-loss',
    closeReasonManual: 'Manuel',
    reset: 'Réinitialiser le compte',
    resetConfirm: 'Tout effacer et repartir à 10 000 $ ?',
    stats: 'Statistiques',
    winRate: 'Taux de réussite',
    avgR: 'R moyen',
    trades: 'Trades',
    netPnl: 'P&L net',
    legal: 'Données simulées. Aucun ordre réel n’est passé.',
  },
  en: {
    title: 'Trading simulator',
    subtitle: 'Demo account with $10,000. No real money. Positions saved locally.',
    balance: 'Balance',
    floating: 'Floating P&L',
    equity: 'Equity',
    openPositions: 'Open positions',
    closedPositions: 'History',
    none: 'No positions yet.',
    none2: 'No closed trades yet.',
    symbol: 'Instrument',
    side: 'Side',
    size: 'Size (lots)',
    stop: 'Stop (pips)',
    tp: 'TP (pips)',
    long: 'Buy (Long)',
    short: 'Sell (Short)',
    risk: 'Risk',
    reward: 'Potential reward',
    rr: 'R:R',
    open: 'Open position',
    close: 'Close',
    closeReasonTp: 'Take-profit',
    closeReasonSl: 'Stop-loss',
    closeReasonManual: 'Manual',
    reset: 'Reset account',
    resetConfirm: 'Erase everything and restart at $10,000?',
    stats: 'Statistics',
    winRate: 'Win rate',
    avgR: 'Avg R',
    trades: 'Trades',
    netPnl: 'Net P&L',
    legal: 'Simulated data. No real orders are placed.',
  },
} as const;

export function SimulatorApp({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const { user, plan, ready } = useUser();
  const [state, setState] = useState<State>(INITIAL);
  const [hydrated, setHydrated] = useState(false);

  const [symbol, setSymbol] = useState<SymbolKey>('EURUSD');
  const [size, setSize] = useState<number>(0.1);
  const [stopPips, setStopPips] = useState<number>(20);
  const [tpPips, setTpPips] = useState<number>(40);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  // Synthetic price walk + TP/SL check every 1.2s.
  useEffect(() => {
    if (!hydrated) return;
    const id = setInterval(() => {
      setState((prev) => {
        let balance = prev.balance;
        const stillOpen: Position[] = [];
        const newlyClosed: ClosedPosition[] = [];

        for (const p of prev.open) {
          const meta = SYMBOLS[p.symbol];
          // Random walk ±0.4 pip per tick.
          const drift = (Math.random() - 0.5) * 0.8 * meta.pip;
          const next = { ...p, current: p.current + drift };

          const moveFromEntryPips = ((next.current - next.entry) / meta.pip) * (next.side === 'long' ? 1 : -1);

          if (moveFromEntryPips >= next.tpPips) {
            const pnl = next.tpPips * meta.pipValuePerLot * next.size;
            balance += pnl;
            newlyClosed.push({ ...next, closedAt: Date.now(), closeReason: 'tp', pnl });
          } else if (moveFromEntryPips <= -next.stopPips) {
            const pnl = -next.stopPips * meta.pipValuePerLot * next.size;
            balance += pnl;
            newlyClosed.push({ ...next, closedAt: Date.now(), closeReason: 'sl', pnl });
          } else {
            stillOpen.push(next);
          }
        }

        const out: State = {
          balance,
          open: stillOpen,
          closed: newlyClosed.length ? [...newlyClosed, ...prev.closed].slice(0, 200) : prev.closed,
        };
        if (newlyClosed.length || stillOpen.length) saveState(out);
        return out;
      });
    }, 1200);
    return () => clearInterval(id);
  }, [hydrated]);

  const symbolMeta = SYMBOLS[symbol];
  const riskUsd = stopPips * symbolMeta.pipValuePerLot * size;
  const rewardUsd = tpPips * symbolMeta.pipValuePerLot * size;
  const rr = stopPips > 0 ? tpPips / stopPips : 0;

  const floatingPnl = useMemo(() => state.open.reduce((acc, p) => acc + pnlOf(p), 0), [state.open]);
  const equity = state.balance + floatingPnl;

  const stats = useMemo(() => {
    const closed = state.closed;
    const trades = closed.length;
    const wins = closed.filter((c) => c.pnl > 0).length;
    const winRate = trades ? (wins / trades) * 100 : 0;
    const netPnl = closed.reduce((acc, c) => acc + c.pnl, 0);
    const rValues = closed
      .filter((c) => c.stopPips > 0)
      .map((c) => c.pnl / (c.stopPips * SYMBOLS[c.symbol].pipValuePerLot * c.size));
    const avgR = rValues.length ? rValues.reduce((a, b) => a + b, 0) / rValues.length : 0;
    return { trades, winRate, netPnl, avgR };
  }, [state.closed]);

  const openTrade = (side: Side) => {
    const entry = symbolMeta.price + (Math.random() - 0.5) * 4 * symbolMeta.pip;
    const pos: Position = {
      id: uid(),
      symbol,
      side,
      size,
      entry,
      current: entry,
      stopPips,
      tpPips,
      openedAt: Date.now(),
    };
    setState((prev) => {
      const out = { ...prev, open: [pos, ...prev.open] };
      saveState(out);
      return out;
    });
  };

  const closeManual = (id: string) => {
    setState((prev) => {
      const p = prev.open.find((x) => x.id === id);
      if (!p) return prev;
      const pnl = pnlOf(p);
      const closed: ClosedPosition = { ...p, closedAt: Date.now(), closeReason: 'manual', pnl };
      const out: State = {
        balance: prev.balance + pnl,
        open: prev.open.filter((x) => x.id !== id),
        closed: [closed, ...prev.closed].slice(0, 200),
      };
      saveState(out);
      return out;
    });
  };

  const reset = () => {
    if (!window.confirm(t.resetConfirm)) return;
    setState(INITIAL);
    saveState(INITIAL);
  };

  if (!ready) return <div className="h-[60vh]" aria-hidden />;

  if (!user) {
    return (
      <div className="rounded-sm border border-line bg-surface p-8 text-center">
        <Lock aria-hidden className="mx-auto h-6 w-6 text-muted" strokeWidth={1.75} />
        <p className="mt-4 text-[15px] text-ink">
          {locale === 'fr' ? 'Connectez-vous pour accéder au simulateur.' : 'Sign in to access the simulator.'}
        </p>
        <Link
          href={`/${locale}/signin?next=/${locale}/me/simulator`}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium text-canvas hover:bg-ink/90"
        >
          {locale === 'fr' ? 'Se connecter' : 'Sign in'}
        </Link>
      </div>
    );
  }

  if (plan === 'free') {
    return (
      <PaywallCard
        locale={locale}
        signedIn
        freeLessonHref={`/${locale}/learn`}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Equity bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Stat label={t.balance} value={fmtUsd(state.balance)} />
        <Stat
          label={t.floating}
          value={fmtUsd(floatingPnl)}
          tone={floatingPnl >= 0 ? 'up' : 'down'}
        />
        <Stat label={t.equity} value={fmtUsd(equity)} accent />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* ─── Chart ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 rounded-sm border border-line bg-surface p-3 md:p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {(Object.keys(SYMBOLS) as SymbolKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSymbol(k)}
                className={cn(
                  'inline-flex h-9 items-center rounded-full px-3.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
                  symbol === k ? 'bg-ink text-canvas' : 'border border-line text-muted hover:border-ink hover:text-ink',
                )}
              >
                {SYMBOLS[k].label}
              </button>
            ))}
          </div>
          <TradingViewWidget symbol={symbolMeta.tv} />
        </div>

        {/* ─── Trade panel ──────────────────────────────────────── */}
        <div className="rounded-sm border border-line bg-surface p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            {symbolMeta.label}
          </p>
          <div className="mt-4 space-y-4">
            <Field
              label={t.size}
              value={size}
              step={0.01}
              min={0.01}
              max={2}
              onChange={setSize}
            />
            <Field
              label={t.stop}
              value={stopPips}
              step={1}
              min={1}
              max={500}
              onChange={setStopPips}
            />
            <Field
              label={t.tp}
              value={tpPips}
              step={1}
              min={1}
              max={1000}
              onChange={setTpPips}
            />
          </div>

          <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-[12px]">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{t.risk}</dt>
              <dd className="mt-1 font-display text-base text-down">−{fmtUsd(riskUsd)}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{t.reward}</dt>
              <dd className="mt-1 font-display text-base text-up">+{fmtUsd(rewardUsd)}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{t.rr}</dt>
              <dd className="mt-1 font-display text-base text-ink">1:{rr.toFixed(2)}</dd>
            </div>
          </dl>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openTrade('long')}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-up px-4 font-medium text-canvas hover:brightness-110"
            >
              <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={2} />
              {t.long}
            </button>
            <button
              type="button"
              onClick={() => openTrade('short')}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-down px-4 font-medium text-canvas hover:brightness-110"
            >
              <ArrowDownRight aria-hidden className="h-4 w-4" strokeWidth={2} />
              {t.short}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Open positions ─────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {t.openPositions} · {state.open.length}
        </h2>
        {state.open.length === 0 ? (
          <p className="rounded-sm border border-line bg-surface p-6 text-center text-[14px] text-muted">{t.none}</p>
        ) : (
          <ul className="divide-y divide-line rounded-sm border border-line bg-surface">
            {state.open.map((p) => {
              const pnl = pnlOf(p);
              const meta = SYMBOLS[p.symbol];
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                  <span className={cn('inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em]', p.side === 'long' ? 'text-up' : 'text-down')}>
                    {p.side === 'long' ? <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} /> : <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} />}
                    {meta.label} · {p.side}
                  </span>
                  <span className="font-mono text-[11px] text-muted">{p.size.toFixed(2)} lot · {p.stopPips}/{p.tpPips} pips</span>
                  <span className="font-mono text-[11px] tabular-nums text-muted">{p.entry.toFixed(meta.pip < 0.01 ? 5 : 2)} → {p.current.toFixed(meta.pip < 0.01 ? 5 : 2)}</span>
                  <span className={cn('ml-auto font-display tabular-nums text-base', pnl >= 0 ? 'text-up' : 'text-down')}>
                    {pnl >= 0 ? '+' : ''}{fmtUsd(pnl)}
                  </span>
                  <button
                    type="button"
                    onClick={() => closeManual(p.id)}
                    className="inline-flex h-8 items-center gap-1 rounded-full border border-line px-3 text-[11px] uppercase tracking-[0.18em] text-ink hover:border-ink"
                  >
                    <X className="h-3 w-3" strokeWidth={2} />
                    {t.close}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ─── Stats + History ──────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-sm border border-line bg-surface p-6 lg:col-span-1">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.stats}</h3>
          <dl className="mt-4 space-y-3 text-[14px]">
            <Row label={t.trades} value={String(stats.trades)} />
            <Row label={t.winRate} value={`${stats.winRate.toFixed(0)}%`} />
            <Row label={t.avgR} value={`${stats.avgR.toFixed(2)} R`} tone={stats.avgR >= 0 ? 'up' : 'down'} />
            <Row label={t.netPnl} value={fmtUsd(stats.netPnl)} tone={stats.netPnl >= 0 ? 'up' : 'down'} />
          </dl>
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex h-9 items-center gap-2 rounded-full border border-line px-3 text-[12px] uppercase tracking-[0.18em] text-muted hover:border-down hover:text-down"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={2} />
            {t.reset}
          </button>
        </div>

        <div className="rounded-sm border border-line bg-surface p-6 lg:col-span-2">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.closedPositions}</h3>
          {state.closed.length === 0 ? (
            <p className="mt-6 text-center text-[14px] text-muted">{t.none2}</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {state.closed.slice(0, 20).map((c) => {
                const meta = SYMBOLS[c.symbol];
                const reason = c.closeReason === 'tp' ? t.closeReasonTp : c.closeReason === 'sl' ? t.closeReasonSl : t.closeReasonManual;
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 py-3 text-[13px]">
                    <span className={cn('font-mono text-[11px] uppercase tracking-[0.18em]', c.side === 'long' ? 'text-up' : 'text-down')}>
                      {meta.label} · {c.side}
                    </span>
                    <span className="font-mono text-[11px] text-muted">{c.size.toFixed(2)} lot</span>
                    <span className="font-mono text-[11px] text-subtle">{reason}</span>
                    <span className={cn('ml-auto font-display tabular-nums', c.pnl >= 0 ? 'text-up' : 'text-down')}>
                      {c.pnl >= 0 ? '+' : ''}{fmtUsd(c.pnl)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <p className="text-center font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">{t.legal}</p>
    </div>
  );
}

function Stat({ label, value, tone, accent }: { label: string; value: string; tone?: 'up' | 'down'; accent?: boolean }) {
  return (
    <div className={cn('rounded-sm border p-5', accent ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-ink')}>
      <div className={cn('font-mono text-[11px] uppercase tracking-[0.22em]', accent ? 'text-canvas/70' : 'text-muted')}>
        {label}
      </div>
      <div className={cn('mt-2 font-display text-2xl font-medium tracking-tight tabular-nums', tone === 'up' && 'text-up', tone === 'down' && 'text-down')}>
        {value}
      </div>
    </div>
  );
}

function Field({ label, value, step, min, max, onChange }: { label: string; value: number; step: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted">{label}</label>
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
        className="mt-2 block h-10 w-full rounded-sm border border-line bg-canvas px-3 text-[14px] tabular-nums text-ink focus-visible:border-ink focus-visible:outline-none"
      />
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{label}</dt>
      <dd className={cn('font-display tabular-nums', tone === 'up' && 'text-up', tone === 'down' && 'text-down')}>{value}</dd>
    </div>
  );
}
