import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { PlacementTest } from '@/components/onboarding/PlacementTest';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'onboarding',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Test de niveau' : 'Placement Test',
    description:
      params.locale === 'fr'
        ? 'Un test de quelques minutes qui choisit la piste où commencer.'
        : 'A few-minute test that picks the track where to start.',
    ogEyebrow: params.locale === 'fr' ? 'Tickra · Test de niveau' : 'Tickra · Placement test',
  });
}

export default async function OnboardingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.onboarding;

  return (
    <>
      <Navbar dict={dict} locale={params.locale} />
      <main id="main">
        <section className="border-b border-line">
          <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-10 pb-20 pt-16 md:pb-28 md:pt-24">
            <div className="col-span-12 lg:col-span-5">
              <Eyebrow>{t.title}</Eyebrow>
              <h1 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
                {t.title}
              </h1>
              <p className="mt-6 max-w-md text-pretty text-[17px] leading-relaxed text-muted md:text-lg">
                {t.subtitle}
              </p>
            </div>

            <div className="col-span-12 lg:col-span-7">
              <PlacementTest dict={dict} locale={params.locale} />
            </div>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={params.locale} />
    </>
  );
}
