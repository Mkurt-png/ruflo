import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { SignInForm } from '@/components/auth/SignInForm';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'signin',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Connexion' : 'Sign in',
    description:
      params.locale === 'fr'
        ? 'Connexion à votre compte Tickra.'
        : 'Sign in to your Tickra account.',
    ogEyebrow: params.locale === 'fr' ? 'Tickra · Connexion' : 'Tickra · Sign in',
    noindex: true,
  });
}

export default async function SignInPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);

  return (
    <>
      <Navbar dict={dict} locale={params.locale} />
      <main id="main">
        <section className="border-b border-line">
          <Container as="div" className="py-24 md:py-32">
            <div className="mx-auto max-w-md">
              <SignInForm dict={dict} locale={params.locale} />
            </div>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={params.locale} />
    </>
  );
}
