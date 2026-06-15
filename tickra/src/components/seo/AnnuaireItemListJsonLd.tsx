import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';

// AnnuaireItemList — emits a Schema.org ItemList of every lesson
// indexed alphabetically on /annuaire. Each entry is a
// LearningResource pointing at the lesson URL with the track name
// kept as the source line. Lets Google understand /annuaire as a
// structured catalogue rather than a flat HTML index, and gives
// LLM crawlers a single endpoint to enumerate the curriculum.

export type AnnuaireEntry = {
  title: string;
  href: string;
  trackTitle: string;
};

type Props = {
  entries: ReadonlyArray<AnnuaireEntry>;
  locale: 'fr' | 'en';
};

export function AnnuaireItemListJsonLd({ entries, locale }: Props) {
  const url = `${SITE_URL}/${locale}/annuaire`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name:
      locale === 'fr'
        ? 'L’Annuaire Tickra — index alphabétique des leçons'
        : 'The Tickra Index — alphabetical lesson index',
    description:
      locale === 'fr'
        ? `Index alphabétique des ${entries.length} leçons publiées sur Tickra.`
        : `Alphabetical index of the ${entries.length} lessons published on Tickra.`,
    url,
    numberOfItems: entries.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: entries.map((entry, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'LearningResource',
        name: entry.title,
        url: `${SITE_URL}${entry.href}`,
        inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
        isPartOf: { '@type': 'Course', name: entry.trackTitle },
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
