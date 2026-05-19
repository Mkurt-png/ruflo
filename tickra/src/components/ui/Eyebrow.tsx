import type { ReactNode } from 'react';

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
      <span aria-hidden className="inline-block h-px w-8 bg-ink" />
      {children}
    </span>
  );
}
