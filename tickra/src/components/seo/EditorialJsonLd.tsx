// EditorialJsonLd — renders a <script type="application/ld+json">
// Article schema for an editorial page. Server component, no
// hydration cost. Consumers pass slug, title, description and
// optional dates; the component composes the canonical URL itself.

import { SITE_URL } from '@/lib/site-url';

type Locale = 'fr' | 'en';

export function EditorialJsonLd({
  slug,
  title,
  description,
  locale,
  datePublished,
  dateModified,
}: {
  slug: string;
  title: string;
  description: string;
  locale: Locale;
  datePublished?: string;
  dateModified?: string;
}) {
  const path = slug.startsWith('/') ? slug : `/${slug}`;
  const url = `${SITE_URL}/${locale}${path}`;
  const now = new Date().toISOString();
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: datePublished ?? '2026-01-01T00:00:00.000Z',
    dateModified: dateModified ?? now,
    isAccessibleForFree: true,
    author: {
      '@type': 'Organization',
      name: 'kNOWTrade',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'kNOWTrade',
      url: SITE_URL,
    },
  };

  // Defence-in-depth: escape </script>, U+2028, U+2029 so future
  // callers cannot break out of the JSON-LD block if any prop ever
  // carries user-supplied content. JSON.stringify alone doesn't
  // handle these.
  const payload = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/[\u2028]/g, '\\u2028')
    .replace(/[\u2029]/g, '\\u2029');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}

export default EditorialJsonLd;
