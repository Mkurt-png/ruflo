import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { TRACKS, totalLessons } from '@/lib/curriculum/data';
import { TrackProgress } from '@/components/learn/TrackProgress';

export const metadata = { title: 'Apprendre · Tickra' };

const levelLabel: Record<string, { fr: string; en: string }> = {
  foundations: { fr: 'Fondations', en: 'Foundations' },
  intermediate: { fr: 'Intermédiaire', en: 'Intermediate' },
  advanced: { fr: 'Avancé', en: 'Advanced' },
  mastery: { fr: 'Maîtrise', en: 'Mastery' },
};

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
          <Container as="div" className="py-20 md:py-28">
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {TRACKS.map((track) => (
                <li key={track.id}>
                  <Link
                    href={`/${locale}/learn/${track.slug}`}
                    className="group flex h-full flex-col justify-between rounded-sm border border-line bg-surface p-7 transition-colors hover:border-ink"
                  >
                    <div>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                          {levelLabel[track.level][locale]}
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
                          × {track.lessons.length}
                        </span>
                      </div>
                      <h2 className="mt-4 font-display text-2xl font-medium tracking-tight text-balance text-ink">
                        {track.title[locale]}
                      </h2>
                      <p className="mt-3 max-w-sm text-[14.5px] leading-relaxed text-muted">
                        {track.summary[locale]}
                      </p>
                    </div>
                    <div className="mt-8 flex items-end justify-between gap-4 border-t border-line pt-6">
                      <TrackProgress lessonIds={track.lessons.map((l) => l.id)} locale={locale} />
                      <ArrowRight
                        aria-hidden
                        className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                        strokeWidth={1.75}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
