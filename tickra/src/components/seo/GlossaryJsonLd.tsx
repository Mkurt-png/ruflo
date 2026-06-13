import { GLOSSARY } from '@/lib/curriculum/glossary';
import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';

// Schema.org DefinedTermSet — turns the static glossary into a
// machine-readable vocabulary. Google can surface individual terms as
// rich snippets and LLM crawlers gain a clean source for citations.

type Locale = 'fr' | 'en';

export function GlossaryJsonLd({ locale }: { locale: Locale }) {
  const url = `${SITE_URL}/${locale}/glossary`;
  const setName = locale === 'fr' ? 'Glossaire Tickra' : 'Tickra Glossary';
  const setDescription = locale === 'fr'
    ? 'Vocabulaire du trading — définitions courtes, sans jargon inventé.'
    : 'Trading vocabulary — short definitions, no invented jargon.';
  const inLanguage = locale === 'fr' ? 'fr-FR' : 'en-GB';

  const data = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: setName,
    description: setDescription,
    url,
    inLanguage,
    hasDefinedTerm: GLOSSARY.map((entry) => ({
      '@type': 'DefinedTerm',
      name: entry.term[locale],
      description: entry.definition[locale],
      inLanguage,
      termCode: entry.term.en.toLowerCase().replace(/\s+/g, '-'),
      inDefinedTermSet: url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

export default GlossaryJsonLd;
