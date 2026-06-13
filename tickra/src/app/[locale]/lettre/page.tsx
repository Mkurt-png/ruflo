import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { LettrePanel } from '@/components/lettre/LettrePanel';
import { editorialMeta } from '@/lib/seo/editorial-meta';

// /[locale]/lettre — La Lettre du dimanche. Editorial weekly digest
// composed locally from the reader's progress. Ivory paper register,
// no network, no charts.

export const revalidate = 3600;
export const metadata = editorialMeta({
  slug: 'lettre',
  title: 'La Lettre du dimanche',
  description:
    'Un bilan hebdomadaire éditorial, calculé localement à partir de votre progression. Lecture calme, dix minutes.',
});

const COPY = {
  fr: {
    eyebrow: 'La Lettre — bilan hebdomadaire',
    status: 'Lecture · ~10 min',
    head: ['Une semaine.', 'Trois colonnes.', 'Aucun bruit.'] as [string, string, string],
  },
  en: {
    eyebrow: 'The Letter — weekly digest',
    status: 'Read · ~10 min',
    head: ['One week.', 'Three columns.', 'No noise.'] as [string, string, string],
  },
} as const;

export default async function LettrePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  return (
    <EditorialFrame
      dict={dict}
      locale={locale}
      eyebrow={t.eyebrow}
      status={t.status}
      head={t.head}
    >
      <LettrePanel locale={locale} />
    </EditorialFrame>
  );
}
