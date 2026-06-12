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
      name: 'Tickra',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Tickra',
      url: SITE_URL,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default EditorialJsonLd;
