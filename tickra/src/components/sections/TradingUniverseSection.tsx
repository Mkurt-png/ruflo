// Decorative "trading universe" section — futuristic 3D globe paired
// with a tight copy block that doubles as a stop on the long landing
// page. Mounted between Method/Bento and the rest of the page.

import dynamic from 'next/dynamic';
import type { Locale } from '@/lib/i18n/config';

const TradingGlobe3D = dynamic(
  () => import('./TradingGlobe3D').then((m) => m.TradingGlobe3D),
  { ssr: false, loading: () => <div className="w-full h-[480px]" aria-hidden /> },
);

const COPY = {
  fr: {
    eyebrow: 'Tickra · réseau',
    title: 'Tous les marchés. Un seul langage.',
    body:
      'Forex, indices, crypto, métaux. Vous apprenez une grammaire — chandelles, structure, gestion du risque — et elle se parle partout. Le terminal, le simulateur, le journal : tous connectés au même fond commun.',
    bullets: [
      { label: 'Forex',  hint: '7 paires majeures' },
      { label: 'Crypto', hint: 'BTC · ETH · majors' },
      { label: 'Or',     hint: 'XAU / spot' },
      { label: 'Indices', hint: 'S&P · NDX · DAX' },
    ],
  },
  en: {
    eyebrow: 'Tickra · network',
    title: 'Every market. One language.',
    body:
      'Forex, indices, crypto, metals. You learn one grammar — candles, structure, risk management — and it speaks everywhere. The terminal, the simulator, the journal: all connected to the same foundation.',
    bullets: [
      { label: 'Forex',   hint: '7 major pairs' },
      { label: 'Crypto',  hint: 'BTC · ETH · majors' },
      { label: 'Gold',    hint: 'XAU / spot' },
      { label: 'Indices', hint: 'S&P · NDX · DAX' },
    ],
  },
} as const;

export function TradingUniverseSection({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  return (
    <section className="relative bg-elevated text-ink overflow-hidden border-y border-line">
      {/* Soft radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(circle at 70% 50%, rgba(0,230,118,0.12), transparent 60%)',
        }}
      />
      <div className="relative z-10 mx-auto w-full max-w-container px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 py-24 lg:py-28 items-center">
        <div>
          <span className="inline-block font-mono text-[11px] uppercase tracking-[0.22em] text-brand">
            {t.eyebrow}
          </span>
          <h2 className="mt-4 font-display text-4xl md:text-5xl font-medium tracking-tight text-balance">
            {t.title}
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
            {t.body}
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-4 max-w-md">
            {t.bullets.map((b) => (
              <div key={b.label} className="rounded-lg border border-line bg-surface/[0.02] p-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">{b.label}</dt>
                <dd className="mt-1 text-[13px] text-muted">{b.hint}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative">
          <TradingGlobe3D height={520} />
        </div>
      </div>
    </section>
  );
}
