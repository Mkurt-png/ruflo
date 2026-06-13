import { redirect, notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getSession } from '@/lib/auth/session';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { SettingsPanel } from '@/components/account/SettingsPanel';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'me/settings',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Paramètres' : 'Settings',
    description:
      params.locale === 'fr'
        ? 'Vos préférences de compte — langue, thème, confidentialité.'
        : 'Your account preferences — language, theme, privacy.',
    noindex: true,
  });
}

export default async function SettingsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const session = getSession();
  if (!session) redirect(`/${locale}/signin?next=/me/settings`);
  const dict = await getDictionary(locale);

  const title = locale === 'fr' ? 'Paramètres' : 'Settings';
  const body =
    locale === 'fr'
      ? `Gérez votre profil, votre abonnement, vos préférences et la sécurité de votre compte.`
      : `Manage your profile, subscription, preferences and account security.`;

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <PageHero eyebrow={locale === 'fr' ? 'Compte' : 'Account'} title={title} body={body} />
        <section>
          <Container as="div" className="py-20 md:py-28">
            <SettingsPanel locale={locale} email={session.email} />
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
