'use client';

// Pro-grade trading terminal — klinecharts v9 with:
//  - Live OHLCV header with Δ / Δ%
//  - Multi-timeframe selector (1m / 5m / 15m / 1H / 4H / 1D)
//  - Built-in indicators: MA20 + MA50 overlay, VOL / MACD / RSI sub-panes
//  - Drawing toolbar: trendline, ray, horizontal level, rectangle, fibonacci
//  - Per-symbol deterministic synthetic OHLC + live last-candle drift

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  init,
  dispose,
  LineType,
  PolygonType,
  TooltipShowRule,
  type Chart,
  type KLineData,
} from 'klinecharts';
import {
  MousePointer2,
  TrendingUp,
  Move,
  Minus,
  Square,
  Sigma,
  Eraser,
  Activity,
  BarChart3,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';

type ToolId =
  | 'cursor'
  | 'segment'
  | 'rayLine'
  | 'horizontalStraightLine'
  | 'rectangle'
  | 'fibonacciLine'
  | 'eraser';

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
type IndicatorId = 'MA' | 'BOLL' | 'VOL' | 'MACD' | 'RSI';

const SYMBOL_PROFILE: Record<string, { base: number; vol: number; decimals: number }> = {
  'FX:EURUSD':       { base: 1.0850, vol: 0.0008, decimals: 5 },
  'FX:GBPUSD':       { base: 1.2700, vol: 0.0010, decimals: 5 },
  'FX:USDJPY':       { base: 156.50, vol: 0.18,   decimals: 3 },
  'OANDA:XAUUSD':    { base: 2340.0, vol: 6.0,    decimals: 2 },
  'TVC:GOLD':        { base: 2340.0, vol: 6.0,    decimals: 2 },
  'COINBASE:BTCUSD': { base: 67000,  vol: 700,    decimals: 1 },
  'BITSTAMP:BTCUSD': { base: 67000,  vol: 700,    decimals: 1 },
  'TVC:SPX':         { base: 5300.0, vol: 18.0,   decimals: 2 },
  'SP:SPX':          { base: 5300.0, vol: 18.0,   decimals: 2 },
};

const TF_TO_MS: Record<Timeframe, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
  '4h': 14_400_000,
  '1d': 86_400_000,
};

// Volatility scales with timeframe — a 1d candle moves more than a 1m one.
const TF_VOL_MULT: Record<Timeframe, number> = {
  '1m': 0.25,
  '5m': 0.5,
  '15m': 0.75,
  '1h': 1,
  '4h': 1.8,
  '1d': 3,
};

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

function profileFor(symbol: string) {
  return SYMBOL_PROFILE[symbol] ?? SYMBOL_PROFILE['FX:EURUSD'];
}

function buildSeries(symbol: string, tf: Timeframe, count = 280): KLineData[] {
  const profile = profileFor(symbol);
  const vol = profile.vol * TF_VOL_MULT[tf];
  const rand = mulberry32(
    (symbol + ':' + tf)
      .split('')
      .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7),
  );
  const bars: KLineData[] = [];
  let close = profile.base;
  const now = Date.now();
  const step = TF_TO_MS[tf];
  for (let i = count - 1; i >= 0; i -= 1) {
    const drift = (rand() - 0.5) * vol * 1.6;
    const open = close;
    const high = Math.max(open, open + drift) + rand() * vol * 0.7;
    const low = Math.min(open, open + drift) - rand() * vol * 0.7;
    close = open + drift;
    bars.push({
      timestamp: now - i * step,
      open,
      high,
      low,
      close,
      volume: Math.round(rand() * 8000 + 1500),
    });
  }
  return bars;
}

type Snapshot = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  delta: number;
  deltaPct: number;
  timestamp: number;
};

function snapshotOf(bars: KLineData[]): Snapshot {
  const last = bars[bars.length - 1];
  const prev = bars[bars.length - 2] ?? last;
  const delta = last.close - prev.close;
  const deltaPct = (delta / prev.close) * 100;
  return {
    open: last.open,
    high: last.high,
    low: last.low,
    close: last.close,
    volume: last.volume ?? 0,
    delta,
    deltaPct,
    timestamp: last.timestamp,
  };
}

const TF_OPTIONS: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

const INDICATORS: Array<{ id: IndicatorId; label: string; pane: 'main' | 'sub' }> = [
  { id: 'MA',   label: 'MA',   pane: 'main' },
  { id: 'BOLL', label: 'BOLL', pane: 'main' },
  { id: 'VOL',  label: 'VOL',  pane: 'sub'  },
  { id: 'MACD', label: 'MACD', pane: 'sub'  },
  { id: 'RSI',  label: 'RSI',  pane: 'sub'  },
];

const DRAWING_TOOLS: Array<{ id: Exclude<ToolId, 'cursor' | 'eraser'>; label: string; Icon: typeof TrendingUp }> = [
  { id: 'segment',                label: 'Trendline',  Icon: TrendingUp },
  { id: 'rayLine',                label: 'Ray',        Icon: Move },
  { id: 'horizontalStraightLine', label: 'Horizontal', Icon: Minus },
  { id: 'rectangle',              label: 'Rectangle',  Icon: Square },
  { id: 'fibonacciLine',          label: 'Fibonacci',  Icon: Sigma },
];

function fmtPrice(n: number, decimals: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtVolume(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
  return n.toFixed(0);
}

export function TradingViewWidget({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const lastBarRef = useRef<KLineData | null>(null);
  const subIndicatorPanesRef = useRef<Record<string, string>>({});
  const mainIndicatorsRef = useRef<Set<IndicatorId>>(new Set(['MA']));
  const subIndicatorsRef = useRef<Set<IndicatorId>>(new Set(['VOL']));

  const [activeTool, setActiveTool] = useState<ToolId>('cursor');
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [crosshair, setCrosshair] = useState<KLineData | null>(null);
  const [mainInds, setMainInds] = useState<Set<IndicatorId>>(new Set(['MA']));
  const [subInds, setSubInds] = useState<Set<IndicatorId>>(new Set(['VOL']));

  const decimals = useMemo(() => profileFor(symbol).decimals, [symbol]);

  // Build / rebuild the chart when symbol or timeframe changes.
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = '';
    subIndicatorPanesRef.current = {};

    const isDark = document.documentElement.classList.contains('dark');
    const upColor = '#00D26A';
    const downColor = '#FF4D4F';
    const textColor = isDark ? '#D4D4D8' : '#52525B';
    const textMuted = isDark ? '#71717A' : '#A1A1AA';
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    const axisColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
    const tooltipBg = isDark ? 'rgba(20,20,22,0.95)' : 'rgba(255,255,255,0.96)';

    const chart = init(container, {
      styles: {
        grid: {
          show: true,
          horizontal: { color: gridColor, style: LineType.Dashed, dashedValue: [2, 2] },
          vertical: { color: gridColor, style: LineType.Dashed, dashedValue: [2, 2] },
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
              line: { show: true, style: LineType.Dashed, dashedValue: [4, 4] },
              text: { show: true, color: '#FFFFFF', size: 11, family: 'JetBrains Mono, monospace' },
            },
            high: { show: true, color: textMuted, textSize: 10 },
            low:  { show: true, color: textMuted, textSize: 10 },
          },
          tooltip: { showRule: TooltipShowRule.None }, // we render our own OHLC header
        },
        indicator: {
          tooltip: { showRule: TooltipShowRule.None },
          bars: [{ style: PolygonType.Fill, borderStyle: LineType.Solid, borderSize: 1, borderDashedValue: [2, 2], upColor, downColor, noChangeColor: textMuted }],
          lines: [
            { size: 1, style: LineType.Solid, smooth: false, dashedValue: [2, 2], color: '#3B82F6' }, // MA short
            { size: 1, style: LineType.Solid, smooth: false, dashedValue: [2, 2], color: '#F59E0B' }, // MA mid
            { size: 1, style: LineType.Solid, smooth: false, dashedValue: [2, 2], color: '#EC4899' }, // MA long
          ],
        },
        xAxis: {
          axisLine: { color: axisColor, size: 1 },
          tickText: { color: textMuted, size: 10, family: 'JetBrains Mono, monospace' },
          tickLine: { color: axisColor, size: 1 },
        },
        yAxis: {
          axisLine: { color: axisColor, size: 1 },
          tickText: { color: textMuted, size: 10, family: 'JetBrains Mono, monospace' },
          tickLine: { color: axisColor, size: 1 },
        },
        crosshair: {
          show: true,
          horizontal: {
            line: { show: true, color: textColor, style: LineType.Dashed, dashedValue: [4, 4] },
            text: { show: true, color: '#FFFFFF', backgroundColor: tooltipBg, size: 11, family: 'JetBrains Mono, monospace' },
          },
          vertical: {
            line: { show: true, color: textColor, style: LineType.Dashed, dashedValue: [4, 4] },
            text: { show: true, color: '#FFFFFF', backgroundColor: tooltipBg, size: 11, family: 'JetBrains Mono, monospace' },
          },
        },
        separator: { size: 1, color: axisColor },
      },
    });

    if (!chart) return;
    chartRef.current = chart;

    const data = buildSeries(symbol, timeframe);
    chart.applyNewData(data);
    lastBarRef.current = data[data.length - 1];
    setSnapshot(snapshotOf(data));

    // Re-apply currently selected indicators on rebuild.
    for (const id of mainIndicatorsRef.current) {
      chart.createIndicator(id, true, { id: 'candle_pane' });
    }
    for (const id of subIndicatorsRef.current) {
      const paneId = chart.createIndicator(id, false);
      if (paneId) subIndicatorPanesRef.current[id] = paneId;
    }

    // Crosshair OHLC tooltip → React state for our custom header.
    type CrosshairAction = { kxName?: string; dataIndex?: number };
    const cChart = chart as Chart & {
      subscribeAction: (name: string, cb: (action: CrosshairAction) => void) => void;
      unsubscribeAction?: (name: string, cb: (action: CrosshairAction) => void) => void;
    };
    const onCross = (action: CrosshairAction) => {
      if (typeof action?.dataIndex === 'number' && action.dataIndex >= 0) {
        const dataNow = (chart as Chart & { getDataList?: () => KLineData[] }).getDataList?.() ?? data;
        const bar = dataNow[action.dataIndex];
        setCrosshair(bar ?? null);
      } else {
        setCrosshair(null);
      }
    };
    try { cChart.subscribeAction?.('onCrosshairChange', onCross); } catch { /* ignore */ }

    // Live tick on last candle every 1.2s.
    const profile = profileFor(symbol);
    const liveTick = window.setInterval(() => {
      const last = lastBarRef.current;
      if (!last) return;
      const noise = (Math.random() - 0.5) * profile.vol * TF_VOL_MULT[timeframe] * 0.4;
      const close = last.close + noise;
      const next: KLineData = {
        ...last,
        close,
        high: Math.max(last.high, close),
        low: Math.min(last.low, close),
        volume: (last.volume ?? 0) + Math.round(Math.random() * 50),
      };
      lastBarRef.current = next;
      chart.updateData(next);
      setSnapshot((prev) => {
        if (!prev) return prev;
        const delta = close - prev.open;
        return { ...prev, close, high: next.high, low: next.low, volume: next.volume ?? prev.volume, delta, deltaPct: (delta / prev.open) * 100, timestamp: next.timestamp };
      });
    }, 1200);

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.clearInterval(liveTick);
      window.removeEventListener('resize', onResize);
      try { cChart.unsubscribeAction?.('onCrosshairChange', onCross); } catch { /* ignore */ }
      dispose(container);
      chartRef.current = null;
    };
  }, [symbol, timeframe]);

  function pickTool(id: ToolId) {
    const chart = chartRef.current;
    if (!chart) return;
    if (id === 'cursor') {
      setActiveTool('cursor');
      return;
    }
    if (id === 'eraser') {
      (chart as unknown as { removeOverlay: () => void }).removeOverlay();
      setActiveTool('cursor');
      return;
    }
    setActiveTool(id);
    chart.createOverlay({ name: id });
  }

  function toggleIndicator(id: IndicatorId, pane: 'main' | 'sub') {
    const chart = chartRef.current;
    if (!chart) return;
    if (pane === 'main') {
      const next = new Set(mainInds);
      const cChart = chart as Chart & { removeIndicator: (paneId: string, name?: string) => void };
      if (next.has(id)) {
        next.delete(id);
        try { cChart.removeIndicator('candle_pane', id); } catch { /* ignore */ }
      } else {
        next.add(id);
        chart.createIndicator(id, true, { id: 'candle_pane' });
      }
      mainIndicatorsRef.current = next;
      setMainInds(next);
    } else {
      const next = new Set(subInds);
      const cChart = chart as Chart & { removeIndicator: (paneId: string, name?: string) => void };
      if (next.has(id)) {
        next.delete(id);
        const paneId = subIndicatorPanesRef.current[id];
        if (paneId) {
          try { cChart.removeIndicator(paneId); } catch { /* ignore */ }
          delete subIndicatorPanesRef.current[id];
        }
      } else {
        next.add(id);
        const paneId = chart.createIndicator(id, false);
        if (paneId) subIndicatorPanesRef.current[id] = paneId;
      }
      subIndicatorsRef.current = next;
      setSubInds(next);
    }
  }

  const displayBar = crosshair ?? (snapshot ? { open: snapshot.open, high: snapshot.high, low: snapshot.low, close: snapshot.close, volume: snapshot.volume, timestamp: snapshot.timestamp } : null);
  const isUp = snapshot ? snapshot.delta >= 0 : true;
  const deltaSign = isUp ? '+' : '';

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      {/* ─── Pro header: OHLCV + Δ ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line bg-elevated/40 px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Price</span>
            <span className={cn('font-display text-2xl font-semibold tabular-nums', isUp ? 'text-up' : 'text-down')}>
              {snapshot ? fmtPrice(snapshot.close, decimals) : '—'}
            </span>
            {snapshot && (
              <span className={cn('font-mono text-[12px] tabular-nums', isUp ? 'text-up' : 'text-down')}>
                {deltaSign}{fmtPrice(snapshot.delta, decimals)} ({deltaSign}{snapshot.deltaPct.toFixed(2)}%)
              </span>
            )}
            <span className="ml-1 inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-up" aria-label="live" />
          </div>
          {displayBar && (
            <dl className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] tabular-nums">
              <OHLCStat label="O" value={fmtPrice(displayBar.open, decimals)} />
              <OHLCStat label="H" value={fmtPrice(displayBar.high, decimals)} tone="up" />
              <OHLCStat label="L" value={fmtPrice(displayBar.low, decimals)} tone="down" />
              <OHLCStat label="C" value={fmtPrice(displayBar.close, decimals)} />
              <OHLCStat label="VOL" value={fmtVolume(displayBar.volume ?? 0)} />
            </dl>
          )}
        </div>

        {/* Timeframe pills */}
        <div role="tablist" aria-label="Timeframe" className="inline-flex rounded-lg border border-line bg-canvas p-0.5">
          {TF_OPTIONS.map((tf) => (
            <button
              key={tf}
              role="tab"
              aria-selected={timeframe === tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={cn(
                'h-7 rounded-md px-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors',
                timeframe === tf ? 'bg-brand text-black' : 'text-muted hover:bg-elevated hover:text-ink',
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Toolbar: drawing tools + indicators ───────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-3 py-2">
        <ToolButton
          label="Cursor"
          Icon={MousePointer2}
          active={activeTool === 'cursor'}
          onClick={() => pickTool('cursor')}
        />
        <Separator />
        {DRAWING_TOOLS.map((t) => (
          <ToolButton
            key={t.id}
            label={t.label}
            Icon={t.Icon}
            active={activeTool === t.id}
            onClick={() => pickTool(t.id)}
          />
        ))}
        <ToolButton
          label="Clear"
          Icon={Eraser}
          tone="danger"
          onClick={() => pickTool('eraser')}
        />
        <Separator />
        {/* Indicators */}
        <span className="ml-1 mr-1 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          <LineChartIcon className="h-3 w-3" strokeWidth={2} />
          Indicators
        </span>
        {INDICATORS.map((ind) => {
          const active = ind.pane === 'main' ? mainInds.has(ind.id) : subInds.has(ind.id);
          const Icon = ind.id === 'VOL' ? BarChart3 : Activity;
          return (
            <ToolButton
              key={ind.id}
              label={ind.label}
              Icon={Icon}
              active={active}
              onClick={() => toggleIndicator(ind.id, ind.pane)}
            />
          );
        })}
      </div>

      {/* ─── Chart canvas ─────────────────────────────────────────────── */}
      <div ref={ref} className="h-[520px] w-full" />
    </div>
  );
}

function OHLCStat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</dt>
      <dd className={cn('text-ink', tone === 'up' && 'text-up', tone === 'down' && 'text-down')}>{value}</dd>
    </div>
  );
}

function Separator() {
  return <span className="mx-1 h-5 w-px bg-line" />;
}

function ToolButton({
  label,
  Icon,
  onClick,
  active = false,
  tone = 'neutral',
}: {
  label: string;
  Icon: typeof TrendingUp;
  onClick: () => void;
  active?: boolean;
  tone?: 'neutral' | 'danger';
}) {
  const base =
    'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-colors';
  const styles = active
    ? 'bg-brand text-black'
    : tone === 'danger'
      ? 'text-down hover:bg-down/10'
      : 'text-ink hover:bg-elevated';
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`} aria-pressed={active} title={label}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
