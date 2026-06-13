import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { CarnetClient } from '@/components/carnet/CarnetClient';
import { ReadNext } from '@/components/editorial/ReadNext';
import { editorialMeta } from '@/lib/seo/editorial-meta';

// /[locale]/rentree — Le Carnet d'absence. Refonte du Rituel de
// rentrée en page dédiée. Le banner sur /me reste l'entrée ; cette
// page est la lecture longue de ce qui s'est passé sans le lecteur.

export const dynamic = 'force-dynamic';
export const metadata = editorialMeta({
  slug: 'rentree',
  title: 'Le Carnet d’absence',
  description:
    'Ce qui s’est passé sans vous : Criées ratées, Lettres non lues, erreurs en attente. Local. Rien envoyé.',
});

const COPY = {
  fr: {
    eyebrow: 'Le Carnet d’absence — relecture',
    status: 'Local · navigateur',
    head: ['Ce qui s’est passé.', 'Sans vous.', 'Et où l’on reprend.'] as [string, string, string],
    intro:
      'Le carnet d’absence relit votre progression à votre place. Il dit combien de jours sont passés depuis votre dernier passage, quelles Criées vous avez ratées, combien de Lettres du dimanche vous n’avez pas lues, et où la prochaine leçon vous attend. Aucune connexion ne reste pour vous gronder ; le silence est intact.',
  },
  en: {
    eyebrow: 'The Absence Register — reread',
    status: 'Local · browser',
    head: ['What happened.', 'Without you.', 'And where we resume.'] as [string, string, string],
    intro:
      'The absence register rereads your progress in your place. It says how many days have passed since your last visit, which Criées you missed, how many Sunday Letters you did not read, and where the next lesson awaits. No notification stays to scold you; the silence remains intact.',
  },
} as const;

export default async function RentreePage({ params }: { params: { locale: string } }) {
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
      intro={t.intro}
    >
      <CarnetClient locale={locale} />
      <ReadNext
        locale={locale}
        rooms={[
          {
            slug: 'criee',
            title: { fr: 'La Criée', en: 'The Criée' },
            caption: {
              fr: 'La question d’aujourd’hui — celle que vous n’avez pas ratée.',
              en: 'Today’s question — the one you did not miss.',
            },
          },
          {
            slug: 'lettre',
            title: { fr: 'La Lettre du dimanche', en: 'The Sunday Letter' },
            caption: {
              fr: 'Le bilan de la semaine, prêt à être lu calmement.',
              en: 'This week’s digest, ready to read.',
            },
          },
          {
            slug: 'survie',
            title: { fr: 'Le Calculateur de survie', en: 'The Survival Calculator' },
            caption: {
              fr: 'Avant le prochain ordre : l’arithmétique d’entrée du carnet.',
              en: 'Before the next order: the ledger-entry arithmetic.',
            },
          },
        ]}
      />
    </EditorialFrame>
  );
}
