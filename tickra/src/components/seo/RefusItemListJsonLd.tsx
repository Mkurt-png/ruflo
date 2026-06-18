import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';
import { REFUSALS } from '@/lib/tickra/refus';

// RefusItemList — emits a Schema.org ItemList of the ten manifesto
// items on /refus. Each entry is a CreativeWork with the refusal
// title as name and the editorial reasoning as description. Lets
// crawlers and LLMs surface a single refused practice rather than
// the whole manifesto when a query is specific.

type Props = { locale: 'fr' | 'en' };

export function RefusItemListJsonLd({ locale }: Props) {
  const url = `${SITE_URL}/${locale}/refus`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: locale === 'fr' ? 'Le Refus — manifeste Tickra' : 'The Refusal — Tickra manifesto',
    description:
      locale === 'fr'
        ? `${REFUSALS.length} choses que Tickra ne construira jamais.`
        : `${REFUSALS.length} things Tickra will never build.`,
    url,
    numberOfItems: REFUSALS.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: REFUSALS.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CreativeWork',
        name: r.title[locale],
        description: r.why[locale],
        identifier: r.id,
        inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
        url: `${url}#${r.id}`,
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
