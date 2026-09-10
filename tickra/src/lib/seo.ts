import type { Metadata } from 'next';
import type { Locale } from '@/lib/i18n/config';
import { SITE_URL, SITE_NAME } from '@/lib/site-url';

const copy: Record<Locale, { title: string; description: string }> = {
  en: {
    title: 'nkNOWTrade — Learn the markets, candle by candle',
    description:
      'A structured trading curriculum, from your first Japanese candle to institutional‑grade decision making. Ten‑minute lessons, real charts, daily streaks.',
  },
  fr: {
    title: 'nkNOWTrade — Apprenez les marchés, bougie après bougie',
    description:
      "Un parcours de trading structuré, de votre première bougie japonaise jusqu'à la prise de décision institutionnelle. Leçons de dix minutes, vrais graphiques, streaks quotidiens.",
  },
};

/**
 * Share-card image for a page, rendered on demand by /api/og.
 *
 * Only the editorial rooms were wired to it, so sharing the home page, the
 * pricing page or any lesson on Twitter, LinkedIn, Slack or WhatsApp produced
 * a blank card — `openGraph` declared no images at all, `twitter` asked for
 * `summary_large_image` with nothing to put in it, and public/ holds no
 * fallback beyond a favicon. Launch-day links looked broken.
 */
export function ogImage(title: string, locale: Locale, eyebrow?: string): string {
  const params = new URLSearchParams({ title, locale });
  if (eyebrow) params.set('eyebrow', eyebrow);
  return `${SITE_URL}/api/og?${params.toString()}`;
}

export function buildMetadata(locale: Locale): Metadata {
  const { title, description } = copy[locale];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${SITE_NAME}` },
    description,
    applicationName: SITE_NAME,
    formatDetection: { email: false, telephone: false, address: false },
    // NO `alternates` here, deliberately.
    //
    // This object is the ROOT layout's metadata, and Next merges it into every
    // page that does not override the field. A canonical of `/${locale}` here
    // therefore told Google that /fr/pricing, /en/about and all 222 lesson
    // pages were each duplicates of the locale home page — while the sitemap
    // offered ~470 URLs. Google resolves that contradiction by indexing two
    // pages and dropping the rest.
    //
    // With the field absent, a page without an explicit canonical is simply
    // self-canonical, which is correct. Pages that also want hreflang pairing
    // call `pageSeo()` below. See `canonical.test.ts`.
    openGraph: {
      type: 'website',
      // Same reasoning: an inherited absolute URL would label every share card
      // with the home page's address. `metadataBase` resolves per-page URLs.
      siteName: SITE_NAME,
      title,
      description,
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      images: [{ url: ogImage(title, locale), width: 1200, height: 630, alt: title }],
    },
    // No `creator` until a real handle exists: the old '@tickra' credited an
    // account that is not ours on every share card.
    twitter: { card: 'summary_large_image', title, description, images: [ogImage(title, locale)] },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    icons: { icon: '/favicon.svg' },
  };
}

/**
 * Canonical URL + hreflang pair for one page, given the path AFTER the locale
 * segment ('' for the locale home page, '/pricing', '/learn/forex-basics', …).
 *
 * Spread into a page's `metadata` / `generateMetadata` return value. Pages that
 * omit it are self-canonical, which is fine; this is what adds the FR↔EN
 * pairing so the two language versions are understood as translations of each
 * other rather than as competing duplicates.
 */
export function pageSeo(locale: Locale, path = '', title?: string): Metadata {
  const suffix = path && !path.startsWith('/') ? `/${path}` : path;
  const image = title ? ogImage(title, locale) : undefined;
  return {
    alternates: {
      canonical: `/${locale}${suffix}`,
      languages: { fr: `/fr${suffix}`, en: `/en${suffix}` },
    },
    openGraph: {
      url: `${SITE_URL}/${locale}${suffix}`,
      // Only override the inherited card when the page gives its own title —
      // otherwise the layout's site-level card is the right one.
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: title! }] } : {}),
    },
    ...(image ? { twitter: { images: [image] } } : {}),
  };
}
