import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { PositionSizer } from '@/components/learn/PositionSizer';
import { ExpectancyCalculator } from '@/components/learn/ExpectancyCalculator';
import { RiskOfRuinSimulator } from '@/components/learn/RiskOfRuinSimulator';
import { MarketSessionsClock } from '@/components/learn/MarketSessionsClock';
import { CandlePatternTrainer } from '@/components/learn/CandlePatternTrainer';
import { LossMathPanel } from '@/components/learn/LossMathPanel';
import { GrowthProjection } from '@/components/learn/GrowthProjection';

export const metadata = { title: 'Outils · Tickra' };

const copy = {
  fr: {
    eyebrow: 'Outils',
    title: 'Les outils Tickra.',
    body: 'Des outils utilitaires pour décider mieux, plus vite. Aucun n’envoie de données. Tout fonctionne hors‑ligne.',
    glossaryTitle: 'Glossaire',
    glossaryBody: '42 termes essentiels, classés par thème, cherchables.',
    glossaryCta: 'Ouvrir le glossaire',
    paletteTitle: 'Palette ⌘K',
    paletteBody: 'Toutes les leçons, pages et définitions à deux frappes. Cherchez n’importe où, ouvrez en un Entrée.',
    paletteHint: 'Tapez ⌘K (ou Ctrl K) sur n’importe quelle page.',
    quickNav: 'Aller à',
    nav: {
      sizer: 'Taille de position',
      expectancy: 'Espérance',
      loss: 'Math des pertes',
      ruin: 'Risque de ruine',
      growth: 'Projection',
      sessions: 'Sessions',
      patterns: 'Figures',
    },
  },
  en: {
    eyebrow: 'Tools',
    title: 'The Tickra tools.',
    body: 'Utilities to decide better, faster. None send any data. Everything works offline.',
    glossaryTitle: 'Glossary',
    glossaryBody: '42 essential terms, sorted by theme, searchable.',
    glossaryCta: 'Open the glossary',
    paletteTitle: 'Palette ⌘K',
    paletteBody: 'Every lesson, page and term in two keystrokes. Search anywhere, open with Enter.',
    paletteHint: 'Press ⌘K (or Ctrl K) on any page.',
    quickNav: 'Jump to',
    nav: {
      sizer: 'Position size',
      expectancy: 'Expectancy',
      loss: 'Math of losses',
      ruin: 'Risk of ruin',
      growth: 'Projection',
      sessions: 'Sessions',
      patterns: 'Patterns',
    },
  },
};

export default async function ToolsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = copy[locale];

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <PageHero eyebrow={t.eyebrow} title={t.title} body={t.body} />

        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-24">
            {/* Quick anchor navigation — the toolbox is long, this jumps around it. */}
            <nav aria-label={t.quickNav} className="mb-10 flex flex-wrap items-center gap-2">
              <span className="mr-1 font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
                {t.quickNav}
              </span>
              {(
                [
                  ['sizer', t.nav.sizer],
                  ['expectancy', t.nav.expectancy],
                  ['loss', t.nav.loss],
                  ['ruin', t.nav.ruin],
                  ['growth', t.nav.growth],
                  ['sessions', t.nav.sessions],
                  ['patterns', t.nav.patterns],
                ] as const
              ).map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="inline-flex h-8 items-center rounded-full border border-line bg-canvas px-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted transition-colors hover:border-ink hover:text-ink"
                >
                  {label}
                </a>
              ))}
            </nav>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div id="sizer" className="scroll-mt-24">
                <PositionSizer locale={locale} />
              </div>
              <div id="expectancy" className="scroll-mt-24">
                <ExpectancyCalculator locale={locale} />
              </div>
            </div>
            <div id="loss" className="mt-3 scroll-mt-24">
              <LossMathPanel locale={locale} />
            </div>
            <div id="ruin" className="mt-3 scroll-mt-24">
              <RiskOfRuinSimulator locale={locale} />
            </div>
            <div id="growth" className="mt-3 scroll-mt-24">
              <GrowthProjection locale={locale} />
            </div>
            <div id="sessions" className="mt-3 scroll-mt-24">
              <MarketSessionsClock locale={locale} />
            </div>
            <div id="patterns" className="mt-3 scroll-mt-24">
              <CandlePatternTrainer locale={locale} />
            </div>
          </Container>
        </section>

        <section className="border-b border-line bg-elevated">
          <Container as="div" className="py-20 md:py-24">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <article className="flex flex-col justify-between rounded-sm border border-line bg-surface p-7 md:p-9">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                    {t.glossaryTitle}
                  </div>
                  <h2 className="mt-5 max-w-md font-display text-2xl font-medium tracking-tight text-balance text-ink md:text-3xl">
                    {t.glossaryTitle}
                  </h2>
                  <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">{t.glossaryBody}</p>
                </div>
                <div className="mt-10">
                  <Link
                    href={`/${locale}/glossary`}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
                  >
                    {t.glossaryCta}
                    <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                  </Link>
                </div>
              </article>

              <article className="flex flex-col justify-between rounded-sm border border-line bg-surface p-7 md:p-9">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                    {t.paletteTitle}
                  </div>
                  <h2 className="mt-5 max-w-md font-display text-2xl font-medium tracking-tight text-balance text-ink md:text-3xl">
                    {t.paletteTitle}
                  </h2>
                  <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">{t.paletteBody}</p>
                </div>
                <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  <kbd className="rounded-sm border border-line bg-surface px-1.5 py-0.5">⌘</kbd>
                  <kbd className="rounded-sm border border-line bg-surface px-1.5 py-0.5">K</kbd>
                  <span className="ml-2">{t.paletteHint}</span>
                </div>
              </article>
            </div>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
