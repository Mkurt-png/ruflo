import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';

// ChangelogItemList — emits a Schema.org ItemList of release notes
// for /changelog. Each entry is a TechArticle describing one
// version. Lets crawlers and LLMs cite a specific Tickra release
// rather than the whole page when a question is dated.

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  items: ReadonlyArray<string>;
};

type Props = {
  entries: ReadonlyArray<ChangelogEntry>;
  locale: 'fr' | 'en';
};

export function ChangelogItemListJsonLd({ entries, locale }: Props) {
  const url = `${SITE_URL}/${locale}/changelog`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: locale === 'fr' ? 'Journal des versions Tickra' : 'Tickra Changelog',
    description:
      locale === 'fr'
        ? `${entries.length} versions documentées, de la plus récente à la plus ancienne.`
        : `${entries.length} documented releases, newest to oldest.`,
    url,
    numberOfItems: entries.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: entries.map((entry, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'TechArticle',
        headline: `${entry.version} — ${entry.title}`,
        // Editorial date label as-is; Schema doesn't require ISO when
        // the field is `description`. Keeps the rendered page and the
        // structured data in lockstep.
        description: `${entry.date} · ${entry.items.join(' ')}`,
        inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
        url,
        isPartOf: {
          '@type': 'WebSite',
          name: 'Tickra',
          url: SITE_URL,
        },
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
