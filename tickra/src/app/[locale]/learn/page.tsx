import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { totalLessons } from '@/lib/curriculum/data';
import { LessonResumeCard } from '@/components/learn/LessonResumeCard';
import { TrackFilter } from '@/components/learn/TrackFilter';

export const metadata = { title: 'Apprendre · Tickra' };

export default async function LearnPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);

  const title = locale === 'fr' ? 'Votre parcours.' : 'Your curriculum.';
  const body =
    locale === 'fr'
      ? `Onze pistes, ${totalLessons()} leçons, dix minutes par jour. Reprenez là où vous vous êtes arrêté, ou commencez la piste suivante.`
      : `Eleven tracks, ${totalLessons()} lessons, ten minutes a day. Pick up where you left off, or start the next track.`;

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <PageHero eyebrow={locale === 'fr' ? 'Apprendre' : 'Learn'} title={title} body={body} />

        <section className="border-b border-line">
          <Container as="div" className="pb-12 pt-12 md:pb-16 md:pt-16">
            <LessonResumeCard locale={locale} />
          </Container>
        </section>

        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-28">
            <TrackFilter locale={locale} />
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
