'use client';

// TICKRA-FEATURE: showcase of the Pro paper-trading simulator on the landing.
// Static visual mockup + CTA (gated behind /pricing). Encourages free users
// to upgrade by showing what is locked away.

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowDownRight, ArrowUpRight, Lock, TrendingUp } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { fadeUp } from '@/lib/motion';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    eyebrow: 'Réservé à Tickra Pro',
    title: 'Entraînez-vous sur un vrai marché. Sans risquer un centime.',
    body:
      'Un compte démo à 10 000 $, six instruments (forex, indices, or, crypto), TradingView intégré, gestion du stop et du take-profit calculée automatiquement à partir de votre risque par trade. Toutes vos positions et statistiques sauvegardées.',
    bullets: [
      '6 instruments majeurs · forex, indices, or, crypto',
      'Risk/reward calculé en temps réel · stop & take-profit automatiques',
      'Statistiques : win rate, R moyen, P&L cumulé',
      'Historique de tous vos trades · exportable',
    ],
    cta: 'Découvrir les plans',
    secondary: 'Voir comment ça marche',
    chip: 'Live démo',
    chip2: 'Sauvegardé',
    cardSymbol: 'EUR/USD',
    cardTrade: 'Long · 0.10 lot',
    riskLabel: 'Risque',
    rewardLabel: 'Gain potentiel',
    rrLabel: 'R:R',
    long: 'Acheter',
    short: 'Vendre',
  },
  en: {
    eyebrow: 'Reserved for Tickra Pro',
    title: 'Practise on a real market. Without risking a cent.',
    body:
      'A $10,000 demo account, six instruments (forex, indices, gold, crypto), embedded TradingView, stop and take-profit auto-computed from your per-trade risk. Every position and stat saved.',
    bullets: [
      '6 major instruments · forex, indices, gold, crypto',
      'Risk/reward live · auto stop & take-profit',
      'Stats: win rate, average R, cumulative P&L',
      'Full trade history · exportable',
    ],
    cta: 'See the plans',
    secondary: 'How it works',
    chip: 'Live demo',
    chip2: 'Saved',
    cardSymbol: 'EUR/USD',
    cardTrade: 'Long · 0.10 lot',
    riskLabel: 'Risk',
    rewardLabel: 'Potential reward',
    rrLabel: 'R:R',
    long: 'Buy',
    short: 'Sell',
  },
};

export function SimulatorShowcase({ locale }: { locale: Locale }) {
  const t = copy[locale];

  return (
    <section
      id="simulator-showcase"
      aria-labelledby="simulator-showcase-title"
      className="relative overflow-hidden border-b border-line bg-ink text-canvas"
    >
      <span aria-hidden className="absolute inset-0 tickra-grid opacity-30" />
      <Container as="div" className="relative py-24 md:py-32">
        <div className="grid grid-cols-12 gap-x-6 gap-y-12">
          {/* ── Copy ───────────────────────────────────────────────── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp}
            className="col-span-12 lg:col-span-5"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-canvas/30 bg-canvas/5 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.22em] text-canvas/80">
              <Lock aria-hidden className="h-3 w-3" strokeWidth={2} />
              {t.eyebrow}
            </span>
            <h2
              id="simulator-showcase-title"
              className="mt-6 font-display text-display-md font-medium tracking-tight text-balance md:text-display-lg"
            >
              {t.title}
            </h2>
            <p className="mt-6 max-w-xl text-pretty text-[16px] leading-relaxed text-canvas/75 md:text-[17px]">
              {t.body}
            </p>

            <ul className="mt-8 space-y-3">
              {t.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[14.5px] leading-relaxed text-canvas/85">
                  <span aria-hidden className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-up glow-up" />
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href={`/${locale}/pricing`}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-canvas px-6 font-medium tracking-tight text-ink transition-all hover:-translate-y-0.5 hover:brightness-110"
              >
                {t.cta}
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </Link>
              <Link
                href={`/${locale}/me/simulator`}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-canvas/30 px-5 font-medium tracking-tight text-canvas transition-colors hover:border-canvas hover:bg-canvas hover:text-ink"
              >
                {t.secondary}
              </Link>
            </div>
          </motion.div>

          {/* ── Visual mockup ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="col-span-12 lg:col-span-7"
          >
            <div className="relative">
              {/* gradient halo behind the card */}
              <span
                aria-hidden
                className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-brand/30 via-accent/20 to-up/20 opacity-60 blur-3xl"
              />

              {/* main "chart card" */}
              <div className="relative grid gap-3 rounded-sm border border-canvas/15 bg-canvas/5 p-4 backdrop-blur-md md:grid-cols-3 md:p-5">
                {/* Chart panel ─ left/main */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between border-b border-canvas/10 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg font-medium tracking-tight">{t.cardSymbol}</span>
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-canvas/55">
                        1H · {t.cardTrade}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-up/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-up">
                      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-up animate-pulse motion-reduce:animate-none" />
                      {t.chip}
                    </span>
                  </div>

                  <FakeChart />

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-canvas/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-canvas/70">
                      <TrendingUp className="h-3 w-3" strokeWidth={2} />
                      +47 pips
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-canvas/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-canvas/70">
                      {t.chip2}
                    </span>
                  </div>
                </div>

                {/* Trade ticket ─ right */}
                <div className="rounded-sm border border-canvas/10 bg-canvas/[0.04] p-4">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-canvas/55">{t.cardSymbol}</p>

                  <dl className="mt-4 space-y-3 text-[12.5px]">
                    <Row label={t.riskLabel} value="−$20.00" tone="down" />
                    <Row label={t.rewardLabel} value="+$60.00" tone="up" />
                    <Row label={t.rrLabel} value="1:3.00" />
                  </dl>

                  <div className="mt-4 grid grid-cols-2 gap-1.5">
                    <span className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-up px-2 text-[11px] font-medium text-ink">
                      <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                      {t.long}
                    </span>
                    <span className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-down px-2 text-[11px] font-medium text-canvas">
                      <ArrowDownRight className="h-3 w-3" strokeWidth={2} />
                      {t.short}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-canvas/55">{label}</dt>
      <dd
        className={
          'font-display text-base tabular-nums ' +
          (tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-canvas')
        }
      >
        {value}
      </dd>
    </div>
  );
}

function FakeChart() {
  // Simple SVG candlestick mockup — pure decoration, no math required.
  const candles: Array<{ open: number; close: number; high: number; low: number }> = [
    { open: 30, close: 36, high: 38, low: 28 },
    { open: 36, close: 34, high: 38, low: 32 },
    { open: 34, close: 42, high: 44, low: 33 },
    { open: 42, close: 40, high: 45, low: 38 },
    { open: 40, close: 48, high: 50, low: 39 },
    { open: 48, close: 46, high: 50, low: 44 },
    { open: 46, close: 54, high: 56, low: 45 },
    { open: 54, close: 60, high: 62, low: 52 },
    { open: 60, close: 56, high: 62, low: 55 },
    { open: 56, close: 64, high: 66, low: 54 },
    { open: 64, close: 70, high: 72, low: 62 },
    { open: 70, close: 68, high: 72, low: 65 },
    { open: 68, close: 74, high: 76, low: 66 },
    { open: 74, close: 80, high: 82, low: 72 },
  ];
  const w = 320;
  const h = 160;
  const cw = w / candles.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 block h-40 w-full" role="img" aria-hidden>
      {/* gridlines */}
      {[0.25, 0.5, 0.75].map((p) => (
        <line key={p} x1={0} x2={w} y1={h * p} y2={h * p} stroke="rgb(var(--canvas) / 0.10)" strokeDasharray="3 4" />
      ))}
      {candles.map((c, i) => {
        const cx = cw * i + cw / 2;
        const up = c.close >= c.open;
        const top = h - c.high * (h / 90);
        const bottom = h - c.low * (h / 90);
        const bodyTop = h - Math.max(c.open, c.close) * (h / 90);
        const bodyBottom = h - Math.min(c.open, c.close) * (h / 90);
        const color = up ? 'rgb(var(--up))' : 'rgb(var(--down))';
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={top} y2={bottom} stroke={color} strokeWidth={1.25} />
            <rect
              x={cx - cw * 0.32}
              y={bodyTop}
              width={cw * 0.64}
              height={Math.max(2, bodyBottom - bodyTop)}
              fill={color}
              fillOpacity={up ? 0.85 : 1}
              stroke={color}
              strokeWidth={1}
            />
          </g>
        );
      })}
    </svg>
  );
}
