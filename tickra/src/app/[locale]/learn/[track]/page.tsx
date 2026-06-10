import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { TRACKS, getTrack, lessonGlobalIndex } from '@/lib/curriculum/data';
import { isSeeded } from '@/lib/curriculum/lesson-content';
import { LessonCheckmark } from '@/components/learn/LessonCheckmark';
import { LessonPreviewPopover } from '@/components/learn/LessonPreviewPopover';
import { LessonLockBadge } from '@/components/learn/LessonLockBadge';
import { CourseJsonLd } from '@/components/seo/CourseJsonLd';
import { CalendarClock, Info } from 'lucide-react';

type Params = { locale: string; track: string };

export async function generateStaticParams() {
  const params: Params[] = [];
  for (const l of locales) {
    for (const t of TRACKS) params.push({ locale: l, track: t.slug });
  }
  return params;
}

export async function generateMetadata({ params }: { params: Params }) {
  if (!isLocale(params.locale)) return {};
  const track = getTrack(params.track);
  if (!track) return {};
  return { title: `${track.title[params.locale as Locale]} · Tickra` };
}

export default async function TrackPage({ params }: { params: Params }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const track = getTrack(params.track);
  if (!track) notFound();
  const dict = await getDictionary(locale);

  return (
    <>
      <CourseJsonLd track={track} locale={locale} />
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <section className="border-b border-line">
          <Container as="div" className="pb-16 pt-16 md:pb-20 md:pt-24">
            <Link
              href={`/${locale}/learn`}
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
              {locale === 'fr' ? 'Toutes les pistes' : 'All tracks'}
            </Link>
            <Eyebrow>{locale === 'fr' ? 'Piste' : 'Track'}</Eyebrow>
            <h1 className="mt-6 max-w-3xl font-display text-display-lg font-medium tracking-tight text-balance text-ink">
              {track.title[locale]}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-[17px] leading-relaxed text-muted md:text-lg">
              {track.summary[locale]}
            </p>
          </Container>
        </section>

        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-28">
            <ol className="divide-y divide-line border-y border-line">
              {track.lessons.map((lesson) => (
                <li key={lesson.id} className="grid grid-cols-12 items-center gap-x-6 gap-y-2 py-5 md:py-6">
                  <span className="col-span-2 font-mono text-[12px] tabular-nums uppercase tracking-[0.18em] text-subtle md:col-span-1">
                    {String(lesson.index).padStart(2, '0')}
                  </span>
                  <Link
                    href={`/${locale}/learn/${track.slug}/${lesson.slug}`}
                    className="group col-span-7 flex flex-wrap items-center gap-3 font-display text-lg font-medium tracking-tight text-ink transition-colors hover:text-muted md:col-span-8 md:text-xl"
                  >
                    {lesson.title[locale]}
                    <LessonLockBadge
                      globalIndex={lessonGlobalIndex(track.slug, lesson.slug)}
                      locale={locale}
                    />
                    {/* TICKRA-PHASE-1.2: "Bientôt" badge on unseeded lessons. */}
                    {!isSeeded(lesson.id) ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                        <CalendarClock aria-hidden className="h-3 w-3" strokeWidth={2} />
                        {locale === 'fr' ? 'Bientôt' : 'Soon'}
                      </span>
                    ) : null}
                  </Link>
                  <span className="col-span-3 flex items-center justify-end gap-3 md:col-span-3">
                    <LessonPreviewPopover
                      trackSlug={track.slug}
                      lessonSlug={lesson.slug}
                      locale={locale}
                    >
                      <span
                        aria-label={locale === 'fr' ? 'Aperçu de la leçon' : 'Lesson preview'}
                        className="inline-flex h-7 w-7 cursor-help items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink"
                      >
                        <Info aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
                      </span>
                    </LessonPreviewPopover>
                    <LessonCheckmark lessonId={lesson.id} />
                    <Link
                      href={`/${locale}/learn/${track.slug}/${lesson.slug}`}
                      aria-label={locale === 'fr' ? 'Ouvrir' : 'Open'}
                      className="inline-flex h-7 w-7 items-center justify-center text-muted transition-colors hover:text-ink"
                    >
                      <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                    </Link>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-12">
              <Link
                href={`/${locale}/learn/${track.slug}/${track.lessons[0].slug}`}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
              >
                {locale === 'fr' ? 'Commencer la piste' : 'Start the track'}
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
