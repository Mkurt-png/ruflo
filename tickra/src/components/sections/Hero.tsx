'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { getHeroCtaVariant, getHeroCtaLabel, trackHeroCta, type HeroCtaVariant } from '@/lib/ab/hero-cta';
import { CountUpStat } from '@/components/ui/CountUpStat';
import { CursorGlow } from '@/components/fx/CursorGlow';
import { ShimmerButton } from '@/components/fx/ShimmerButton';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

const Hero3D = dynamic(() => import('./Hero3D').then((m) => m.Hero3D), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[420px]" aria-hidden />,
});

type Props = { dict: Dictionary; locale: Locale };

// TICKRA-REDESIGN: Robinhood/Public.com — black bg, vivid green accent, 3D hero scene.
export function Hero({ dict, locale }: Props) {
  const t = dict.hero;
  const [line1, line2] = t.title;
  const emphasis = t.titleEm;

  const [ctaVariant, setCtaVariant] = useState<HeroCtaVariant>('control');
  useEffect(() => {
    const v = getHeroCtaVariant();
    setCtaVariant(v);
    trackHeroCta('view', v);
  }, []);
  const primaryCtaLabel = getHeroCtaLabel(ctaVariant, locale);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative text-ink min-h-screen w-full overflow-hidden"
    >
      {/* Holographic aurora blooms behind the hero. */}
      <div aria-hidden className="aurora" />
      <div aria-hidden className="aurora aurora--lt" />
      {/* Cursor-following brand glow. */}
      <CursorGlow />

      <div className="relative z-10 mx-auto w-full max-w-container px-6 md:px-10 grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12 py-20 lg:py-28 items-center">
        {/* Left column (60%) */}
        <div className="lg:col-span-3">
          <span className="inline-block rounded-full border border-brand/30 bg-surface/50 px-3 py-1 text-xs font-medium text-brand backdrop-blur">
            {t.eyebrow}
          </span>

          <h1
            id="hero-title"
            className="text-ink text-6xl md:text-8xl font-bold tracking-tight leading-[0.95] mt-6"
          >
            {line1}
            <br />
            {renderEm(line2, emphasis)}
          </h1>

          <p className="text-muted text-lg max-w-xl mt-6">{t.body}</p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <ShimmerButton
              href={`/${locale}/placement`}
              onClick={() => trackHeroCta('click', ctaVariant)}
            >
              {primaryCtaLabel}
              <span aria-hidden className="ml-1 transition-transform duration-200 group-hover:translate-x-1">→</span>
            </ShimmerButton>
            <Link
              href={`/${locale}/learn/japanese-candles/01-anatomy-of-a-candle`}
              className="inline-flex items-center justify-center rounded-full border border-line bg-surface/40 px-6 py-3 text-base text-ink backdrop-blur transition-colors duration-200 hover:border-ink"
            >
              {t.secondaryCta}
            </Link>
          </div>

          <dl className="flex flex-wrap gap-8 mt-12">
            {t.stats.map((s) => (
              <div key={s.label}>
                <dt className="text-brand text-3xl md:text-4xl font-bold">
                  <CountUpStat value={s.value} />
                </dt>
                <dd className="text-muted text-sm mt-1">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right column (40%) — 3D scene, desktop only */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="relative w-full aspect-square">
            <Hero3D />
          </div>
        </div>
      </div>
    </section>
  );
}

function renderEm(line: string, emphasis: string) {
  const idx = line.toLowerCase().indexOf(emphasis.toLowerCase());
  if (idx === -1) return line;
  const before = line.slice(0, idx);
  const match = line.slice(idx, idx + emphasis.length);
  const after = line.slice(idx + emphasis.length);
  return (
    <>
      {before}
      <span className="holo-text">{match}</span>
      {after}
    </>
  );
}
