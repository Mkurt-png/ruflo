import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { TRACKS, totalLessons } from '@/lib/curriculum/data';
import { getLessonContent, isSeeded } from '@/lib/curriculum/lesson-content';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'curriculum',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Cursus' : 'Curriculum',
    description:
      params.locale === 'fr'
        ? 'Le plan complet du cursus Tickra : pistes, leçons, ordre de lecture.'
        : 'Tickra’s full curriculum plan: tracks, lessons, reading order.',
  });
}

const levelLabel: Record<string, { fr: string; en: string }> = {
  foundations: { fr: 'Fondations', en: 'Foundations' },
  intermediate: { fr: 'Intermédiaire', en: 'Intermediate' },
  advanced: { fr: 'Avancé', en: 'Advanced' },
  mastery: { fr: 'Maîtrise', en: 'Mastery' },
};

const copy = {
  fr: {
    eyebrow: 'Curriculum',
    title: 'Le programme complet.',
    body: `${TRACKS.length} pistes, ${totalLessons()} leçons. Voici la carte exacte — titres, niveau, indication de contenu rédigé.`,
    seeded: 'Contenu rédigé',
    placeholder: 'Aperçu structuré',
    intro: 'Extrait du brief',
    cta: 'Commencer cette leçon',
  },
  en: {
    eyebrow: 'Curriculum',
    title: 'The full programme.',
    body: `${TRACKS.length} tracks, ${totalLessons()} lessons. Here is the exact map — titles, level, written-content marker.`,
    seeded: 'Written content',
    placeholder: 'Structured preview',
    intro: 'Brief excerpt',
    cta: 'Start this lesson',
  },
};

export default async function CurriculumPage({ params }: { params: { locale: string } }) {
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
          <Container as="div" className="py-20 md:py-28">
            <div className="space-y-16">
              {TRACKS.map((tr) => (
                <article key={tr.id}>
                  <header className="flex flex-col gap-3 border-b border-line pb-6 md:flex-row md:items-baseline md:justify-between">
                    <div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                        {levelLabel[tr.level][locale]} · × {tr.lessons.length}
                      </div>
                      <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
                        {tr.title[locale]}
                      </h2>
                      <p className="mt-3 max-w-xl text-[15.5px] leading-relaxed text-muted">
                        {tr.summary[locale]}
                      </p>
                    </div>
                    <Link
                      href={`/${locale}/learn/${tr.slug}`}
                      className="inline-flex h-11 w-fit items-center gap-2 rounded-full border border-line px-4 text-[14px] font-medium tracking-tight text-ink transition-colors hover:border-ink"
                    >
                      {locale === 'fr' ? 'Voir la piste' : 'Open track'}
                      <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                    </Link>
                  </header>

                  <ol className="mt-6 divide-y divide-line">
                    {tr.lessons.map((lesson) => {
                      const content = getLessonContent(tr, lesson);
                      const seeded = isSeeded(lesson.id);
                      const intro = content.intro[locale][0];
                      return (
                        <li key={lesson.id} className="py-5">
                          <div className="grid grid-cols-12 items-baseline gap-x-4 gap-y-2">
                            <span className="col-span-2 font-mono text-[12px] tabular-nums uppercase tracking-[0.18em] text-subtle md:col-span-1">
                              {String(lesson.index).padStart(2, '0')}
                            </span>
                            <div className="col-span-10 md:col-span-9">
                              <div className="flex flex-wrap items-baseline gap-3">
                                <Link
                                  href={`/${locale}/learn/${tr.slug}/${lesson.slug}`}
                                  className="font-display text-lg font-medium tracking-tight text-ink hover:text-muted md:text-xl"
                                >
                                  {lesson.title[locale]}
                                </Link>
                                <span
                                  className={
                                    'inline-flex h-5 items-center rounded-full border px-2 font-mono text-[9.5px] uppercase tracking-[0.18em] ' +
                                    (seeded
                                      ? 'border-ink bg-ink text-canvas'
                                      : 'border-line bg-canvas text-muted')
                                  }
                                >
                                  {seeded ? t.seeded : t.placeholder}
                                </span>
                              </div>
                              <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
                                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-subtle">
                                  {t.intro} ·
                                </span>{' '}
                                {intro}
                              </p>
                            </div>
                            <Link
                              href={`/${locale}/learn/${tr.slug}/${lesson.slug}`}
                              aria-label={t.cta}
                              className="col-span-12 inline-flex h-9 items-center justify-end gap-2 text-[13px] text-ink transition-colors hover:text-muted md:col-span-2"
                            >
                              {t.cta}
                              <ArrowRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </article>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
