import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';

// MaisonItemList — emits a Schema.org ItemList of every editorial
// room linked from /maison. Each entry is a CreativeWork pointing at
// the room's URL with its title and caption. Lets Google understand
// /maison as a structured catalogue rather than a flat HTML index.

export type MaisonRoom = {
  slug: string;
  title: { fr: string; en: string };
  caption: { fr: string; en: string };
};

type Props = {
  rooms: ReadonlyArray<MaisonRoom>;
  locale: 'fr' | 'en';
};

export function MaisonItemListJsonLd({ rooms, locale }: Props) {
  const url = `${SITE_URL}/${locale}/maison`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: locale === 'fr' ? 'Les pièces de La Maison Tickra' : 'The rooms of La Maison Tickra',
    description:
      locale === 'fr'
        ? `Catalogue des ${rooms.length} pièces éditoriales de La Maison.`
        : `Catalogue of La Maison's ${rooms.length} editorial rooms.`,
    url,
    numberOfItems: rooms.length,
    itemListElement: rooms.map((room, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CreativeWork',
        name: room.title[locale],
        description: room.caption[locale],
        url: `${SITE_URL}/${locale}/${room.slug}`,
        inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
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
