import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { getCrieeForDate } from '@/lib/tickra/criee';
import { CrieeCard } from '@/components/criee/CrieeCard';
import { editorialMeta } from '@/lib/seo/editorial-meta';

// /[locale]/criee — the morning ritual room. A single page, identical
// for every visitor that day, that disappears at midnight UTC and is
// replaced by tomorrow's. Editorial register, ivory paper.

export const dynamic = 'force-dynamic';
export const metadata = editorialMeta({
  slug: 'criee',
  title: 'La Criée',
  description:
    'Une question, choisie pour le jour. La même pour tout le monde. Cinq minutes, dix au plus.',
});

const COPY = {
  fr: {
    eyebrow: 'La Criée — séance d’ouverture',
    head: ['Une bougie.', 'Une question.', 'Dix minutes.'] as [string, string, string],
  },
  en: {
    eyebrow: 'La Criée — opening session',
    head: ['One candle.', 'One question.', 'Ten minutes.'] as [string, string, string],
  },
} as const;

export default async function CrieePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const card = getCrieeForDate();
  const t = COPY[locale];

  const formattedDate = new Date(card.date).toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' },
  );

  return (
    <EditorialFrame
      dict={dict}
      locale={locale}
      eyebrow={t.eyebrow}
      status={formattedDate}
      head={t.head}
    >
      <div className="px-6 md:px-16 pb-32">
        <CrieeCard card={card} locale={locale} />
      </div>
    </EditorialFrame>
  );
}
