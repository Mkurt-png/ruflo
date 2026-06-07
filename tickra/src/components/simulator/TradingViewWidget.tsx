'use client';

// TICKRA-FIX: self-hosted klinecharts (MIT) with full drawing-tools
// toolbar — trendlines, rays, horizontal levels, rectangles, Fibonacci.
// No ad-blocker can stop it, no external CDN call. Per-symbol deterministic
// synthetic OHLC, live last-candle drift.

import { useEffect, useRef, useState } from 'react';

type Bar = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

type ToolId =
  | 'cursor'
  | 'segment'
  | 'rayLine'
  | 'horizontalStraightLine'
  | 'rectangle'
  | 'fibonacciLine'
  | 'eraser';

const SYMBOL_PROFILE: Record<string, { base: number; vol: number }> = {
  'FX:EURUSD':   { base: 1.0850, vol: 0.0008 },
  'FX:GBPUSD':   { base: 1.2700, vol: 0.0010 },
  'FX:USDJPY':   { base: 156.50, vol: 0.18   },
  'TVC:GOLD':    { base: 2340.0, vol: 6.0    },
  'BITSTAMP:BTCUSD': { base: 67000, vol: 700 },
  'SP:SPX':      { base: 5300.0, vol: 18.0   },
};

// Deterministic PRNG so the baseline series is stable per symbol.
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSeries(symbol: string, count = 220): Bar[] {
  const profile = SYMBOL_PROFILE[symbol] ?? SYMBOL_PROFILE['FX:EURUSD'];
  const rand = mulberry32(
    symbol.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7),
  );
  const bars: Bar[] = [];
  let close = profile.base;
  const now = Date.now();
  const HOUR = 3_600_000;
  for (let i = count - 1; i >= 0; i -= 1) {
    const drift = (rand() - 0.5) * profile.vol * 1.6;
    const open = close;
    const high = Math.max(open, open + drift) + rand() * profile.vol * 0.6;
    const low = Math.min(open, open + drift) - rand() * profile.vol * 0.6;
    close = open + drift;
    bars.push({
      timestamp: now - i * HOUR,
      open,
      high,
      low,
      close,
      volume: Math.round(rand() * 5000 + 500),
    });
  }
  return bars;
}

const TOOL_LABELS: Record<Exclude<ToolId, 'cursor' | 'eraser'>, string> = {
  segment: 'Trendline',
  rayLine: 'Ray',
  horizontalStraightLine: 'Horizontal',
  rectangle: 'Rectangle',
  fibonacciLine: 'Fibonacci',
};

export function TradingViewWidget({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // klinecharts Chart instance. Typed as `any` because the lib's TS exports
  // change across betas; the calls we use (applyNewData, updateData,
  // createOverlay, removeOverlay, resize, etc.) are stable in v9+v10.
  const chartRef = useRef<unknown>(null);
  const [activeTool, setActiveTool] = useState<ToolId>('cursor');

  useEffect(() => {
    let disposed = false;
    let liveTick: ReturnType<typeof setInterval> | null = null;
    let onResize: (() => void) | null = null;

    (async () => {
      const klinecharts = await import('klinecharts');
      if (disposed || !ref.current) return;
      const container = ref.current;
      container.innerHTML = '';

      const isDark = document.documentElement.classList.contains('dark');
      const upColor = '#00D26A';
      const downColor = '#FF4D4F';
      const textColor = isDark ? '#D4D4D8' : '#52525B';
      const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
      const axisColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';

      const chart = klinecharts.init(container, {
        styles: {
          grid: {
            horizontal: { color: gridColor },
            vertical: { color: gridColor },
          },
          candle: {
            bar: {
              upColor,
              downColor,
              upBorderColor: upColor,
              downBorderColor: downColor,
              upWickColor: upColor,
              downWickColor: downColor,
            },
            priceMark: {
              last: {
                upColor,
                downColor,
              },
            },
          },
          xAxis: {
            axisLine: { color: axisColor },
            tickText: { color: textColor },
            tickLine: { color: axisColor },
          },
          yAxis: {
            axisLine: { color: axisColor },
            tickText: { color: textColor },
            tickLine: { color: axisColor },
          },
          crosshair: {
            horizontal: { line: { color: textColor } },
            vertical: { line: { color: textColor } },
          },
        },
      });

      if (!chart) return;
      chartRef.current = chart;
      const data = buildSeries(symbol);
      (chart as unknown as { applyNewData: (b: Bar[]) => void }).applyNewData(data);

      // Live tick: drift the last candle every 1.2s.
      const profile = SYMBOL_PROFILE[symbol] ?? SYMBOL_PROFILE['FX:EURUSD'];
      let last = data[data.length - 1];
      liveTick = setInterval(() => {
        const noise = (Math.random() - 0.5) * profile.vol * 0.4;
        const close = last.close + noise;
        last = {
          ...last,
          close,
          high: Math.max(last.high, close),
          low: Math.min(last.low, close),
        };
        (chart as unknown as { updateData: (b: Bar) => void }).updateData(last);
      }, 1200);

      onResize = () => {
        (chart as unknown as { resize: () => void }).resize();
      };
      window.addEventListener('resize', onResize);
    })();

    return () => {
      disposed = true;
      if (liveTick) clearInterval(liveTick);
      if (onResize) window.removeEventListener('resize', onResize);
      if (chartRef.current && ref.current) {
        // klinecharts exports `dispose` at the module level; just clear the
        // container — the chart instance loses its mount anyway.
        try {
          import('klinecharts').then((mod) => mod.dispose(ref.current!));
        } catch {
          /* noop on unmount race */
        }
      }
      chartRef.current = null;
    };
  }, [symbol]);

  // Activate a drawing tool. klinecharts uses `createOverlay({ name })` to
  // start a draw — user clicks two points on the chart to place the shape.
  async function pickTool(id: ToolId) {
    setActiveTool(id);
    const chart = chartRef.current as
      | {
          createOverlay: (opts: { name: string }) => void;
          removeOverlay: () => void;
        }
      | null;
    if (!chart) return;
    if (id === 'cursor') return;
    if (id === 'eraser') {
      chart.removeOverlay();
      setActiveTool('cursor');
      return;
    }
    chart.createOverlay({ name: id });
  }

  return (
    <div className="rounded-xl border border-line bg-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-3 py-2">
        <ToolButton label="Curseur" active={activeTool === 'cursor'} onClick={() => pickTool('cursor')} />
        <span className="mx-1 h-5 w-px bg-line" />
        {(Object.keys(TOOL_LABELS) as Array<keyof typeof TOOL_LABELS>).map((id) => (
          <ToolButton
            key={id}
            label={TOOL_LABELS[id]}
            active={activeTool === id}
            onClick={() => pickTool(id)}
          />
        ))}
        <span className="mx-1 h-5 w-px bg-line" />
        <ToolButton label="Effacer tout" tone="danger" onClick={() => pickTool('eraser')} />
      </div>
      {/* Chart */}
      <div ref={ref} className="h-[420px] w-full" />
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  active = false,
  tone = 'neutral',
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  tone?: 'neutral' | 'danger';
}) {
  const base =
    'inline-flex h-7 items-center rounded-md px-2.5 text-[11px] font-medium transition-colors';
  const styles = active
    ? 'bg-brand text-black'
    : tone === 'danger'
      ? 'text-down hover:bg-down/10'
      : 'text-ink hover:bg-elevated';
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {label}
    </button>
  );
}
