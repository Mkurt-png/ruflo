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
import { pageMeta } from '@/lib/seo/page-meta';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'glossary',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Glossaire' : 'Glossary',
    description:
      params.locale === 'fr'
        ? `${GLOSSARY.length} termes essentiels du trading, classés par thème, définis sans jargon inventé.`
        : `${GLOSSARY.length} essential trading terms, sorted by theme, defined without invented jargon.`,
    ogEyebrow: params.locale === 'fr' ? 'Tickra · Glossaire' : 'Tickra · Glossary',
  });
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
