'use client';

import { useEffect, useRef, useState } from 'react';

type Props = { value: string; durationMs?: number };

// Animates the leading number inside `value` (e.g. "12 400+", "92 %", "4,8 / 5")
// from 0 up to its parsed numeric form on viewport entry. Preserves the
// surrounding glyphs (spaces, separators, units) so the rendered output stays
// pixel-perfect with the source string.
export function AnimatedNumber({ value, durationMs = 1200 }: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(value);
  const playedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const parsed = parseValue(value);
    if (!parsed || reduceMotion) {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !playedRef.current) {
            playedRef.current = true;
            animate(parsed, durationMs, (current) => setDisplay(formatValue(value, current, parsed)));
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}

type Parsed = { numberString: string; numericValue: number; start: number; end: number };

function parseValue(value: string): Parsed | null {
  const match = value.match(/[\d][\d\s,.]*/);
  if (!match) return null;
  const numberString = match[0];
  const start = match.index ?? 0;
  const end = start + numberString.length;
  const numericValue = Number(numberString.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(numericValue)) return null;
  return { numberString, numericValue, start, end };
}

function formatValue(original: string, current: number, parsed: Parsed): string {
  const isInteger = !parsed.numberString.includes(',') && !parsed.numberString.includes('.');
  let rendered: string;
  if (isInteger) {
    rendered = formatInteger(Math.round(current), parsed.numberString);
  } else {
    const decimals = decimalCount(parsed.numberString);
    rendered = current.toFixed(decimals).replace('.', ',');
  }
  return original.slice(0, parsed.start) + rendered + original.slice(parsed.end);
}

function formatInteger(value: number, source: string): string {
  if (!source.includes(' ')) return String(value);
  const str = String(value);
  // Re-insert thin grouping spaces every 3 digits from the right (FR formatting).
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function decimalCount(source: string): number {
  const dec = source.split(/[,.]/)[1];
  return dec ? dec.length : 1;
}

function animate(parsed: Parsed, duration: number, onTick: (current: number) => void) {
  const start = performance.now();
  const from = 0;
  const to = parsed.numericValue;

  const step = (now: number) => {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    onTick(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
