'use client';

import { useEffect, useRef, useState } from 'react';
import type { Dictionary } from '@/lib/i18n/dictionaries';

type Props = { dict: Dictionary };

// TICKRA-REDESIGN: Dark stats section with CountUp.
export function Metrics({ dict }: Props) {
  const t = dict.metrics;
  const ref = useRef<HTMLDivElement | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setStarted(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      aria-labelledby="metrics-title"
      className="bg-navy-900 text-white py-24 px-6"
    >
      <div className="mx-auto w-full max-w-container">
        <h2
          id="metrics-title"
          className="text-white text-4xl font-medium text-center"
        >
          {t.title}
        </h2>
        <p className="text-white/60 text-lg text-center mt-3 mb-16 max-w-2xl mx-auto">{t.body}</p>

        <dl className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {t.items.map((m) => (
            <div key={m.label} className="text-center">
              <dt className="sr-only">{m.label}</dt>
              <dd className="text-5xl font-medium text-white">
                <AnimatedMetric value={m.value} started={started} />
              </dd>
              <div aria-hidden className="text-sm text-white/50 text-center mt-2">
                {m.label}
              </div>
            </div>
          ))}
        </dl>

        <p className="text-white/30 text-xs text-center mt-12">{t.footnote}</p>
      </div>
    </section>
  );
}

// Parses a value string like "12,400+", "92%", "4.8 / 5", "67"
// and animates the leading numeric part.
function AnimatedMetric({ value, started }: { value: string; started: boolean }) {
  // Find first numeric run (with optional , and .)
  const match = value.match(/^([\d.,]+)(.*)$/);
  if (!match) return <>{value}</>;
  const numericRaw = match[1];
  const suffix = match[2];
  const targetNumber = parseFloat(numericRaw.replace(/,/g, ''));
  const hasDecimal = numericRaw.includes('.');
  const hasComma = numericRaw.includes(',');
  const animated = useCountUp(targetNumber, 1400, started);

  const display = hasDecimal
    ? animated.toFixed(1)
    : hasComma
      ? Math.floor(animated).toLocaleString('en-US')
      : Math.floor(animated).toString();

  return (
    <>
      {display}
      {suffix}
    </>
  );
}

function useCountUp(target: number, duration: number, started: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(eased * target);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, started]);
  return value;
}
