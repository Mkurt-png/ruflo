'use client';

// Bloomberg-style scrolling ticker tape under the hero. Self-hosted,
// no market-data subscription — synthetic prices drift live so the strip
// feels alive. Pure decoration; respects prefers-reduced-motion.

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

type Tick = {
  symbol: string;
  price: number;
  decimals: number;
  changePct: number;
};

const SEED: Array<{ symbol: string; base: number; decimals: number; vol: number }> = [
  { symbol: 'EUR/USD', base: 1.0850, decimals: 4, vol: 0.0006 },
  { symbol: 'GBP/USD', base: 1.2700, decimals: 4, vol: 0.0008 },
  { symbol: 'USD/JPY', base: 156.50, decimals: 2, vol: 0.12 },
  { symbol: 'BTC/USD', base: 67000, decimals: 0, vol: 240 },
  { symbol: 'ETH/USD', base: 3450, decimals: 0, vol: 18 },
  { symbol: 'XAU/USD', base: 2340, decimals: 1, vol: 3.2 },
  { symbol: 'S&P 500', base: 5300, decimals: 1, vol: 6.5 },
  { symbol: 'NASDAQ', base: 18600, decimals: 1, vol: 22 },
  { symbol: 'WTI', base: 78.4, decimals: 2, vol: 0.4 },
  { symbol: 'EUR/GBP', base: 0.8540, decimals: 4, vol: 0.0004 },
];

function initialTicks(): Tick[] {
  return SEED.map((s) => ({
    symbol: s.symbol,
    price: s.base,
    decimals: s.decimals,
    changePct: (Math.random() - 0.5) * 1.4,
  }));
}

function fmt(n: number, decimals: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function MarketTicker() {
  const [ticks, setTicks] = useState<Tick[]>(initialTicks);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = window.setInterval(() => {
      setTicks((prev) =>
        prev.map((t, i) => {
          const seed = SEED[i];
          const drift = (Math.random() - 0.5) * seed.vol;
          const price = Math.max(seed.base * 0.5, t.price + drift);
          const changePct = ((price - seed.base) / seed.base) * 100;
          return { ...t, price, changePct };
        }),
      );
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  // Duplicate the list so the marquee loops seamlessly.
  const loop = [...ticks, ...ticks];

  return (
    <div
      aria-hidden
      className="relative w-full overflow-hidden border-y border-line bg-elevated"
    >
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-canvas to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-canvas to-transparent" />

      <div className="flex w-max animate-ticker py-2.5 motion-reduce:animate-none">
        {loop.map((t, i) => {
          const up = t.changePct >= 0;
          return (
            <div key={`${t.symbol}-${i}`} className="flex items-baseline gap-2 px-5">
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
                {t.symbol}
              </span>
              <span className="font-display text-[13px] tabular-nums text-ink">
                {fmt(t.price, t.decimals)}
              </span>
              <span
                className={cn(
                  'font-mono text-[11px] tabular-nums',
                  up ? 'text-up' : 'text-down',
                )}
              >
                {up ? '▲' : '▼'} {Math.abs(t.changePct).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
