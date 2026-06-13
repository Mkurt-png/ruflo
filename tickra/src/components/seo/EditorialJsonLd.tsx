// EditorialJsonLd — renders a <script type="application/ld+json">
// Article schema for an editorial page. Server component, no
// hydration cost. Consumers pass slug, title, description and
// optional dates; the component composes the canonical URL itself.

import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';

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
  // Article schema needs an image for rich-result eligibility. Point
  // at the same /api/og card the OG/Twitter cards already use so the
  // preview stays consistent across surfaces.
  const ogParams = new URLSearchParams({ title, locale });
  const image = `${SITE_URL}/api/og?${ogParams.toString()}`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: [image],
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: datePublished ?? '2026-01-01T00:00:00.000Z',
    // When the caller doesn't pass an explicit dateModified, fall back
    // to datePublished rather than Date.now(). The latter changed on
    // every ISR revalidation and made Google's "page was updated"
    // heuristic fire even when the content was identical.
    dateModified: dateModified ?? datePublished ?? '2026-01-01T00:00:00.000Z',
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
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon.svg`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

export default EditorialJsonLd;
