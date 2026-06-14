import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n/config';
import en from '@/lib/i18n/locales/en';
import fr from '@/lib/i18n/locales/fr';
import { TRACKS } from '@/lib/curriculum/data';
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
  // Marketing-grade sample lesson — public, indexable.
  { path: '/lesson/japanese-candles', changeFrequency: 'yearly' as const, priority: 0.6 },
  // /signin removed — robots.ts disallows it; sitemap entry would
  // contradict the disallow and trigger Search Console warnings.
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
  { path: '/recherche', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/rentree', changeFrequency: 'weekly' as const, priority: 0.55 },
  { path: '/refus', changeFrequency: 'yearly' as const, priority: 0.6 },
  { path: '/erratum', changeFrequency: 'monthly' as const, priority: 0.55 },
  { path: '/cote-inversee', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/silence', changeFrequency: 'yearly' as const, priority: 0.55 },
  { path: '/etages', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/method', changeFrequency: 'monthly' as const, priority: 0.65 },
  { path: '/survie', changeFrequency: 'monthly' as const, priority: 0.7 },
  // /journal is intentionally absent: robots.ts disallows it as a
  // private working surface; emitting it in the sitemap would
  // contradict that signal and trigger 'sitemap'd URL is blocked'
  // warnings in Search Console.
  { path: '/institutionnel', changeFrequency: 'monthly' as const, priority: 0.45 },
  // Candor-stub rooms (/bureau-partage, /edition-lifetime, /mecenat) are
  // intentionally absent: they emit `robots: noindex, follow` until the
  // service behind them ships. They stay linkable from /maison.
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
      ...track.lessons.map((lesson) => ({
        url: `${SITE}/${locale}/learn/${track.slug}/${lesson.slug}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: locale === 'en' ? 0.5 : 0.45,
      })),
    ]),
  );

  return [...main, ...articles, ...learn];
}
