import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';

// EditorialItemList — emits a Schema.org ItemList of every long-read
// listed on /editorial. Each entry is an Article carrying the title,
// excerpt, and canonical URL. Lets crawlers and LLMs enumerate the
// editorial journal as a structured catalogue rather than a flat
// HTML page.

export type EditorialEntry = {
  slug: string;
  title: string;
  excerpt: string;
};

type Props = {
  entries: ReadonlyArray<EditorialEntry>;
  locale: 'fr' | 'en';
};

export function EditorialItemListJsonLd({ entries, locale }: Props) {
  const url = `${SITE_URL}/${locale}/editorial`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name:
      locale === 'fr'
        ? 'Éditorial Tickra — articles longs'
        : 'Tickra Editorial — long reads',
    description:
      locale === 'fr'
        ? `Catalogue des ${entries.length} articles éditoriaux : marchés, risque, méthode.`
        : `Catalogue of ${entries.length} editorial articles: markets, risk, method.`,
    url,
    numberOfItems: entries.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: entries.map((entry, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Article',
        headline: entry.title,
        description: entry.excerpt,
        url: `${SITE_URL}/${locale}/editorial/${entry.slug}`,
        inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
        isPartOf: { '@type': 'Blog', name: 'Tickra Editorial' },
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
