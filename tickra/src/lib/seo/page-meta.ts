// Generic page metadata helper for non-editorial-cluster pages.
//
// editorialMeta covers the editorial cluster (rooms of La Maison) and
// emits an /api/og share card by default. This helper is for plain
// utility pages — glossary, changelog, editorial list — that want
// the same hreflang/canonical/OG matrix without the share card.

import type { Metadata } from 'next';
import type { Locale } from '@/lib/i18n/config';
import { SITE_URL, SITE_NAME } from '@/lib/site-url';

export type PageMetaInput = {
  /** Path relative to the locale prefix, e.g. "glossary". */
  slug: string;
  /** Page title shown in the browser tab (without "· Tickra" suffix). */
  title: string;
  /** Short description used for OG and meta description. */
  description: string;
  /** Locale to anchor the canonical URL. */
  locale: Locale;
  /** OG type — defaults to 'website'. Set 'article' for long-form. */
  ogType?: 'website' | 'article';
  /**
   * When true, emits `robots: noindex, follow`. Use for auth/private
   * surfaces (/signin, /welcome, /me) and any page that should resolve
   * but not be indexed. Hreflang is still emitted so the language
   * matrix stays consistent.
   */
  noindex?: boolean;
};

export function pageMeta({
  slug,
  title,
  description,
  locale,
  ogType = 'website',
  noindex = false,
}: PageMetaInput): Metadata {
  const path = slug.startsWith('/') ? slug : `/${slug}`;
  const canonical = `/${locale}${path}`;
  return {
    title: `${title} · ${SITE_NAME}`,
    description,
    ...(noindex && { robots: { index: false, follow: true } }),
    alternates: {
      canonical,
      languages: {
        'fr-FR': `${SITE_URL}/fr${path}`,
        'en-GB': `${SITE_URL}/en${path}`,
        'x-default': `${SITE_URL}/fr${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonical}`,
      siteName: SITE_NAME,
      type: ogType,
      locale: locale === 'fr' ? 'fr_FR' : 'en_GB',
    },
  };
}
