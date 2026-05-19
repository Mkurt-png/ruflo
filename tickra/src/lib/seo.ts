import type { Metadata } from 'next';
import type { Locale } from '@/lib/i18n/config';

const SITE_URL = 'https://tickra.com';
const SITE_NAME = 'Tickra';

const copy: Record<Locale, { title: string; description: string }> = {
  en: {
    title: 'Tickra — Learn the markets, candle by candle',
    description:
      'A structured trading curriculum, from your first Japanese candle to institutional‑grade decision making. Ten‑minute lessons, real charts, daily streaks.',
  },
  fr: {
    title: 'Tickra — Apprenez les marchés, bougie après bougie',
    description:
      "Un parcours de trading structuré, de votre première bougie japonaise jusqu'à la prise de décision institutionnelle. Leçons de dix minutes, vrais graphiques, streaks quotidiens.",
  },
};

export function buildMetadata(locale: Locale): Metadata {
  const { title, description } = copy[locale];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${SITE_NAME}` },
    description,
    applicationName: SITE_NAME,
    formatDetection: { email: false, telephone: false, address: false },
    alternates: {
      canonical: `/${locale}`,
      languages: { en: '/en', fr: '/fr' },
    },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/${locale}`,
      siteName: SITE_NAME,
      title,
      description,
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
    },
    twitter: { card: 'summary_large_image', title, description, creator: '@tickra' },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    icons: { icon: '/favicon.svg' },
  };
}
