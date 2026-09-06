'use client';

// TICKRA-SPRINT-B: Paper-trading simulator — gated to Pro/Lifetime users.
// Self-contained client app:
//  - TradingView widget for the chart (free embed, no API key).
//  - Virtual balance + open/closed positions persisted server-side via the
//    /api/sim/* routes so the same account follows the user across devices.
//    localStorage is still used as a write-through optimistic cache to keep
//    the UI snappy between server round-trips.
//  - Synthetic price walk per open position so P&L moves realistically without
//    needing a market-data subscription. Every 1.2s the client batches the
//    latest prices (and any TP/SL closes) up to /api/sim/trade `tick`.
//
// Buy/Sell flow: pick symbol, size in lots, stop loss in pips, take profit in
// pips → opens a position. Auto-closes when SL or TP is hit.

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Lock, RotateCcw, TrendingDown, TrendingUp, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { useUser } from '@/lib/auth/useUser';
import { addXp } from '@/lib/progress/xp';
import { TradingViewWidget } from './TradingViewWidget';
import { TradeCoach } from './TradeCoach';
import { PaywallCard } from '@/components/learn/PaywallCard';
import { SimAnalyticsPanel } from './SimAnalyticsPanel';
import type { AnalyticsTrade } from '@/lib/sim/analytics';

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

// Wire response from /api/sim/state and /api/sim/trade. Matches Position /
// ClosedPosition exactly except `symbol` is a plain string on the wire.
type WireState = {
  balance: number;
  open: Array<Omit<Position, 'symbol'> & { symbol: string }>;
  closed: Array<Omit<ClosedPosition, 'symbol'> & { symbol: string }>;
};

function isKnownSymbol(s: string): s is SymbolKey {
  return s in SYMBOLS;
}

function normalizeWire(w: WireState): State {
  const open: Position[] = w.open
    .filter((p) => isKnownSymbol(p.symbol))
    .map((p) => ({ ...p, symbol: p.symbol as SymbolKey }));
  const closed: ClosedPosition[] = w.closed
    .filter((c) => isKnownSymbol(c.symbol))
    .map((c) => ({ ...c, symbol: c.symbol as SymbolKey }));
  return { balance: w.balance, open, closed };
}

async function fetchServerState(): Promise<State | null> {
  try {
    const res = await fetch('/api/sim/state', { cache: 'no-store' });
    if (!res.ok) return null;
    const w = (await res.json()) as WireState;
    return normalizeWire(w);
  } catch {
    return null;
  }
}

async function postTrade(body: unknown): Promise<State | null> {
  try {
    const res = await fetch('/api/sim/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // 409 (already-closed) still returns a state for reconciliation.
      const data = (await res.json().catch(() => null)) as { state?: WireState } | null;
      if (data?.state) return normalizeWire(data.state);
      return null;
    }
    const data = (await res.json()) as { state?: WireState };
    if (!data.state) return null;
    return normalizeWire(data.state);
  } catch {
    return null;
  }
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

  // Guards concurrent tick posts — if a tick request is still in flight, skip
  // the next interval rather than pile up requests on a slow connection.
  const tickInFlight = useRef(false);

  // Optimistic-cache → server-of-record hydration. Show whatever we have in
  // localStorage immediately, then reconcile with /api/sim/state once it
  // returns. If the server says something different, the server wins.
  useEffect(() => {
    let cancelled = false;
    const cached = loadState();
    setState(cached);
    setHydrated(true);
    (async () => {
      const server = await fetchServerState();
      if (cancelled || !server) return;
      setState(server);
      saveState(server);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Synthetic price walk + TP/SL check every 1.2s.
  // Optimistic: we update React state immediately so the UI feels live, then
  // batch the price updates (+ any TP/SL-triggered closes) up to the server
  // via /api/sim/trade `tick`. The server reply replaces local state so a
  // second device sees the same balance and history.
  useEffect(() => {
    if (!hydrated) return;
    const id = setInterval(() => {
      // Build the optimistic next state synchronously so React renders
      // immediately, and capture the diff we need to send to the server.
      let updates: Array<{ id: string; current: number }> = [];
      let closedByTpSl: Array<{
        id: string;
        closeReason: 'tp' | 'sl';
        pnl: number;
        current: number;
        closedAt: number;
      }> = [];

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
            const closedAt = Date.now();
            newlyClosed.push({ ...next, closedAt, closeReason: 'tp', pnl });
            closedByTpSl.push({ id: next.id, closeReason: 'tp', pnl, current: next.current, closedAt });
          } else if (moveFromEntryPips <= -next.stopPips) {
            const pnl = -next.stopPips * meta.pipValuePerLot * next.size;
            balance += pnl;
            const closedAt = Date.now();
            newlyClosed.push({ ...next, closedAt, closeReason: 'sl', pnl });
            closedByTpSl.push({ id: next.id, closeReason: 'sl', pnl, current: next.current, closedAt });
          } else {
            stillOpen.push(next);
            updates.push({ id: next.id, current: next.current });
          }
        }

        // TICKRA-SPRINT-C: every closed trade rewards 10 XP — both wins & losses.
        if (newlyClosed.length) {
          addXp(10 * newlyClosed.length);
          window.dispatchEvent(new Event('tickra-xp-changed'));
        }

        const out: State = {
          balance,
          open: stillOpen,
          closed: newlyClosed.length ? [...newlyClosed, ...prev.closed].slice(0, 200) : prev.closed,
        };
        if (newlyClosed.length || stillOpen.length) saveState(out);
        return out;
      });

      // Skip if there's nothing to send, or if a prior tick is still in flight.
      if (updates.length === 0 && closedByTpSl.length === 0) return;
      if (tickInFlight.current) return;
      tickInFlight.current = true;
      void postTrade({ action: 'tick', updates, closedByTpSl })
        .then((server) => {
          if (server) {
            setState(server);
            saveState(server);
          }
        })
        .finally(() => {
          tickInFlight.current = false;
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

  // TICKRA-PHASE-3: enrich closed trades with R multiples for the analytics
  // panel. Kept here because R depends on the symbol pip table; the analytics
  // module itself stays pure and symbol-agnostic.
  const analyticsTrades = useMemo<AnalyticsTrade[]>(
    () =>
      state.closed.map((c) => {
        const risk = c.stopPips > 0 ? c.stopPips * SYMBOLS[c.symbol].pipValuePerLot * c.size : 0;
        return {
          pnl: c.pnl,
          rMultiple: risk > 0 ? c.pnl / risk : null,
          closedAt: c.closedAt,
        };
      }),
    [state.closed],
  );

  const openTrade = (side: Side) => {
    const entry = symbolMeta.price + (Math.random() - 0.5) * 4 * symbolMeta.pip;
    // Optimistic id — the server will issue the real UUID and we'll reconcile
    // it when the response comes back.
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
    void postTrade({
      action: 'open',
      symbol,
      side,
      size,
      entry,
      stopPips,
      tpPips,
    }).then((server) => {
      if (server) {
        setState(server);
        saveState(server);
      }
    });
  };

  const closeManual = (id: string) => {
    let pnl = 0;
    let current = 0;
    setState((prev) => {
      const p = prev.open.find((x) => x.id === id);
      if (!p) return prev;
      pnl = pnlOf(p);
      current = p.current;
      const closed: ClosedPosition = { ...p, closedAt: Date.now(), closeReason: 'manual', pnl };
      const out: State = {
        balance: prev.balance + pnl,
        open: prev.open.filter((x) => x.id !== id),
        closed: [closed, ...prev.closed].slice(0, 200),
      };
      saveState(out);
      // TICKRA-SPRINT-C: manual close also rewards XP.
      addXp(10);
      window.dispatchEvent(new Event('tickra-xp-changed'));
      return out;
    });
    // The optimistic id may be a local `uid()` from before the server reply
    // landed. In that case the server will return 409 and the reconciliation
    // state will simply re-add the open trade for us. Once the server-issued
    // UUID is in state, subsequent close calls will succeed.
    void postTrade({
      action: 'close',
      id,
      closeReason: 'manual',
      pnl,
      current,
      closedAt: Date.now(),
    }).then((server) => {
      if (server) {
        setState(server);
        saveState(server);
      }
    });
  };

  const reset = () => {
    if (!window.confirm(t.resetConfirm)) return;
    setState(INITIAL);
    saveState(INITIAL);
    void postTrade({ action: 'reset' }).then((server) => {
      if (server) {
        setState(server);
        saveState(server);
      }
    });
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
                  <li key={c.id} className="py-3 text-[13px]">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={cn('font-mono text-[11px] uppercase tracking-[0.18em]', c.side === 'long' ? 'text-up' : 'text-down')}>
                        {meta.label} · {c.side}
                      </span>
                      <span className="font-mono text-[11px] text-muted">{c.size.toFixed(2)} lot</span>
                      <span className="font-mono text-[11px] text-subtle">{reason}</span>
                      <span className={cn('ml-auto font-display tabular-nums', c.pnl >= 0 ? 'text-up' : 'text-down')}>
                        {c.pnl >= 0 ? '+' : ''}{fmtUsd(c.pnl)}
                      </span>
                    </div>
                    {/* TICKRA-PHASE-2.2: AI Trade Coach review on demand. */}
                    <TradeCoach
                      locale={locale}
                      trade={{
                        symbol: meta.label,
                        side: c.side,
                        sizeLots: c.size,
                        entry: c.entry,
                        exit: c.current,
                        stopPips: c.stopPips,
                        tpPips: c.tpPips,
                        pnl: c.pnl,
                        closeReason: c.closeReason,
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <SimAnalyticsPanel trades={analyticsTrades} startBalance={INITIAL.balance} locale={locale} />

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
