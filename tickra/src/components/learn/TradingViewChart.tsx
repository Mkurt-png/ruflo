'use client';

import { useEffect, useRef } from 'react';

// Lightweight wrapper around TradingView's free Advanced Chart widget.
// Renders without any auth; respects dark mode via the document class.
//
// We deliberately load the script per-mount and clean up on unmount, because
// TradingView's widget rewrites the container and leaks DOM if reused.

type Props = {
  symbol: string;         // e.g. "FX:EURUSD", "AMEX:SPY"
  interval?: string;      // "60" = 1H, "240" = 4H, "D" = daily
  caption?: string;
  height?: number;
};

const SCRIPT_SRC = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';

export function TradingViewChart({ symbol, interval = '60', caption, height = 420 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const widgetRoot = document.createElement('div');
    widgetRoot.className = 'tradingview-widget-container';
    const widgetEl = document.createElement('div');
    widgetEl.className = 'tradingview-widget-container__widget';
    widgetEl.style.height = `${height}px`;
    widgetRoot.appendChild(widgetEl);

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.type = 'text/javascript';

    const isDark = document.documentElement.classList.contains('dark');

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: 'Europe/Paris',
      theme: isDark ? 'dark' : 'light',
      style: '1',
      locale: 'en',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      withdateranges: true,
      details: false,
      hide_side_toolbar: true,
      studies: [],
      support_host: 'https://www.tradingview.com',
    });

    widgetRoot.appendChild(script);
    container.appendChild(widgetRoot);

    return () => {
      try {
        container.removeChild(widgetRoot);
      } catch {
        /* ignore — node may have been swapped out by React already */
      }
    };
  }, [symbol, interval, height]);

  return (
    <div className="rounded-sm border border-line bg-surface p-2 md:p-3">
      <div ref={ref} aria-label={`TradingView chart for ${symbol}`} />
      {caption ? (
        <div className="mt-2 px-2 pb-1 font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
          {caption}
        </div>
      ) : null}
    </div>
  );
}
