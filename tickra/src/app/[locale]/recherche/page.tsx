import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { RechercheClient } from '@/components/recherche/RechercheClient';
import { SEARCH_INDEX } from '@/lib/tickra/recherche-index';
import { editorialMeta } from '@/lib/seo/editorial-meta';

export const revalidate = 86400;
export const metadata = editorialMeta({
  slug: 'recherche',
  title: 'Recherche',
  description:
    'Une boîte de recherche. Leçons, pièces éditoriales, glossaire — tout est indexé localement, rien ne quitte votre navigateur.',
});

const COPY = {
  fr: {
    eyebrow: 'La Recherche — boîte vide',
    head1: 'Une boîte.',
    head2: 'Tout indexé.',
    head3: 'Aucun envoi.',
  },
  en: {
    eyebrow: 'The Search — empty box',
    head1: 'One box.',
    head2: 'All indexed.',
    head3: 'Nothing sent.',
  },
} as const;

export default async function RecherchePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main" className="bg-[#F4F1EA] min-h-screen">
        <section
          className="relative px-6 md:px-16"
          style={{ paddingTop: 'clamp(120px, 16vh, 200px)', paddingBottom: 'clamp(24px, 4vh, 48px)' }}
        >
          <header className="flex items-baseline justify-between gap-6 border-b border-black/15 pb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
              {t.eyebrow}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/65 tabular-nums">
              {SEARCH_INDEX.length} {locale === 'fr' ? 'entrées' : 'entries'}
            </span>
          </header>

          <div className="mt-16 md:mt-20 max-w-[1100px]">
            <h1
              className="font-display italic font-light text-[#0E0E0E]"
              style={{ fontSize: 'clamp(40px, 6vw, 92px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}
            >
              {t.head1}
              <br />
              <span className="text-black/55">{t.head2}</span>
              <br />
              <span className="text-black/35">{t.head3}</span>
            </h1>
          </div>
        </section>

        <RechercheClient index={SEARCH_INDEX} locale={locale} />
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
