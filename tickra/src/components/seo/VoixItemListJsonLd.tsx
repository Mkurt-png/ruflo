import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';
import { VOIX } from '@/lib/tickra/voix';

// VoixItemList — emits a Schema.org ItemList of every monthly
// interview on /voix. Each entry is an Interview (Schema.org type)
// carrying the date, the pseudonymous interviewee and the signature
// pull-quote. Pseudonyms only — Tickra publishes no real names
// without written request. Lets crawlers cite a single voice
// rather than the whole series.

type Props = { locale: 'fr' | 'en' };

export function VoixItemListJsonLd({ locale }: Props) {
  const url = `${SITE_URL}/${locale}/voix`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: locale === 'fr' ? 'Les Voix — entretiens Tickra' : 'The Voices — Tickra interviews',
    description:
      locale === 'fr'
        ? `${VOIX.length} entretiens anonymes avec des traders en activité, un par mois.`
        : `${VOIX.length} anonymous interviews with working traders, one per month.`,
    url,
    numberOfItems: VOIX.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: VOIX.map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Interview',
        name: `${v.pseudonym} — ${v.craft[locale]}`,
        description: v.signature[locale],
        datePublished: v.date,
        identifier: v.id,
        inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
        url: `${url}#${v.id}`,
        interviewee: {
          '@type': 'Person',
          name: v.pseudonym,
          // Pseudonym is explicit so crawlers don't treat it as a real
          // identity. additionalType keeps the semantic clean.
          additionalName: locale === 'fr' ? 'pseudonyme' : 'pseudonym',
          address: { '@type': 'PostalAddress', addressLocality: v.city[locale] },
        },
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
