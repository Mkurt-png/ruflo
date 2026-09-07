import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getSession } from '@/lib/auth/session';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { HomeJsonLd } from '@/components/seo/HomeJsonLd';
import { Overture } from '@/components/editorial/Overture';
import { Manifeste } from '@/components/editorial/Manifeste';
import { Archive } from '@/components/editorial/Archive';
import { PieceCalme } from '@/components/editorial/PieceCalme';
import { Epreuve } from '@/components/editorial/Epreuve';
import { Methode } from '@/components/editorial/Methode';
import { LePari } from '@/components/editorial/LePari';
import { Colophon } from '@/components/editorial/Colophon';
import { Bureau } from '@/components/bureau/Bureau';
import { pageSeo } from '@/lib/seo';

// Landing recomposed as an editorial sequence — seven "rooms" instead of
// the canonical Hero/Features/Testimonials stack. When the reader is
// signed in, the home becomes Le Bureau — their personal desk for the
// day. Anonymous visitors still get the editorial composition.

export const dynamic = 'force-dynamic';

// The home page is the one page that must carry an explicit canonical and the
// FR↔EN pairing: it is what gets linked to, and the two language versions are
// otherwise indistinguishable from duplicates. The root layout used to supply
// this — and supplied it to all ~470 pages, telling Google every one of them
// was the locale home page, which is why it was removed there. Here it is
// correct. Caught on a deployed preview: removing the wrong canonical had left
// the home page with none at all.
export function generateMetadata({ params }: { params: { locale: string } }) {
  return pageSeo(params.locale === 'en' ? 'en' : 'fr');
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const locale = params.locale;
  const session = getSession();

  if (session) {
    return (
      <>
        <Navbar dict={dict} locale={locale} />
        <Bureau locale={locale} email={session.email} />
        <Footer dict={dict} locale={locale} />
      </>
    );
  }

  return (
    <>
      <HomeJsonLd dict={dict} locale={locale} />
      <Navbar dict={dict} locale={locale} />
      <main id="main" className="bg-[#F4F1EA]">
        <Overture locale={locale} />
        <Manifeste locale={locale} />
        <Archive locale={locale} />
        <PieceCalme locale={locale} />
        <Epreuve locale={locale} />
        <Methode locale={locale} />
        <LePari locale={locale} />
        <Colophon locale={locale} />
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
