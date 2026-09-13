import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n/config';
import en from '@/lib/i18n/locales/en';
import fr from '@/lib/i18n/locales/fr';
import { TRACKS, lessonGlobalIndex } from '@/lib/curriculum/data';
import { isSeeded } from '@/lib/curriculum/lesson-content';
import { isLessonUnlocked, FREE_LESSON_LIMIT } from '@/lib/curriculum/entitlement';
import { SITE_URL as SITE } from '@/lib/site-url';

const routes = [
  { path: '', changeFrequency: 'monthly' as const, priority: 1 },
  { path: '/learn', changeFrequency: 'weekly' as const, priority: 0.95 },
  { path: '/curriculum', changeFrequency: 'monthly' as const, priority: 0.85 },
  { path: '/pricing', changeFrequency: 'monthly' as const, priority: 0.9 },
  { path: '/onboarding', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/about', changeFrequency: 'yearly' as const, priority: 0.5 },
  { path: '/contact', changeFrequency: 'yearly' as const, priority: 0.5 },
  { path: '/editorial', changeFrequency: 'weekly' as const, priority: 0.6 },
  { path: '/glossary', changeFrequency: 'monthly' as const, priority: 0.55 },
  { path: '/tools', changeFrequency: 'monthly' as const, priority: 0.55 },
  { path: '/changelog', changeFrequency: 'weekly' as const, priority: 0.4 },
  { path: '/community', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/leaderboard', changeFrequency: 'daily' as const, priority: 0.5 },
  { path: '/battle', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/placement', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/achievements', changeFrequency: 'monthly' as const, priority: 0.4 },
  { path: '/diploma', changeFrequency: 'monthly' as const, priority: 0.4 },
  { path: '/review', changeFrequency: 'weekly' as const, priority: 0.4 },
  { path: '/lesson/japanese-candles', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.2 },
  { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.2 },
  { path: '/risk', changeFrequency: 'yearly' as const, priority: 0.2 },
  { path: '/mentions-legales', changeFrequency: 'yearly' as const, priority: 0.2 },
  { path: '/cookies', changeFrequency: 'yearly' as const, priority: 0.2 },
  // The editorial cluster — rooms of La Maison
  { path: '/maison', changeFrequency: 'weekly' as const, priority: 0.85 },
  { path: '/criee', changeFrequency: 'daily' as const, priority: 0.8 },
  { path: '/lettre', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/veillee', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/voix', changeFrequency: 'monthly' as const, priority: 0.65 },
  { path: '/lexique', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/cercle', changeFrequency: 'weekly' as const, priority: 0.55 },
  { path: '/almanach', changeFrequency: 'daily' as const, priority: 0.7 },
  { path: '/annuaire', changeFrequency: 'weekly' as const, priority: 0.75 },
  { path: '/refus', changeFrequency: 'yearly' as const, priority: 0.6 },
  { path: '/erratum', changeFrequency: 'monthly' as const, priority: 0.55 },
  { path: '/cote-inversee', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/silence', changeFrequency: 'yearly' as const, priority: 0.55 },
  { path: '/etages', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/method', changeFrequency: 'monthly' as const, priority: 0.65 },
  { path: '/survie', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/journal', changeFrequency: 'weekly' as const, priority: 0.55 },
  // Preparation pages
  { path: '/bureau-partage', changeFrequency: 'monthly' as const, priority: 0.45 },
  { path: '/edition-lifetime', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/institutionnel', changeFrequency: 'monthly' as const, priority: 0.45 },
  { path: '/mecenat', changeFrequency: 'monthly' as const, priority: 0.45 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const main = locales.flatMap((locale) =>
    routes.map((r) => ({
      url: `${SITE}/${locale}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: locale === 'en' ? r.priority : r.priority * 0.9,
    })),
  );

  const articles = locales.flatMap((locale) => {
    const dict = locale === 'fr' ? fr : en;
    return Object.keys(dict.editorialArticles.posts).map((slug) => ({
      url: `${SITE}/${locale}/editorial/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: locale === 'en' ? 0.55 : 0.5,
    }));
  });

  const learn = locales.flatMap((locale) =>
    TRACKS.flatMap((track) => [
      {
        url: `${SITE}/${locale}/learn/${track.slug}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: locale === 'en' ? 0.7 : 0.65,
      },
      // Only lessons a search engine can actually READ.
      //
      // Two filters, for two different kinds of empty page:
      //
      //   isSeeded            — the other 64 lessons render a "Coming soon"
      //                         card. Nothing to index.
      //   isLessonUnlocked    — everything past the first FREE_LESSON_LIMIT
      //                         is behind the paywall. Fetched anonymously,
      //                         such a page returns about 1,300 characters,
      //                         nearly all of it navigation plus "Leçon
      //                         réservée à nkNOWTrade Pro" — measured on
      //                         production, not assumed.
      //
      // Submitting 316 near-identical pages that say the same nine words is
      // the textbook thin-content signal. It does not merely fail to rank
      // them: it spends the crawl budget of a week-old domain on pages with
      // nothing in them, and drags down how the site as a whole is judged.
      // The free lessons and the editorial articles are what has substance,
      // and they are what the crawler should spend its time on.
      //
      // The paywalled pages stay reachable and linked — they are simply not
      // advertised. Nothing here hides them; they are just not claimed as
      // content worth indexing, which is true.
      ...track.lessons
        .filter(
          (lesson) =>
            isSeeded(lesson.id) &&
            isLessonUnlocked(lessonGlobalIndex(track.slug, lesson.slug), 'free'),
        )
        .map((lesson) => ({
          url: `${SITE}/${locale}/learn/${track.slug}/${lesson.slug}`,
          lastModified: now,
          changeFrequency: 'monthly' as const,
          priority: locale === 'en' ? 0.5 : 0.45,
        })),
    ]),
  );

  return [...main, ...articles, ...learn];
}
