import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // This was `allow: '/'` and nothing else, so every one of these was
        // fair game. None of them belong in a search index:
        //
        //   /api/            machine endpoints; some answer 405 to a GET,
        //                    which is what a crawler would index
        //   /me              signed-in account pages — a crawler sees the
        //                    signed-out shell, so what gets indexed is an
        //                    empty page under a title promising an account
        //   /welcome         post-purchase page, meaningless out of context
        //   /share/, /verify/, /u/…  semi-private links. A share token is
        //                    meant to be given to one person; indexing it
        //                    publishes it to everyone, and these URLs get
        //                    pasted into places crawlers read.
        //   /signin          nothing to rank for, and a login form in results
        //                    is the shape phishing pages imitate
        disallow: ['/api/', '/me', '/welcome', '/share/', '/verify/', '/signin'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
