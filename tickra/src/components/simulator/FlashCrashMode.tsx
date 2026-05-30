'use client';

// TICKRA-PHASE-2.4: replay famous historical crashes candle-by-candle.
// Educational mode — the user "lives" the event in real time (1 candle per
// second) and can pause/resume. No real money. No real broker.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Zap } from 'lucide-react';
import { CRASH_EVENTS, type CrashCandle, type CrashEvent } from '@/lib/sim/historical-crashes';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Mode "Flash Crash"',
    subtitle: 'Rejouez en accéléré 4 événements historiques. Une nouvelle bougie chaque seconde.',
    play: 'Lancer',
    pause: 'Pause',
    reset: 'Recommencer',
    candle: 'Bougie',
    of: 'sur',
    legal: 'Données historiques approximatives à des fins pédagogiques.',
  },
  en: {
    title: 'Flash Crash mode',
    subtitle: 'Replay 4 historical events in fast-forward. One new candle every second.',
    play: 'Play',
    pause: 'Pause',
    reset: 'Reset',
    candle: 'Candle',
    of: 'of',
    legal: 'Approximate historical data for educational purposes.',
  },
};

export function FlashCrashMode({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [eventId, setEventId] = useState<CrashEvent['id']>(CRASH_EVENTS[0].id);
  const event = useMemo(() => CRASH_EVENTS.find((e) => e.id === eventId) ?? CRASH_EVENTS[0], [eventId]);
  const [visible, setVisible] = useState(event.startIndex);
  const [playing, setPlaying] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    setVisible(event.startIndex);
    setPlaying(false);
  }, [event.startIndex, event.id]);

  useEffect(() => {
    if (!playing) return;
    ref.current = window.setInterval(() => {
      setVisible((v) => {
        if (v >= event.candles.length) {
          setPlaying(false);
          return v;
        }
        return v + 1;
      });
    }, 800);
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [playing, event.candles.length]);

  const reset = () => {
    setVisible(event.startIndex);
    setPlaying(false);
  };

  return (
    <article className="rounded-sm border border-line bg-surface p-6 md:p-7">
      <div className="flex items-center gap-2">
        <Zap aria-hidden className="h-4 w-4 text-down" strokeWidth={1.75} />
        <h3 className="font-display text-lg font-medium tracking-tight text-ink">{t.title}</h3>
      </div>
      <p className="mt-2 text-[14px] text-muted">{t.subtitle}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {CRASH_EVENTS.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setEventId(e.id)}
            className={cn(
              'inline-flex h-8 items-center rounded-full px-3 font-mono text-[10.5px] uppercase tracking-[0.18em] transition-colors',
              eventId === e.id
                ? 'bg-ink text-canvas'
                : 'border border-line text-muted hover:border-ink hover:text-ink',
            )}
          >
            {e.label[locale]}
          </button>
        ))}
      </div>

      <p className="mt-5 max-w-2xl text-[13.5px] leading-relaxed text-muted">{event.body[locale]}</p>

      <CrashChart candles={event.candles.slice(0, visible)} symbol={event.symbol} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-[13px] font-medium text-canvas hover:brightness-110"
        >
          {playing ? <Pause className="h-3.5 w-3.5" strokeWidth={2} /> : <Play className="h-3.5 w-3.5" strokeWidth={2} />}
          {playing ? t.pause : t.play}
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-4 text-[12px] uppercase tracking-[0.18em] text-muted hover:border-ink hover:text-ink"
        >
          <RotateCcw className="h-3 w-3" strokeWidth={2} />
          {t.reset}
        </button>
        <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.18em] text-subtle">
          {t.candle} {visible} {t.of} {event.candles.length}
        </span>
      </div>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-subtle">{t.legal}</p>
    </article>
  );
}

function CrashChart({ candles, symbol }: { candles: CrashCandle[]; symbol: string }) {
  if (candles.length === 0) {
    return <div className="mt-5 h-48 rounded-sm border border-line bg-canvas" aria-hidden />;
  }
  const w = 520;
  const h = 200;
  const allHigh = Math.max(...candles.map((c) => c.h));
  const allLow = Math.min(...candles.map((c) => c.l));
  const pad = (allHigh - allLow) * 0.08 || 1;
  const yMin = allLow - pad;
  const yMax = allHigh + pad;
  const y = (v: number) => h - ((v - yMin) / (yMax - yMin)) * h;
  const cw = w / candles.length;

  return (
    <figure className="mt-5">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={symbol} className="block h-48 w-full rounded-sm border border-line bg-canvas">
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1={0} x2={w} y1={h * p} y2={h * p} stroke="rgb(var(--line))" strokeDasharray="3 4" />
        ))}
        {candles.map((c, i) => {
          const cx = cw * i + cw / 2;
          const up = c.c >= c.o;
          const color = up ? 'rgb(var(--up))' : 'rgb(var(--down))';
          const top = y(c.h);
          const bottom = y(c.l);
          const bodyTop = y(Math.max(c.o, c.c));
          const bodyBottom = y(Math.min(c.o, c.c));
          return (
            <g key={i}>
              <line x1={cx} x2={cx} y1={top} y2={bottom} stroke={color} strokeWidth={1.25} />
              <rect
                x={cx - cw * 0.32}
                y={bodyTop}
                width={cw * 0.64}
                height={Math.max(2, bodyBottom - bodyTop)}
                fill={color}
                fillOpacity={up ? 0.85 : 1}
                stroke={color}
                strokeWidth={1}
              />
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted">
        <span>{symbol}</span>
        <span className="tabular-nums">
          {candles[0].o.toFixed(4)} → {candles[candles.length - 1].c.toFixed(4)}
        </span>
      </figcaption>
    </figure>
  );
}
