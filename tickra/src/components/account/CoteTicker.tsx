'use client';

// CoteTicker — the single number that replaces a dashboard of widgets.
// Visual register: a stock quote ("TCKR 61.4 ▲ +0.8"), a 30-day sparkline,
// and four discreet sub-scores. No bar charts, no rings. Numbers do the
// work.

import { useCote } from '@/lib/tickra/useCote';

type Locale = 'fr' | 'en';

const COPY = {
  fr: {
    label: 'TCKR — votre cote',
    legend: 'Une note unique. Régularité, précision, honnêteté, révision.',
    parts: { regularite: 'Régularité', precision: 'Précision', honnete: 'Honnêteté', revision: 'Révision' },
    over: 'sur 100',
    trail: '30 jours',
  },
  en: {
    label: 'TCKR — your quote',
    legend: 'One number. Regularity, precision, honesty, review.',
    parts: { regularite: 'Regularity', precision: 'Precision', honnete: 'Honesty', revision: 'Review' },
    over: 'of 100',
    trail: '30 days',
  },
} as const;

export function CoteTicker({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const { cote } = useCote();

  const up = cote.delta > 0;
  const down = cote.delta < 0;
  const arrow = up ? '▲' : down ? '▼' : '·';
  const deltaColor = up ? 'text-up' : down ? 'text-down' : 'text-muted';

  return (
    <section
      aria-label={t.label}
      className="rounded-sm border border-line bg-surface p-6 md:p-8"
    >
      <header className="flex items-baseline justify-between gap-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">
          {t.label}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-subtle tabular-nums">
          {t.trail}
        </span>
      </header>

      <div className="mt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        {/* The quote */}
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-muted">TCKR</span>
          <span
            className="font-display font-medium tabular-nums text-ink leading-none"
            style={{ fontSize: 'clamp(56px, 9vw, 112px)', letterSpacing: '-0.04em' }}
          >
            {cote.score.toFixed(1)}
          </span>
          <span className={`font-mono text-[13px] tabular-nums ${deltaColor}`}>
            {arrow} {Math.abs(cote.delta).toFixed(1)}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-subtle">
            {t.over}
          </span>
        </div>

        {/* Sparkline */}
        <Sparkline points={cote.trail} />
      </div>

      {/* Sub-scores — quiet, monospaced, no bars */}
      <dl className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-line pt-6 text-[13.5px]">
        <Part label={t.parts.regularite} value={cote.parts.regularite} max={35} />
        <Part label={t.parts.precision} value={cote.parts.precision} max={30} />
        <Part label={t.parts.honnete} value={cote.parts.honnete} max={20} />
        <Part label={t.parts.revision} value={cote.parts.revision} max={15} />
      </dl>

      <p className="mt-6 text-[12px] text-subtle leading-relaxed">{t.legend}</p>
    </section>
  );
}

function Part({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <dt className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">{label}</dt>
      <dd className="mt-2 font-mono tabular-nums text-ink">
        {value.toFixed(1)} <span className="text-subtle">/ {max}</span>
      </dd>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 240;
  const h = 56;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);
  const step = w / Math.max(points.length - 1, 1);
  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  const last = points[points.length - 1];
  const lastX = w;
  const lastY = h - ((last - min) / range) * h;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="opacity-80">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1" className="text-ink" />
      <circle cx={lastX} cy={lastY} r="2.5" fill="currentColor" className="text-brand" />
    </svg>
  );
}

export default CoteTicker;
