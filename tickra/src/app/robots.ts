import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Don't burn crawl budget on API, auth callbacks, private
        // surfaces, or the candor-stub rooms that already ship
        // robots: noindex via their metadata.
        disallow: [
          '/api/',
          '/signin',
          '/onboarding',
          '/welcome',
          '/me',
          '/me/',
          '/journal',
          '/share/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
