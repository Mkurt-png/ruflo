type Props = {
  url: string;
  title: string;
  description: string;
  date: string;
  /** Optional last-modified ISO date. Falls back to `date` to give Google
   * a stable freshness signal without churn on every ISR revalidation. */
  dateModified?: string;
  author: string;
  image?: string;
  locale: 'fr' | 'en';
};

import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';

export function ArticleJsonLd({ url, title, description, date, dateModified, author, image, locale }: Props) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image ? [image] : [`${SITE_URL}/${locale}/opengraph-image`],
    datePublished: date,
    dateModified: dateModified ?? date,
    author: { '@type': 'Person', name: author },
    publisher: {
      '@type': 'Organization',
      name: 'Tickra',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(payload) }}
    />
  );
}
