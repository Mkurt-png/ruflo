'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatedCandleChart } from '@/components/ui/AnimatedCandleChart';
import { getHeroCtaVariant, getHeroCtaLabel, trackHeroCta, type HeroCtaVariant } from '@/lib/ab/hero-cta';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

type Props = { dict: Dictionary; locale: Locale };

// TICKRA-REDESIGN: Premium Navy hero — navy-900 bg, two-col, accent-blue CTA.
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
      className="relative bg-navy-900 min-h-screen w-full overflow-hidden"
    >
      <div className="relative z-10 mx-auto w-full max-w-container px-6 md:px-10 grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12 py-20 lg:py-28 items-center">
        {/* Left column (60%) */}
        <div className="lg:col-span-3">
          <span className="inline-block bg-navy-800 text-accent-blue text-xs font-medium px-3 py-1 rounded-full">
            {t.eyebrow}
          </span>

          <h1
            id="hero-title"
            className="text-white text-3xl md:text-5xl font-medium leading-tight mt-6"
          >
            {line1}
            <br />
            {renderEm(line2, emphasis)}
          </h1>

          <p className="text-text-inverse/70 text-lg max-w-xl mt-4">{t.body}</p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link
              href={`/${locale}/onboarding`}
              onClick={() => trackHeroCta('click', ctaVariant)}
              className="inline-flex items-center justify-center bg-accent-blue hover:bg-accent-blue-hover text-white px-6 py-3 rounded-lg text-base font-medium transition-colors duration-200"
            >
              {primaryCtaLabel} <span aria-hidden className="ml-1">→</span>
            </Link>
            <Link
              href={`/${locale}/learn/japanese-candles/01-anatomy-of-a-candle`}
              className="inline-flex items-center justify-center border border-white/30 text-white/80 hover:bg-white/10 px-6 py-3 rounded-lg text-base transition-colors duration-200"
            >
              {t.secondaryCta}
            </Link>
          </div>

          <dl className="flex flex-wrap gap-8 mt-12">
            {t.stats.map((s) => (
              <div key={s.label}>
                <dt className="text-white text-3xl md:text-4xl font-medium">{s.value}</dt>
                <dd className="text-white/50 text-sm mt-1">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right column (40%) — desktop only */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="bg-navy-800/80 rounded-xl p-4 shadow-2xl border border-white/5">
            <div className="text-accent-blue text-xs font-medium">Lesson 04 / 222</div>
            <div className="mt-3">
              <AnimatedCandleChart />
            </div>
            <div className="text-white/50 text-xs mt-2">{t.chartCaption ?? 'EUR/USD · 1H · +0.21%'}</div>
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
      <span className="text-accent-blue">{match}</span>
      {after}
    </>
  );
}
