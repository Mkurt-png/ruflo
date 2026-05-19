import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return locales.map((locale) => ({
    url: `https://tickra.com/${locale}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: locale === 'en' ? 1 : 0.9,
  }));
}
