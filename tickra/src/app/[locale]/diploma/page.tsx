import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getSession } from '@/lib/auth/session';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { DiplomaCard } from '@/components/account/DiplomaCard';
import { pageSeo } from '@/lib/seo';

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale = params.locale === 'en' ? 'en' : 'fr';
  return {
    title: locale === 'fr' ? 'Diplôme' : 'Diploma',
    ...pageSeo(locale, '/diploma', locale === 'fr' ? 'Diplôme' : 'Diploma'),
  };
}

export default async function DiplomaPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const session = getSession();
  const dict = await getDictionary(locale);

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <section>
          <Container as="div" className="py-20 md:py-28">
            <DiplomaCard locale={locale} email={session?.email ?? null} />
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
