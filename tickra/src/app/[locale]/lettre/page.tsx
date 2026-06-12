import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { LettrePanel } from '@/components/lettre/LettrePanel';

// /[locale]/lettre — La Lettre du dimanche. Editorial weekly digest
// composed locally from the reader's progress. Ivory paper register,
// no network, no charts.

import { editorialMeta } from '@/lib/seo/editorial-meta';

export const revalidate = 3600;
export const metadata = editorialMeta({
  slug: 'lettre',
  title: 'La Lettre du dimanche',
  description:
    'Un bilan hebdomadaire éditorial, calculé localement à partir de votre progression. Lecture calme, dix minutes.',
});

export default async function LettrePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main" className="bg-[#F4F1EA] min-h-screen">
        <section
          className="relative"
          style={{ paddingTop: 'clamp(120px, 16vh, 200px)', paddingBottom: 'clamp(48px, 8vh, 96px)' }}
        >
          <header className="px-6 md:px-16 flex items-start justify-between gap-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
              {locale === 'fr' ? 'La Lettre — bilan hebdomadaire' : 'The Letter — weekly digest'}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/65">
              {locale === 'fr' ? 'Lecture · ~10 min' : 'Read · ~10 min'}
            </span>
          </header>

          <div className="mt-16 md:mt-24 px-6 md:px-16">
            <p
              className="font-display italic font-light text-[#0E0E0E] max-w-[1100px]"
              style={{ fontSize: 'clamp(40px, 6vw, 92px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}
            >
              {locale === 'fr' ? 'Une semaine.' : 'One week.'}
              <br />
              <span className="text-black/55">
                {locale === 'fr' ? 'Trois colonnes.' : 'Three columns.'}
              </span>
              <br />
              <span className="text-black/35">
                {locale === 'fr' ? 'Aucun bruit.' : 'No noise.'}
              </span>
            </p>
          </div>
        </section>

        <LettrePanel locale={locale} />
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
