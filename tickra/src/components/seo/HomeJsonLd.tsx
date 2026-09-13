import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';
import { SITE_URL } from '@/lib/site-url';

export function HomeJsonLd({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const url = `${SITE_URL}/${locale}`;

  // No Organization block here on purpose.
  //
  // OrganizationJsonLd is mounted in the locale layout, so it is already on
  // this page — with the address, the founder and three contact points. A
  // second, thinner Organization emitted here made the home page assert two
  // unlinked entities for one site, and the thin one contradicted the full
  // one by omission. Everything below points at the layout's node by @id.
  const ORG_ID = `${SITE_URL}/#organization`;

  const course = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'nkNOWTrade — Trading curriculum',
    description: dict.hero.body,
    provider: { '@id': ORG_ID },
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-US',
    educationalLevel: 'Beginner to Advanced',
    url,
  };

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: dict.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'nkNOWTrade Pro',
    description: dict.pricing.body,
    brand: { '@type': 'Brand', name: 'nkNOWTrade' },
    offers: dict.pricing.plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: plan.price.replace(/[^\d.,]/g, '').replace(',', '.'),
      priceCurrency: 'CAD',
      url: `${url}/pricing`,
      availability: 'https://schema.org/InStock',
    })),
  };

  const payload = [course, faq, product];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
