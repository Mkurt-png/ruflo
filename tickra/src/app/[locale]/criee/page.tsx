import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { getCrieeForDate } from '@/lib/tickra/criee';
import { CrieeCard } from '@/components/criee/CrieeCard';

// /[locale]/criee — the morning ritual room. A single page, identical
// for every visitor that day, that disappears at midnight UTC and is
// replaced by tomorrow's. Editorial register, ivory paper.

import { editorialMeta } from '@/lib/seo/editorial-meta';

export const dynamic = 'force-dynamic';
export const metadata = editorialMeta({
  slug: 'criee',
  title: 'La Criée',
  description:
    'Une question, choisie pour le jour. La même pour tout le monde. Cinq minutes, dix au plus.',
});

export default async function CrieePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const card = getCrieeForDate();

  const formattedDate = new Date(card.date).toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' },
  );

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main" className="bg-[#F4F1EA] min-h-screen">
        <section className="relative" style={{ paddingTop: 'clamp(120px, 16vh, 200px)', paddingBottom: 'clamp(120px, 18vh, 220px)' }}>
          <header className="px-6 md:px-16 flex items-start justify-between gap-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
              {locale === 'fr' ? 'La Criée — séance d’ouverture' : 'La Criée — opening session'}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/65 tabular-nums">
              {formattedDate}
            </span>
          </header>

          <div className="mt-16 md:mt-24 px-6 md:px-16">
            <p
              className="font-display italic font-light text-[#0E0E0E] max-w-[1100px]"
              style={{ fontSize: 'clamp(40px, 6vw, 92px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}
            >
              {locale === 'fr' ? 'Une bougie.' : 'One candle.'}<br />
              <span className="text-black/55">
                {locale === 'fr' ? 'Une question.' : 'One question.'}
              </span><br />
              <span className="text-black/35">
                {locale === 'fr' ? 'Dix minutes.' : 'Ten minutes.'}
              </span>
            </p>
          </div>

          <div className="mt-24 md:mt-32 px-6 md:px-16">
            <CrieeCard card={card} locale={locale} />
          </div>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
