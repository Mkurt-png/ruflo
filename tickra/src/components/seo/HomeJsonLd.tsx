import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';
import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';

export function HomeJsonLd({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const url = `${SITE_URL}/${locale}`;

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tickra',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    sameAs: [],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'hello@tickra.com',
        availableLanguage: ['English', 'French'],
      },
    ],
  };

  const course = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: locale === 'fr' ? 'Tickra — école de trading' : 'Tickra — trading school',
    description: dict.hero.body,
    provider: { '@type': 'Organization', name: 'Tickra', url: SITE_URL },
    // Match the en-GB hreflang used elsewhere on the site so search
    // engines see one consistent language matrix.
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
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
    name: 'Tickra Pro',
    description: dict.pricing.body,
    brand: { '@type': 'Brand', name: 'Tickra' },
    offers: dict.pricing.plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: plan.price.replace(/[^\d.,]/g, '').replace(',', '.'),
      priceCurrency: 'CAD',
      url: `${url}/pricing`,
      availability: 'https://schema.org/InStock',
    })),
  };

  const payload = [organization, course, faq, product];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(payload) }}
    />
  );
}
