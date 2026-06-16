import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { TRACKS, getLesson, getNeighbours, lessonGlobalIndex, totalLessons } from '@/lib/curriculum/data';
import { getLessonContent, isSeeded } from '@/lib/curriculum/lesson-content';
import { LessonRunner } from '@/components/learn/LessonRunner';
import { LessonNotes } from '@/components/learn/LessonNotes';
import { LessonFeedback } from '@/components/learn/LessonFeedback';
import { PrefetchNeighbours } from '@/components/learn/PrefetchNeighbours';
import { PaywallCard } from '@/components/learn/PaywallCard';
import { ComingSoonCard } from '@/components/learn/ComingSoonCard';
import { getCurrentPlan } from '@/lib/auth/server-plan';
import { isLessonUnlocked } from '@/lib/curriculum/entitlement';
import { SITE_URL } from '@/lib/site-url';
import { LearningResourceJsonLd } from '@/components/seo/LearningResourceJsonLd';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';

// server-render only — was leaking full Pro lesson
// content into the SSR payload for unauthenticated users (paywall was client-
// only). Forcing dynamic so cookies() is available and we can gate server-side.
export const dynamic = 'force-dynamic';

type Params = { locale: string; track: string; lesson: string };

// no static params — paywalled pages must be SSR per request to read
// the session cookie.

export async function generateMetadata({ params }: { params: Params }) {
  if (!isLocale(params.locale)) return {};
  const found = getLesson(params.track, params.lesson);
  if (!found) return {};
  const locale = params.locale as Locale;
  const title = found.lesson.title[locale];
  const trackTitle = found.track.title[locale];
  // Unseeded lessons render a structured placeholder so the runtime
  // never breaks, but Google's Helpful Content System treats thin
  // placeholder pages as low-quality and may demote the whole site.
  // Keep them reachable for navigation, but out of the index until
  // they get real bodies in lesson-content.ts.
  const seeded = isSeeded(found.lesson.id);
  const description = locale === 'fr'
    ? `${title} — leçon Tickra de la piste ${trackTitle}.`
    : `${title} — Tickra lesson from the ${trackTitle} track.`;
  const path = `/learn/${params.track}/${params.lesson}`;
  const canonical = `/${locale}${path}`;
  // Custom OG card via /api/og — same edge-cached endpoint the editorial
  // cluster uses, so lesson shares carry an ivory paper preview with the
  // track name as the eyebrow.
  const ogImage = `${SITE_URL}/api/og?${new URLSearchParams({
    title,
    eyebrow: locale === 'fr' ? `Tickra · ${trackTitle}` : `Tickra · ${trackTitle}`,
    locale,
  }).toString()}`;
  return {
    title: `${title} · Tickra`,
    description,
    ...(!seeded && { robots: { index: false, follow: true } }),
    alternates: {
      canonical,
      languages: {
        'fr-FR': `${SITE_URL}/fr${path}`,
        'en-GB': `${SITE_URL}/en${path}`,
        'x-default': `${SITE_URL}/fr${path}`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}${canonical}`,
      siteName: 'Tickra',
      locale: locale === 'fr' ? 'fr_FR' : 'en_GB',
      alternateLocale: locale === 'fr' ? ['en_GB'] : ['fr_FR'],
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@tickra',
      creator: '@tickra',
      images: [ogImage],
    },
  };
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

  // server-side entitlement check — Pro lesson content
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
      <LearningResourceJsonLd
        trackSlug={track.slug}
        trackTitle={track.title[locale]}
        trackLevel={track.level}
        lessonSlug={lesson.slug}
        title={lesson.title[locale]}
        description={
          locale === 'fr'
            ? `Leçon Tickra de la piste ${track.title[locale]}.`
            : `Tickra lesson from the ${track.title[locale]} track.`
        }
        locale={locale}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Tickra', path: `/${locale}` },
          {
            name: locale === 'fr' ? 'Apprendre' : 'Learn',
            path: `/${locale}/learn`,
          },
          { name: track.title[locale], path: `/${locale}/learn/${track.slug}` },
          {
            name: lesson.title[locale],
            path: `/${locale}/learn/${track.slug}/${lesson.slug}`,
          },
        ]}
      />
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
                <div className="mt-12 grid grid-cols-1 gap-3 md:mt-16 md:grid-cols-2">
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
