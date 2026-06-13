import { SITE_URL } from '@/lib/site-url';

// Organization JSON-LD — global, mounted in the locale layout so it
// appears on every page. Tells Google / LLMs who Tickra SAS is, where it
// is, who runs it, and how to contact it. Improves rich-result eligibility
// and ChatGPT/Perplexity citation likelihood.

export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tickra',
    legalName: 'Tickra SAS',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description:
      'Maison éditoriale de trading. Une Criée chaque jour, une Lettre chaque dimanche, un Lexique vivant — métier enseigné comme un livre, sans fanfare.',
    foundingDate: '2025',
    founders: [{ '@type': 'Person', name: 'Hamza Kurt' }],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '12 rue de Paradis',
      postalCode: '75010',
      addressLocality: 'Paris',
      addressCountry: 'FR',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'hello@tickra.com',
        availableLanguage: ['French', 'English'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'press',
        email: 'press@tickra.com',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'privacy',
        email: 'privacy@tickra.com',
      },
    ],
    knowsAbout: ['Trading', 'Technical analysis', 'Risk management', 'Japanese candlesticks', 'Financial markets education'],
    areaServed: { '@type': 'Country', name: 'France' },
    sameAs: [
      'https://twitter.com/tickra',
      'https://www.linkedin.com/company/tickra',
    ],
  };

  // Mirror the defence-in-depth escape used by EditorialJsonLd: even
  // though every field above is currently a string literal, this block
  // is mounted on every page and any future caller adding user-derived
  // content shouldn't be able to break out of the <script>.
  const json = JSON.stringify(data)
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

export default OrganizationJsonLd;
