import type { Metadata } from 'next';
import type { Locale } from '@/lib/i18n/config';
import { SITE_URL, SITE_NAME } from '@/lib/site-url';

const copy: Record<Locale, { title: string; description: string }> = {
  en: {
    title: 'Tickra — the editorial house of trading',
    description:
      'A daily Criée, a Sunday Letter, a living Lexicon. Trading taught as a craft — slow, written, without fanfare.',
  },
  fr: {
    title: 'Tickra — la maison éditoriale du trading',
    description:
      'Une Criée chaque jour, une Lettre chaque dimanche, un Lexique qui s’ouvre au clic. Le trading enseigné comme un métier — lent, écrit, sans fanfare.',
  },
};

export function buildMetadata(locale: Locale): Metadata {
  const { title, description } = copy[locale];
  // Build a root share card via /api/og so the homepage gets the same
  // editorial preview every editorial room already enjoys.
  const ogParams = new URLSearchParams({
    title: locale === 'fr' ? 'La maison éditoriale du trading' : 'The editorial house of trading',
    eyebrow: locale === 'fr' ? 'Tickra · La Maison' : 'Tickra · The House',
    locale,
  });
  const ogImage = `${SITE_URL}/api/og?${ogParams.toString()}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${SITE_NAME}` },
    description,
    applicationName: SITE_NAME,
    formatDetection: { email: false, telephone: false, address: false },
    alternates: {
      canonical: `/${locale}`,
      // Match the hreflang convention used by editorialMeta — explicit
      // language-region tags plus an x-default that points at the
      // French version (Tickra's primary tongue).
      languages: {
        'fr-FR': '/fr',
        'en-GB': '/en',
        'x-default': '/fr',
      },
    },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/${locale}`,
      siteName: SITE_NAME,
      title,
      description,
      locale: locale === 'fr' ? 'fr_FR' : 'en_GB',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@tickra',
      creator: '@tickra',
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    icons: { icon: '/favicon.svg' },
  };
}
