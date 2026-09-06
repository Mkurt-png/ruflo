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
import { CoteTicker } from '@/components/account/CoteTicker';
import { RituelBanner } from '@/components/rituel/RituelBanner';
import dynamic from 'next/dynamic';

const PortfolioStats3D = dynamic(
  () => import('@/components/sections/PortfolioStats3D').then((m) => m.PortfolioStats3D),
  { ssr: false, loading: () => <div className="w-full h-[320px]" aria-hidden /> },
);

export const metadata = { title: 'Mon compte · kNOWTrade' };

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

        {/* Personal stats column — circular histogram of bars pulsing
            around a central glow pillar. Different scene from the
            landing globe so each surface gets its own visual. */}
        <section className="relative bg-black text-white border-b border-white/10 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(0,230,118,0.10), transparent 65%)',
            }}
          />
          <div className="relative z-10 mx-auto w-full max-w-container px-6 md:px-10 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
              <div className="md:col-span-1">
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand">
                  {locale === 'fr' ? 'Votre progression' : 'Your progress'}
                </span>
                <h2 className="mt-3 font-display text-3xl md:text-4xl font-medium tracking-tight">
                  {locale === 'fr' ? 'Vos stats, en colonne.' : 'Your stats, stacked.'}
                </h2>
                <p className="mt-3 text-[14px] text-white/60 max-w-sm">
                  {locale === 'fr'
                    ? 'Chaque leçon, chaque trade, chaque battle alimente la colonne. La hauteur, c’est vous.'
                    : 'Every lesson, every trade, every battle feeds the column. The height is you.'}
                </p>
              </div>
              <div className="md:col-span-2">
                <PortfolioStats3D height={360} />
              </div>
            </div>
          </div>
        </section>

        {/* TICKRA-COTE: une note unique remplace l'écran de stats. Tout
            ce qui suit reste accessible mais cette cotation est le
            premier objet vu en arrivant sur le compte. */}
        <section className="border-b border-line">
          <Container as="div" className="py-12 md:py-16">
            <RituelBanner locale={locale} />
            <div className="mt-10" />
            <CoteTicker locale={locale} />
          </Container>
        </section>

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
