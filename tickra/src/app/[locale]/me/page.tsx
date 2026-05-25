import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getSession } from '@/lib/auth/session';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { AccountPanel } from '@/components/account/AccountPanel';

export const metadata = { title: 'Mon compte · Tickra' };

export default async function MePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const session = getSession();
  if (!session) redirect(`/${locale}/signin?next=/me`);

  const dict = await getDictionary(locale);
  const title = locale === 'fr' ? 'Mon compte' : 'My account';
  const body =
    locale === 'fr'
      ? `Connecté en tant que ${session.email}. Gérez votre progression, vos abonnements et votre session.`
      : `Signed in as ${session.email}. Manage your progress, subscriptions and session.`;

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <PageHero eyebrow={locale === 'fr' ? 'Compte' : 'Account'} title={title} body={body} />
        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-28">
            <AccountPanel locale={locale} email={session.email} />
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
