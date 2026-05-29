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
  { path: '/signin', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.2 },
  { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.2 },
  { path: '/risk', changeFrequency: 'yearly' as const, priority: 0.2 },
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
