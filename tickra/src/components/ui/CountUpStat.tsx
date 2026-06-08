'use client';

// Reusable count-up stat: parses "200+" or "10 min" or "11" into number +
// suffix, animates the number when scrolled into view, restores suffix.
// Respects prefers-reduced-motion (jumps to the final value).

import { useEffect, useRef, useState } from 'react';

type Props = {
  value: string;
  duration?: number;
  className?: string;
};

function parseStat(raw: string): { target: number; prefix: string; suffix: string; decimals: number } {
  const match = raw.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/);
  if (!match) return { target: 0, prefix: '', suffix: raw, decimals: 0 };
  const [, prefix, num, suffix] = match;
  const normalised = num.replace(',', '.');
  const target = Number(normalised);
  const decimals = normalised.includes('.') ? normalised.split('.')[1].length : 0;
  return { target, prefix, suffix, decimals };
}

export function CountUpStat({ value, duration = 1400, className }: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const { target, prefix, suffix, decimals } = parseStat(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setStarted(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setStarted(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setCurrent(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setCurrent(eased * target);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setCurrent(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  const display = current.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}
      <span className="tabular-nums">{display}</span>
      {suffix}
    </span>
  );
}
