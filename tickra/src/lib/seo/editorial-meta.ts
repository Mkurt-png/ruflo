// Shared metadata builder for the editorial cluster. Each room in
// La Maison uses this to publish a consistent OpenGraph + Twitter
// card, so link previews on Twitter / Discord / Slack / iMessage
// render the editorial title rather than the default Tickra share.

import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-url';

export type EditorialMetaInput = {
  /** Page slug relative to the locale prefix, e.g. "lettre". */
  slug: string;
  /** Page title in its primary language. "· Tickra" is appended. */
  title: string;
  /** Short page description, used for OG and Twitter. */
  description: string;
  /** Locale to anchor the canonical URL. Defaults to fr. */
  locale?: 'fr' | 'en';
};

export function editorialMeta({
  slug,
  title,
  description,
  locale = 'fr',
}: EditorialMetaInput): Metadata {
  const path = slug.startsWith('/') ? slug : `/${slug}`;
  const url = `${SITE_URL}/${locale}${path}`;
  // hreflang alternates: tell search engines that fr and en are
  // translations of the same page, plus an x-default fallback.
  const languages = {
    'fr-FR': `${SITE_URL}/fr${path}`,
    'en-GB': `${SITE_URL}/en${path}`,
    'x-default': `${SITE_URL}/fr${path}`,
  };
  return {
    title: `${title} · Tickra`,
    description,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      siteName: 'Tickra',
      locale: locale === 'fr' ? 'fr_FR' : 'en_GB',
      alternateLocale: locale === 'fr' ? ['en_GB'] : ['fr_FR'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
