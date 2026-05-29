'use client';

// TICKRA-SPRINT-B: TradingView advanced-chart embed (free, no API key).
// Re-mounts the script when the symbol changes so the chart hot-swaps.

import { useEffect, useRef } from 'react';

export function TradingViewWidget({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: '60',
      timezone: 'Etc/UTC',
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      style: '1',
      locale: 'fr',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      withdateranges: true,
      details: false,
      hotlist: false,
      calendar: false,
      backgroundColor: 'transparent',
      gridColor: 'rgba(120,120,150,0.10)',
      support_host: 'https://www.tradingview.com',
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container h-[420px] w-full" ref={ref}>
      <div className="tradingview-widget-container__widget h-full w-full" />
    </div>
  );
}
