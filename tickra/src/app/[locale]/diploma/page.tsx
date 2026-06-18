import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getSession } from '@/lib/auth/session';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { DiplomaCard } from '@/components/account/DiplomaCard';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'diploma',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Diplôme' : 'Diploma',
    description:
      params.locale === 'fr'
        ? 'L’attestation Tickra : ce qu’elle dit, ce qu’elle ne dit pas.'
        : 'The Tickra certificate: what it says, what it doesn’t.',
    ogEyebrow: params.locale === 'fr' ? 'Tickra · Diplôme' : 'Tickra · Diploma',
    // Per-user achievement page — gated by getSession; not indexable.
    noindex: true,
  });
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
