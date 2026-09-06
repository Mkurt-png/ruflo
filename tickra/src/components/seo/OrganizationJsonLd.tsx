import { SITE_URL } from '@/lib/site-url';
import { ENTITY } from '@/lib/legal/entity';

// Organization JSON-LD — global, mounted in the locale layout so it
// appears on every page. Tells Google / LLMs who the operator is, where it
// is, who runs it, and how to contact it. Improves rich-result eligibility
// and ChatGPT/Perplexity citation likelihood.

export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'kNOWTrade',
    // A sole operator has no separate legal name — the person IS the entity,
    // so it is stated as the founder rather than as a company name.
    ...(ENTITY.kind === 'company' ? { legalName: ENTITY.legalName } : {}),
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description:
      'Plateforme de formation au trading et à l’analyse des marchés financiers. Cursus structuré, 10 minutes par jour, vrais graphiques.',
    foundingDate: '2025',
    founders: [{ '@type': 'Person', name: ENTITY.legalName }],
    address: {
      '@type': 'PostalAddress',
      streetAddress: ENTITY.street,
      addressLocality: ENTITY.city,
      postalCode: ENTITY.postalCode,
      addressRegion: ENTITY.province,
      addressCountry: ENTITY.countryCode,
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
    areaServed: [
      { '@type': 'Country', name: 'Canada' },
      { '@type': 'Country', name: 'France' },
      { '@type': 'Country', name: 'United States' },
    ],
    sameAs: [
      'https://twitter.com/tickra',
      'https://www.linkedin.com/company/tickra',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default OrganizationJsonLd;
