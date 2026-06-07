'use client';

// TICKRA-FIX: replaced the iframe TradingView embed (s3.tradingview.com)
// with TradingView's self-hosted `lightweight-charts` library so the
// chart can never be blocked by an ad-blocker or CSP. Renders 200
// synthetic OHLC candles per symbol with a deterministic seed so the
// shape is stable, then keeps a live "current" candle that drifts so
// the chart feels alive while the user trades.

import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';

type Bar = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
};

// Per-symbol typical price + volatility so the chart "feels" like the
// instrument. Order matches the simulator's SymbolKey list.
const SYMBOL_PROFILE: Record<string, { base: number; vol: number; label: string }> = {
  'FX:EURUSD':   { base: 1.0850, vol: 0.0008, label: 'EUR/USD' },
  'FX:GBPUSD':   { base: 1.2700, vol: 0.0010, label: 'GBP/USD' },
  'FX:USDJPY':   { base: 156.50, vol: 0.18,   label: 'USD/JPY' },
  'TVC:GOLD':    { base: 2340.0, vol: 6.0,    label: 'XAU/USD' },
  'BITSTAMP:BTCUSD': { base: 67000, vol: 700, label: 'BTC/USD' },
  'SP:SPX':      { base: 5300.0, vol: 18.0,   label: 'S&P 500' },
};

// Deterministic PRNG so each symbol always renders the same baseline series.
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
  const now = Math.floor(Date.now() / 1000);
  const HOUR = 3600;
  for (let i = count - 1; i >= 0; i -= 1) {
    const drift = (rand() - 0.5) * profile.vol * 1.6;
    const open = close;
    const high = Math.max(open, open + drift) + rand() * profile.vol * 0.6;
    const low = Math.min(open, open + drift) - rand() * profile.vol * 0.6;
    close = open + drift;
    bars.push({
      time: (now - i * HOUR) as UTCTimestamp,
      open,
      high,
      low,
      close,
    });
  }
  return bars;
}

export function TradingViewWidget({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // (Re)build the chart whenever the symbol changes.
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = '';

    const isDark = document.documentElement.classList.contains('dark');

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 420,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#D4D4D8' : '#52525B',
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
        horzLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
      },
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      },
      timeScale: {
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: { mode: 1 },
      autoSize: false,
    });

    const series = chart.addCandlestickSeries({
      upColor: '#00D26A',
      downColor: '#FF4D4F',
      borderUpColor: '#00D26A',
      borderDownColor: '#FF4D4F',
      wickUpColor: '#00D26A',
      wickDownColor: '#FF4D4F',
    });

    const data = buildSeries(symbol);
    series.setData(data);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    // Keep the latest candle "alive" so the chart feels live while the
    // simulator's price walker ticks. Updates every 1.2s, matching the
    // simulator interval.
    const profile = SYMBOL_PROFILE[symbol] ?? SYMBOL_PROFILE['FX:EURUSD'];
    let last = data[data.length - 1];
    const liveTick = window.setInterval(() => {
      const noise = (Math.random() - 0.5) * profile.vol * 0.4;
      const close = last.close + noise;
      const high = Math.max(last.high, close);
      const low = Math.min(last.low, close);
      last = { ...last, close, high, low };
      seriesRef.current?.update(last);
    }, 1200);

    const onResize = () => {
      if (!container) return;
      chart.applyOptions({ width: container.clientWidth });
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.clearInterval(liveTick);
      window.removeEventListener('resize', onResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [symbol]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-line bg-surface">
      <div ref={ref} className="h-full w-full" />
    </div>
  );
}
