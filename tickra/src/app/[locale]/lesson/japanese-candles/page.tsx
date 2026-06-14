import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { isLocale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { CandlestickChart } from '@/components/hero/CandlestickChart';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'lesson/japanese-candles',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Leçon — Bougies japonaises' : 'Lesson — Japanese candles',
    description:
      params.locale === 'fr'
        ? 'Aperçu d’une leçon Tickra : lire une bougie japonaise — corps, mèches, signal.'
        : 'Preview of a Tickra lesson: reading a Japanese candle — body, wicks, signal.',
    ogEyebrow: params.locale === 'fr' ? 'Tickra · Leçon' : 'Tickra · Lesson',
  });
}

export default async function LessonPreviewPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.lessonPreview;

  return (
    <>
      <Navbar dict={dict} locale={params.locale} />
      <main id="main">
        <section className="border-b border-line">
          <Container as="div" className="pb-20 pt-16 md:pb-28 md:pt-24">
            <Eyebrow>{t.eyebrow}</Eyebrow>

            <div className="mt-6 grid grid-cols-12 gap-x-6 gap-y-12">
              <div className="col-span-12 lg:col-span-7">
                <h1 className="font-display text-display-lg font-medium tracking-tight text-balance text-ink">
                  {t.title}
                </h1>

                <nav aria-label="Lesson chapters" className="mt-8 flex flex-wrap gap-2">
                  {t.chapters.map((c, i) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
                    >
                      <span className="text-subtle">0{i + 1}</span>
                      {c}
                    </span>
                  ))}
                </nav>

                <p className="mt-10 max-w-2xl text-[17px] leading-relaxed text-muted">{t.intro}</p>

                <div className="mt-12 space-y-7 border-l border-line pl-6">
                  {t.body.map((p, i) => (
                    <p key={i} className="max-w-2xl text-[16px] leading-relaxed text-ink">
                      {p}
                    </p>
                  ))}
                </div>

                <div className="mt-14 rounded-sm border border-line bg-elevated p-8 md:p-10">
                  <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                    {t.drillTitle}
                  </div>
                  <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-ink">{t.drillBody}</p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button href={`/${params.locale}/onboarding`} size="lg">
                      {t.cta}
                      <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                    <Link
                      href={`/${params.locale}/pricing`}
                      className="inline-flex h-12 items-center gap-2 rounded-full border border-line px-6 text-[15px] font-medium tracking-tight text-ink transition-colors hover:border-ink"
                    >
                      {t.secondary}
                    </Link>
                  </div>
                </div>
              </div>

              <aside className="col-span-12 lg:col-span-5">
                <div className="sticky top-24 rounded-sm border border-line bg-surface p-6 md:p-8">
                  <div className="mb-5 flex items-baseline justify-between border-b border-line pb-4">
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-xl font-medium tracking-tight">EUR/USD</span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                        Spot · 1H
                      </span>
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
                      Lesson 04 / 222
                    </span>
                  </div>
                  <CandlestickChart caption={dict.hero.chartCaption} />
                </div>
              </aside>
            </div>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={params.locale} />
    </>
  );
}
