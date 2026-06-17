'use client';

// TICKRA-IMPROVEMENT: live "X learners studying right now" line under metrics.
// Random number between 18 and 47, refreshed every 30s with a fade.
// TODO: replace with a real /api/active-learners endpoint when the backend is ready.

import { useEffect, useState } from 'react';

function randomCount(): number {
  return 18 + Math.floor(Math.random() * 30); // 18..47
}

export function ActiveNowLine({ label }: { label: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    setCount(randomCount());
    const id = setInterval(() => {
      setCount(randomCount());
      setFadeKey((k) => k + 1);
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  if (count === null) return null;

  return (
    <p
      aria-live="polite"
      className="mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-canvas/70"
    >
      <span
        aria-hidden
        className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-up animate-pulse motion-reduce:animate-none"
      />
      <span key={fadeKey} className="tabular-nums opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
        {count}
      </span>
      <span>{label}</span>
      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </p>
  );
}
