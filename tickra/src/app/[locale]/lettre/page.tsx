import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { ReadNext } from '@/components/editorial/ReadNext';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';
import { RoomBreadcrumb } from '@/components/seo/RoomBreadcrumb';
import { LettrePanel } from '@/components/lettre/LettrePanel';
import { editorialPageMeta } from '@/lib/seo/editorial-meta';

// /[locale]/lettre — La Lettre du dimanche. Editorial weekly digest
// composed locally from the reader's progress. Ivory paper register,
// no network, no charts.

export const revalidate = 3600;
export const generateMetadata = editorialPageMeta({
  slug: 'lettre',
  title: { fr: 'La Lettre du dimanche', en: 'The Sunday Letter' },
  description: {
    fr: 'Un bilan hebdomadaire éditorial, calculé localement à partir de votre progression. Lecture calme, dix minutes.',
    en: 'An editorial weekly digest, computed locally from your progress. Calm reading, ten minutes.',
  },
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
    <>
      <EditorialJsonLd
        slug="lettre"
        title={locale === 'fr' ? 'La Lettre du dimanche' : 'The Sunday Letter'}
        description={locale === 'fr'
          ? 'Bilan hebdomadaire, calculé localement à partir de votre progression.'
          : 'Weekly digest computed locally from your progress.'}
        locale={locale}
      />
      <RoomBreadcrumb
        locale={locale}
        slug="lettre"
        title={{ fr: 'La Lettre du dimanche', en: 'The Sunday Letter' }}
      />
      <EditorialFrame
      dict={dict}
      locale={locale}
      eyebrow={t.eyebrow}
      status={t.status}
      head={t.head}
    >
      <LettrePanel locale={locale} />
      <ReadNext
        locale={locale}
        rooms={[
          {
            slug: 'rentree',
            title: { fr: 'Le Carnet d’absence', en: 'The Absence Register' },
            caption: {
              fr: 'Si vous revenez après plusieurs Lettres ratées.',
              en: 'If you return after missing several Letters.',
            },
          },
          {
            slug: 'cercle',
            title: { fr: 'Le Cercle de relecture', en: 'The Reading Circle' },
            caption: {
              fr: 'La Lettre d’un autre lecteur, en silence.',
              en: 'Another reader’s Letter, in silence.',
            },
          },
          {
            slug: 'veillee',
            title: { fr: 'La Veillée', en: 'The Vigil' },
            caption: {
              fr: 'La lecture commune du dimanche soir.',
              en: 'The shared Sunday-evening reading.',
            },
          },
        ]}
      />
    </EditorialFrame>
    </>
  );
}
