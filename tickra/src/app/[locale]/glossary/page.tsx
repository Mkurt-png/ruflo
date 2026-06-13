import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { GlossaryClient } from '@/components/glossary/GlossaryClient';
import { GlossaryJsonLd } from '@/components/seo/GlossaryJsonLd';
import { GLOSSARY } from '@/lib/curriculum/glossary';
import { SITE_URL } from '@/lib/site-url';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  const title = params.locale === 'fr' ? 'Glossaire · Tickra' : 'Glossary · Tickra';
  const description =
    params.locale === 'fr'
      ? `${GLOSSARY.length} termes essentiels du trading, classés par thème, définis sans jargon inventé.`
      : `${GLOSSARY.length} essential trading terms, sorted by theme, defined without invented jargon.`;
  const canonical = `/${params.locale}/glossary`;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        'fr-FR': `${SITE_URL}/fr/glossary`,
        'en-GB': `${SITE_URL}/en/glossary`,
        'x-default': `${SITE_URL}/fr/glossary`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonical}`,
      siteName: 'Tickra',
      type: 'website',
      locale: params.locale === 'fr' ? 'fr_FR' : 'en_GB',
    },
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
      <GlossaryJsonLd locale={locale} />
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <PageHero eyebrow={locale === 'fr' ? 'Référence' : 'Reference'} title={title} body={body} />
        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-28">
            <GlossaryClient locale={locale} />
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
