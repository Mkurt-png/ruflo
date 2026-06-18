// Terminal-style KPI strip — monospace labels, tabular numbers, separator dots.
// Used across Account / Learn / Review to give the same "pro dashboard" feel
// as the simulator's OHLCV header.

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type KpiItem = {
  label: string;
  value: string;
  tone?: 'neutral' | 'up' | 'down' | 'brand';
  hint?: string;
};

export function KpiStrip({
  items,
  trailing,
  className,
}: {
  items: KpiItem[];
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-elevated/40 px-4 py-2.5',
        className,
      )}
    >
      {items.map((it, i) => (
        <div key={`${it.label}-${i}`} className="flex items-baseline gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            {it.label}
          </span>
          <span
            className={cn(
              'font-display text-[13px] font-medium tabular-nums',
              it.tone === 'up' && 'text-up',
              it.tone === 'down' && 'text-down',
              it.tone === 'brand' && 'text-brand',
              (!it.tone || it.tone === 'neutral') && 'text-ink',
            )}
          >
            {it.value}
          </span>
          {it.hint && (
            <span className="font-mono text-[10px] text-subtle">{it.hint}</span>
          )}
        </div>
      ))}
      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
    </div>
  );
}

export function LivePulse({ label = 'live' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
      <span aria-hidden className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-up motion-reduce:animate-none" />
      {label}
    </span>
  );
}
