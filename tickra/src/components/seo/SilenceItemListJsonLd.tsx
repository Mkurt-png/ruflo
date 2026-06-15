import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';

// SilenceItemList — emits a Schema.org ItemList of the UI patterns
// Tickra refuses to display, listed on /silence. Each entry is a
// CreativeWork carrying the banished pattern as name, the editorial
// reasoning as description and a stable #anchor URL. Pairs with the
// /refus catalogue and lets crawlers cite a single banished
// pattern rather than the whole interface manifesto.

export type SilenceEntry = {
  id: string;
  pattern: string;
  why: string;
  prose: string;
};

type Props = {
  entries: ReadonlyArray<SilenceEntry>;
  locale: 'fr' | 'en';
};

export function SilenceItemListJsonLd({ entries, locale }: Props) {
  const url = `${SITE_URL}/${locale}/silence`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name:
      locale === 'fr'
        ? 'Le Silence éditorial — patterns d’UI bannis'
        : 'The Editorial Silence — banished UI patterns',
    description:
      locale === 'fr'
        ? `${entries.length} patterns d’interface que Tickra ne déploiera pas.`
        : `${entries.length} interface patterns Tickra will not display.`,
    url,
    numberOfItems: entries.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: entries.map((entry, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CreativeWork',
        name: entry.pattern,
        description: `${entry.why} — ${entry.prose}`,
        identifier: entry.id,
        inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
        url: `${url}#${entry.id}`,
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
