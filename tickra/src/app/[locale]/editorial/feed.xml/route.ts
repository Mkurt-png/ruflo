import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { SITE_URL } from '@/lib/site-url';
import { buildRss, type RssItem } from '@/lib/seo/rss';

// TICKRA-PHASE-3: RSS 2.0 feed for the editorial cluster, per locale.
// GET /<locale>/editorial/feed.xml

export const dynamic = 'force-static';

export async function GET(_req: Request, { params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    return new Response('Not found', { status: 404 });
  }
  const locale = params.locale;
  const dict = await getDictionary(locale);
  const base = `${SITE_URL}/${locale}`;

  const items: RssItem[] = dict.editorial.posts.map((p) => {
    const parsed = new Date(p.date);
    return {
      title: p.title,
      link: `${base}/editorial/${p.slug}`,
      description: p.excerpt,
      guid: p.slug,
      pubDate: Number.isNaN(parsed.getTime()) ? undefined : parsed,
    };
  });

  const xml = buildRss({
    title: locale === 'fr' ? 'kNOWTrade — Éditorial' : 'kNOWTrade — Editorial',
    description:
      locale === 'fr'
        ? 'Essais et méthode kNOWTrade sur le trading, les marchés et la psychologie.'
        : 'kNOWTrade essays and method on trading, markets and psychology.',
    siteUrl: base,
    feedUrl: `${base}/editorial/feed.xml`,
    language: locale === 'fr' ? 'fr-FR' : 'en-US',
    items,
  });

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
