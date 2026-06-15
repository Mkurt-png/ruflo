import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';
import { ERRATA } from '@/lib/tickra/erratum';

// ErratumItemList — emits a Schema.org ItemList of every public
// correction Tickra has logged on /erratum. Each entry is a
// Corrections-style Article carrying the date, the affected scope
// (lesson, criee, lettre, methode, site), and the body of the
// correction. Lets crawlers cite a single correction rather than
// the whole log.

const SCOPE_LABEL = {
  lesson: { fr: 'Leçon', en: 'Lesson' },
  criee: { fr: 'La Criée', en: 'The Criée' },
  lettre: { fr: 'La Lettre', en: 'The Letter' },
  methode: { fr: 'Méthode', en: 'Method' },
  site: { fr: 'Site', en: 'Site' },
} as const;

type Props = { locale: 'fr' | 'en' };

export function ErratumItemListJsonLd({ locale }: Props) {
  const url = `${SITE_URL}/${locale}/erratum`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: locale === 'fr' ? 'L’Erratum Tickra' : 'The Tickra Erratum',
    description:
      locale === 'fr'
        ? `${ERRATA.length} corrections publiques, datées, jamais retirées.`
        : `${ERRATA.length} public corrections, dated, never removed.`,
    url,
    numberOfItems: ERRATA.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: ERRATA.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Article',
        // Schema.org has no dedicated "correction notice" type, so we
        // tag the genre and reuse Article. Google understands this
        // shape for editorial corrections.
        genre: 'correction',
        headline: e.title[locale],
        articleSection: SCOPE_LABEL[e.scope][locale],
        description: e.body[locale],
        datePublished: e.date,
        dateModified: e.date,
        identifier: e.id,
        inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
        url: `${url}#${e.id}`,
        publisher: { '@type': 'Organization', name: 'Tickra', url: SITE_URL },
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
