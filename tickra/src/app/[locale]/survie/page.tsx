import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { SurvieCalculator } from '@/components/survie/SurvieCalculator';

// /[locale]/survie — Le Calculateur de survie. A single page that does
// the pre-trade arithmetic in the editorial register. No SaaS card,
// no leaderboard, no upsell. Just the numbers that decide whether the
// account survives.

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Le Calculateur de survie · Tickra',
  description:
    'Taille de position, R-multiple, pertes consécutives jusqu’au demi-compte. Le calcul d’entrée de carnet, en silence.',
};

export default async function SurviePage({ params }: { params: { locale: string } }) {
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
              {locale === 'fr' ? 'Le Calculateur — entrée du carnet' : 'The Calculator — ledger entry'}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/45">
              {locale === 'fr' ? 'Local · navigateur' : 'Local · browser'}
            </span>
          </header>

          <div className="mt-16 md:mt-24 px-6 md:px-16">
            <p
              className="font-display italic font-light text-[#0E0E0E] max-w-[1100px]"
              style={{ fontSize: 'clamp(40px, 6vw, 92px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}
            >
              {locale === 'fr' ? 'Avant l’ordre.' : 'Before the order.'}
              <br />
              <span className="text-black/55">
                {locale === 'fr' ? 'Quatre chiffres.' : 'Four numbers.'}
              </span>
              <br />
              <span className="text-black/35">
                {locale === 'fr' ? 'La taille honnête.' : 'The honest size.'}
              </span>
            </p>
          </div>
        </section>

        <SurvieCalculator locale={locale} />
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
