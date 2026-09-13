import { EMAIL } from '@/lib/brand';
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
    // The canonical node for the operator. Anything else on the site that
    // needs to name the organisation references this @id instead of
    // restating it — two Organization blocks with different contents are two
    // entities as far as a parser is concerned.
    '@id': `${SITE_URL}/#organization`,
    name: 'nkNOWTrade',
    // A sole operator has no separate legal name — the person IS the entity,
    // so it is stated as the founder rather than as a company name.
    ...(ENTITY.kind === 'company' ? { legalName: ENTITY.legalName } : {}),
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description:
      'Plateforme de formation au trading et à l’analyse des marchés financiers. Cursus structuré, 10 minutes par jour, vrais graphiques.',
    // Checked against the record, not remembered: the first commit in this
    // repository is dated 2026-06-08 and nknowtrade.com was registered
    // 2026-09-06. It read '2025', which nothing supports. A founding date is
    // a factual claim, and this one is made to Google in structured data —
    // the one place a wrong date is asserted rather than merely written.
    foundingDate: '2026',
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
        email: EMAIL.support,
        availableLanguage: ['French', 'English'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'press',
        email: EMAIL.press,
      },
      {
        '@type': 'ContactPoint',
        contactType: 'privacy',
        email: EMAIL.privacy,
      },
    ],
    knowsAbout: ['Trading', 'Technical analysis', 'Risk management', 'Japanese candlesticks', 'Financial markets education'],
    areaServed: [
      { '@type': 'Country', name: 'Canada' },
      { '@type': 'Country', name: 'France' },
      { '@type': 'Country', name: 'United States' },
    ],
    // `sameAs` is a claim that these profiles ARE this organisation. The two
    // that were here pointed at @tickra handles from the old name — accounts
    // this operator does not hold, so the site was vouching for someone else's.
    // Left empty until real profiles exist; an absent claim beats a false one.
    sameAs: [] as string[],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default OrganizationJsonLd;
