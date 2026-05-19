'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, PlayCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { CandlestickChart } from '@/components/hero/CandlestickChart';
import { fadeUp, easeOutExpo } from '@/lib/motion';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

type Props = { dict: Dictionary; locale: Locale };

export function Hero({ dict, locale }: Props) {
  const t = dict.hero;
  const [line1, line2] = t.title;

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-line">
      <Container as="div" className="relative grid grid-cols-12 gap-x-6 gap-y-16 pb-24 pt-16 md:pb-32 md:pt-24">
        <div className="col-span-12 lg:col-span-6 xl:col-span-5">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Eyebrow>{t.eyebrow}</Eyebrow>
          </motion.div>

          <motion.h1
            id="hero-title"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="mt-8 font-display text-display-xl font-medium text-balance text-ink"
          >
            {line1}
            <br />
            {renderEm(line2, t.titleEm)}
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="mt-8 max-w-xl text-[17px] leading-relaxed text-muted md:text-lg text-pretty"
          >
            {t.body}
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Button href={`/${locale}/onboarding`} size="lg">
              {t.primaryCta}
              <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </Button>
            <Button href={`/${locale}/lesson/japanese-candles`} variant="ghost" size="lg">
              <PlayCircle aria-hidden className="h-4 w-4" strokeWidth={1.5} />
              {t.secondaryCta}
            </Button>
          </motion.div>

          <motion.dl
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="mt-14 grid max-w-xl grid-cols-3 gap-x-6 border-t border-line pt-8"
          >
            {t.stats.map((s) => (
              <div key={s.label}>
                <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                  {s.label}
                </dt>
                <dd className="mt-2 font-display text-2xl font-medium tracking-tight text-ink md:text-3xl">
                  {s.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: easeOutExpo }}
          className="relative col-span-12 lg:col-span-6 xl:col-span-7"
        >
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-x-4 -top-4 hidden h-16 border-l border-t border-line lg:block"
            />
            <div className="relative rounded-sm border border-line bg-surface p-6 md:p-8">
              <div className="mb-5 flex items-baseline justify-between border-b border-line pb-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-xl font-medium tracking-tight">EUR/USD</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    Spot · 1H
                  </span>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
                  Lesson 04 / 127
                </span>
              </div>
              <CandlestickChart caption={t.chartCaption} />
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-6 -right-6 hidden h-24 w-24 border border-ink lg:block"
            />
          </div>
        </motion.div>
      </Container>
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
      <span className="font-display italic text-muted">{match}</span>
      {after}
    </>
  );
}
