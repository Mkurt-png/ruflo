import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { SurvieCalculator } from '@/components/survie/SurvieCalculator';
import { editorialMeta } from '@/lib/seo/editorial-meta';

// /[locale]/survie — Le Calculateur de survie. A single page that does
// the pre-trade arithmetic in the editorial register. No SaaS card,
// no leaderboard, no upsell. Just the numbers that decide whether the
// account survives.

export const dynamic = 'force-dynamic';
export const metadata = editorialMeta({
  slug: 'survie',
  title: 'Le Calculateur de survie',
  description:
    'Taille de position, R-multiple, pertes consécutives jusqu’au demi-compte. Le calcul d’entrée de carnet, en silence.',
});

const COPY = {
  fr: {
    eyebrow: 'Le Calculateur — entrée du carnet',
    head: ['Avant l’ordre.', 'Quatre chiffres.', 'La taille honnête.'] as [string, string, string],
    intro:
      'Le calcul que la séance demande avant l’ouverture : taille de position, R-multiple, et combien de pertes consécutives le compte survit. Tout reste dans votre navigateur — aucun envoi.',
  },
  en: {
    eyebrow: 'The Calculator — ledger entry',
    head: ['Before the order.', 'Four numbers.', 'The honest size.'] as [string, string, string],
    intro:
      'The arithmetic the session asks for before opening: position size, R-multiple, and how many consecutive losses the account survives. Everything stays in your browser — nothing sent.',
  },
} as const;

export default async function SurviePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  return (
    <EditorialFrame
      dict={dict}
      locale={locale}
      eyebrow={t.eyebrow}
      status={locale === 'fr' ? 'Local · navigateur' : 'Local · browser'}
      head={t.head}
      intro={t.intro}
    >
      <SurvieCalculator locale={locale} />
    </EditorialFrame>
  );
}
