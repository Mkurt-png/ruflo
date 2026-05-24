import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n/config';

const SITE = 'https://tickra.com';

const routes = [
  { path: '', changeFrequency: 'monthly' as const, priority: 1 },
  { path: '/pricing', changeFrequency: 'monthly' as const, priority: 0.9 },
  { path: '/onboarding', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/lesson/japanese-candles', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/about', changeFrequency: 'yearly' as const, priority: 0.5 },
  { path: '/contact', changeFrequency: 'yearly' as const, priority: 0.5 },
  { path: '/editorial', changeFrequency: 'weekly' as const, priority: 0.6 },
  { path: '/changelog', changeFrequency: 'weekly' as const, priority: 0.4 },
  { path: '/signin', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.2 },
  { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.2 },
  { path: '/risk', changeFrequency: 'yearly' as const, priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return locales.flatMap((locale) =>
    routes.map((r) => ({
      url: `${SITE}/${locale}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: locale === 'en' ? r.priority : r.priority * 0.9,
    })),
  );
}
