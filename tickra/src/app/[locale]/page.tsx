import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
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

// Landing recomposed as an editorial sequence — seven "rooms" instead of
// the canonical Hero/Features/Testimonials stack. Underlying functionality
// (auth, routing, curriculum, pricing, quiz, account) is untouched; this
// file only changes the surface composition. The previous landing is kept
// at /[locale]/page.legacy.tsx.bak so nothing is destroyed.

export default async function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const locale = params.locale;

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
