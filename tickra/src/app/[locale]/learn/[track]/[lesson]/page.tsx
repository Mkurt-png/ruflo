import { notFound } from 'next/navigation';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { TRACKS, getLesson, getNeighbours, lessonGlobalIndex, totalLessons } from '@/lib/curriculum/data';
import { getLessonContent, isSeeded } from '@/lib/curriculum/lesson-content';
import { LessonRunner } from '@/components/learn/LessonRunner';
import { LessonNotes } from '@/components/learn/LessonNotes';
import { LessonFeedback } from '@/components/learn/LessonFeedback';
import { LessonAiQuiz } from '@/components/learn/LessonAiQuiz';
import { PrefetchNeighbours } from '@/components/learn/PrefetchNeighbours';
import { PaywallCard } from '@/components/learn/PaywallCard';
import { ComingSoonCard } from '@/components/learn/ComingSoonCard';
import { getCurrentPlan } from '@/lib/auth/server-plan';
import { isLessonUnlocked } from '@/lib/curriculum/entitlement';

// TICKRA-FIX(security): server-render only — was leaking full Pro lesson
// content into the SSR payload for unauthenticated users (paywall was client-
// only). Forcing dynamic so cookies() is available and we can gate server-side.
export const dynamic = 'force-dynamic';

type Params = { locale: string; track: string; lesson: string };

// TICKRA-FIX(security): no static params — paywalled pages must be SSR per
// request to read the session cookie. `locales` import kept for future use.
void locales;

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
  const neighbours = getNeighbours(track.slug, lesson.slug);
  const globalIndex = lessonGlobalIndex(track.slug, lesson.slug);
  const dict = await getDictionary(locale);
  const reviewMode = searchParams?.mode === 'review';
  const seeded = isSeeded(lesson.id);

  // TICKRA-FIX(security): server-side entitlement check — Pro lesson content
  // is never serialised into the payload for non-paying users.
  const { email, plan } = await getCurrentPlan();
  const unlocked = isLessonUnlocked(globalIndex, plan);
  const content = unlocked ? getLessonContent(track, lesson) : null;

  const firstFreeLesson = TRACKS[0]?.lessons[0];
  const fallbackFreeHref = firstFreeLesson
    ? `/${locale}/learn/${TRACKS[0].slug}/${firstFreeLesson.slug}`
    : `/${locale}/learn`;

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
            {!seeded ? (
              <ComingSoonCard
                locale={locale}
                trackHref={`/${locale}/learn/${track.slug}`}
                prevHref={
                  neighbours.prev
                    ? `/${locale}/learn/${neighbours.prev.trackSlug}/${neighbours.prev.lesson.slug}`
                    : null
                }
              />
            ) : !unlocked || !content ? (
              <PaywallCard
                locale={locale}
                signedIn={Boolean(email)}
                freeLessonHref={fallbackFreeHref}
              />
            ) : (
              <>
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
                <div className="mt-12 md:mt-16">
                  <LessonAiQuiz trackSlug={track.slug} lessonSlug={lesson.slug} locale={locale} />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <LessonNotes lessonId={lesson.id} locale={locale} />
                  <LessonFeedback lessonId={lesson.id} locale={locale} />
                </div>
              </>
            )}
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
