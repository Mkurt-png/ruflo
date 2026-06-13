import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';
import { SITE_URL } from '@/lib/site-url';

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
    name: 'Tickra — Trading curriculum',
    description: dict.hero.body,
    provider: { '@type': 'Organization', name: 'Tickra', sameAs: SITE_URL },
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

  // Defence-in-depth escape: blocks </script> breakouts and the
  // U+2028/U+2029 line separators that JSON.stringify alone won't
  // escape but which break a <script> block in older parsers.
  const json = JSON.stringify(payload)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/[\u2028]/g, '\\u2028')
    .replace(/[\u2029]/g, '\\u2029');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
