import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PlacementTest } from '@/components/placement/PlacementTest';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'placement',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Test de placement' : 'Placement Test',
    description:
      params.locale === 'fr'
        ? 'Évaluation rapide pour orienter vers la bonne piste du cursus.'
        : 'Quick assessment to route you to the right curriculum track.',
    ogEyebrow: params.locale === 'fr' ? 'Tickra · Test de placement' : 'Tickra · Placement',
  });
}

export default async function PlacementPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const copy = locale === 'fr'
    ? {
        eyebrow: '6 questions · 2 minutes',
        title: 'Trouvez le bon point de départ',
        body:
          'Un mini test de diagnostic. Pas de connexion requise. Nous routons votre apprentissage vers la piste qui colle à votre niveau actuel.',
      }
    : {
        eyebrow: '6 questions · 2 minutes',
        title: 'Find the right starting point',
        body:
          'A short diagnostic. No login required. We route your learning to the track that fits your current level.',
      };

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <section className="border-b border-line">
          <Container as="div" className="py-16 md:py-24">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              {copy.eyebrow}
            </span>
            <h1 className="mt-4 max-w-2xl font-display text-3xl md:text-4xl font-medium tracking-tight text-ink">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted">{copy.body}</p>
          </Container>
        </section>
        <section>
          <Container as="div" className="py-12">
            <div className="max-w-2xl">
              <PlacementTest locale={locale} />
            </div>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
