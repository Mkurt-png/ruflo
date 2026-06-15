import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';

// EtagesItemList — emits a Schema.org ItemList of the three floors
// described on /etages. Editorial register, not commercial: each
// entry is a CreativeWork carrying the floor's name and ambience,
// linked back through a #anchor so crawlers and LLMs can cite a
// single floor rather than the whole manifesto.

export type EtageEntry = {
  level: number;
  anchor: string;
  name: string;
  role: string;
  ambience: string;
};

type Props = {
  entries: ReadonlyArray<EtageEntry>;
  locale: 'fr' | 'en';
};

export function EtagesItemListJsonLd({ entries, locale }: Props) {
  const url = `${SITE_URL}/${locale}/etages`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: locale === 'fr' ? 'Les Étages — maison Tickra' : 'The Floors — Tickra house',
    description:
      locale === 'fr'
        ? `${entries.length} étages, pas trois colonnes — l’architecture de Tickra avant le tarif.`
        : `${entries.length} floors, not three columns — Tickra's architecture before the bill.`,
    url,
    numberOfItems: entries.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: entries.map((entry, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CreativeWork',
        name: `${entry.name} — ${entry.role}`,
        description: entry.ambience,
        identifier: entry.anchor,
        inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
        url: `${url}#${entry.anchor}`,
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
