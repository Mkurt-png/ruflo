import { notFound, redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getSession } from '@/lib/auth/session';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { SimulatorApp } from '@/components/simulator/SimulatorApp';
import { FlashCrashMode } from '@/components/simulator/FlashCrashMode';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'me/simulator',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Simulateur' : 'Simulator',
    description:
      params.locale === 'fr'
        ? 'Le simulateur de trading Tickra — paper-trading sur des marchés réels, en local.'
        : 'Tickra’s trading simulator — paper trading on real markets, local.',
    ogEyebrow: params.locale === 'fr' ? 'Tickra · Simulateur' : 'Tickra · Simulator',
    noindex: true,
  });
}

export default async function SimulatorPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const session = getSession();
  if (!session) redirect(`/${locale}/signin?next=/${locale}/me/simulator`);

  const dict = await getDictionary(locale);
  const title = locale === 'fr' ? 'Simulateur de trading' : 'Trading simulator';
  const body =
    locale === 'fr'
      ? 'Compte démo à 10 000 $. Entraînez-vous à prendre des positions avec stops et take-profits, sans risquer un centime.'
      : 'Demo account with $10,000. Practise taking positions with stops and take-profits, without risking a dime.';

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <PageHero eyebrow={locale === 'fr' ? 'Pro · Lifetime' : 'Pro · Lifetime'} title={title} body={body} />
        <section className="border-b border-line">
          <Container as="div" className="py-12 md:py-16">
            <SimulatorApp locale={locale} />
          </Container>
        </section>

        {/* replay famous historical crashes for pedagogical value. */}
        <section className="border-b border-line bg-elevated">
          <Container as="div" className="py-12 md:py-16">
            <FlashCrashMode locale={locale} />
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
