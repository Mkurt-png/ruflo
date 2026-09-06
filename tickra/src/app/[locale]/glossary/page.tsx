import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { GlossaryClient } from '@/components/glossary/GlossaryClient';
import { GlossaryFlashcards } from '@/components/glossary/GlossaryFlashcards';
import { GLOSSARY } from '@/lib/curriculum/glossary';
import { SITE_URL } from '@/lib/site-url';

const meta = {
  fr: {
    title: 'Glossaire',
    description: `${GLOSSARY.length} termes essentiels du trading, définis clairement et classés par thème, avec des cartes mémoire en répétition espacée pour les ancrer.`,
  },
  en: {
    title: 'Glossary',
    description: `${GLOSSARY.length} essential trading terms, clearly defined and sorted by theme, with spaced-repetition flashcards to make them stick.`,
  },
};

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'fr';
  const m = meta[locale];
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/glossary`,
      languages: { en: '/en/glossary', fr: '/fr/glossary' },
    },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/${locale}/glossary`,
      title: `${m.title} · Tickra`,
      description: m.description,
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
    },
    twitter: { card: 'summary_large_image', title: `${m.title} · Tickra`, description: m.description },
  };
}

export default async function GlossaryPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);

  const title = locale === 'fr' ? 'Glossaire' : 'Glossary';
  const body =
    locale === 'fr'
      ? `${GLOSSARY.length} termes essentiels du trading, classés par thème. Tickra n’invente pas de jargon — on définit le vrai vocabulaire des desks.`
      : `${GLOSSARY.length} essential trading terms, sorted by theme. Tickra does not invent jargon — we define the real desk vocabulary.`;

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <PageHero eyebrow={locale === 'fr' ? 'Référence' : 'Reference'} title={title} body={body} />
        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-28">
            <div className="mb-12">
              <GlossaryFlashcards locale={locale} />
            </div>
            <GlossaryClient locale={locale} />
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
