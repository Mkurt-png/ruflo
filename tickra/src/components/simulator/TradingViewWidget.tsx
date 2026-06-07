'use client';

// TICKRA-SPRINT-B: TradingView advanced-chart embed (free, no API key).
// Re-mounts the script when the symbol changes so the chart hot-swaps.
// TICKRA-FIX: detect when the iframe never paints (ad-blocker, CSP, etc.)
// and surface a fallback instead of an eternal spinner.

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export function TradingViewWidget({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = '';
    setBlocked(false);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.type = 'text/javascript';
    script.onerror = () => setBlocked(true);
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

    // Fallback: TradingView spins forever when its CDN is blocked. Check
    // early at 4s (no iframe = blocked) and late at 8s (iframe present but
    // empty = also blocked).
    const tEarly = window.setTimeout(() => {
      const hasIframe = container.querySelector('iframe');
      if (!hasIframe) setBlocked(true);
    }, 4000);
    const tLate = window.setTimeout(() => {
      const iframe = container.querySelector('iframe') as HTMLIFrameElement | null;
      if (!iframe) {
        setBlocked(true);
        return;
      }
      try {
        const body = iframe.contentDocument?.body;
        if (!body || body.innerHTML.length === 0) setBlocked(true);
      } catch {
        /* cross-origin iframe — can't introspect, assume it's fine */
      }
    }, 8000);

    return () => {
      window.clearTimeout(tEarly);
      window.clearTimeout(tLate);
      container.innerHTML = '';
    };
  }, [symbol]);

  return (
    <div className="relative tradingview-widget-container h-[420px] w-full" ref={ref}>
      <div className="tradingview-widget-container__widget h-full w-full" />
      {blocked ? (
        <div className="absolute inset-0 flex items-center justify-center bg-canvas/95 p-6 text-center">
          <div>
            <AlertTriangle aria-hidden className="mx-auto h-6 w-6 text-down" strokeWidth={1.75} />
            <p className="mt-3 text-sm text-ink">
              Le graphique TradingView n’a pas pu charger.
            </p>
            <p className="mt-1 text-xs text-muted">
              Souvent un bloqueur de publicité ou une restriction réseau. Désactivez-le pour ce site, ou ouvrez TradingView directement.
            </p>
            <a
              href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-9 items-center rounded-full bg-ink px-4 text-xs font-medium text-canvas hover:brightness-110"
            >
              Ouvrir sur TradingView
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
