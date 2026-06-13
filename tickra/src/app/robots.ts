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
        // /onboarding is public and crawlable — it's the funnel entry
        // for new readers. /signin is the only auth surface we want to
        // keep out of indexes; everything else is genuinely private.
        disallow: [
          '/api/',
          '/signin',
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
