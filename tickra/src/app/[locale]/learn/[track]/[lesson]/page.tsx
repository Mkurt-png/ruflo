import { notFound } from 'next/navigation';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { TRACKS, getLesson, getNeighbours, lessonGlobalIndex, totalLessons } from '@/lib/curriculum/data';
import { getLessonContent } from '@/lib/curriculum/lesson-content';
import { LessonRunner } from '@/components/learn/LessonRunner';
import { LessonNotes } from '@/components/learn/LessonNotes';
import { PrefetchNeighbours } from '@/components/learn/PrefetchNeighbours';

type Params = { locale: string; track: string; lesson: string };

export async function generateStaticParams() {
  const params: Params[] = [];
  for (const l of locales) {
    for (const t of TRACKS) {
      for (const lsn of t.lessons) {
        params.push({ locale: l, track: t.slug, lesson: lsn.slug });
      }
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Params }) {
  if (!isLocale(params.locale)) return {};
  const found = getLesson(params.track, params.lesson);
  if (!found) return {};
  const title = found.lesson.title[params.locale as Locale];
  return { title: `${title} · Tickra` };
}

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams?: { mode?: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const found = getLesson(params.track, params.lesson);
  if (!found) notFound();
  const { track, lesson } = found;
  const content = getLessonContent(track, lesson);
  const neighbours = getNeighbours(track.slug, lesson.slug);
  const globalIndex = lessonGlobalIndex(track.slug, lesson.slug);
  const dict = await getDictionary(locale);
  const reviewMode = searchParams?.mode === 'review';

  const prefetchHrefs = [
    neighbours.next
      ? `/${locale}/learn/${neighbours.next.trackSlug}/${neighbours.next.lesson.slug}`
      : null,
    neighbours.prev
      ? `/${locale}/learn/${neighbours.prev.trackSlug}/${neighbours.prev.lesson.slug}`
      : null,
  ].filter((s): s is string => Boolean(s));

  return (
    <>
      <PrefetchNeighbours hrefs={prefetchHrefs} />
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <section className="border-b border-line">
          <Container as="div" className="py-16 md:py-24">
            <LessonRunner
              locale={locale}
              track={track}
              lesson={lesson}
              content={content}
              next={neighbours.next}
              globalIndex={globalIndex}
              total={totalLessons()}
              reviewMode={reviewMode}
            />
          </Container>
        </section>

        <section className="border-b border-line bg-elevated">
          <Container as="div" className="py-12 md:py-16">
            <LessonNotes lessonId={lesson.id} locale={locale} />
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
