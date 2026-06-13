type Props = {
  url: string;
  title: string;
  description: string;
  date: string;
  author: string;
  image?: string;
  locale: 'fr' | 'en';
};

import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';

export function ArticleJsonLd({ url, title, description, date, author, image, locale }: Props) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image ? [image] : [`${SITE_URL}/${locale}/opengraph-image`],
    datePublished: date,
    author: { '@type': 'Person', name: author },
    publisher: {
      '@type': 'Organization',
      name: 'Tickra',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-US',
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(payload) }}
    />
  );
}
