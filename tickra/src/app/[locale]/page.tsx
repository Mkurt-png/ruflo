import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Hero } from '@/components/sections/Hero';
import { Method } from '@/components/sections/Method';
import { BentoFeatures } from '@/components/sections/BentoFeatures';
import { Metrics } from '@/components/sections/Metrics';
import { Pricing } from '@/components/sections/Pricing';
import { Faq } from '@/components/sections/Faq';
import { CtaFinal } from '@/components/sections/CtaFinal';
import { Footer } from '@/components/sections/Footer';

export default async function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);

  return (
    <>
      <Navbar dict={dict} locale={params.locale} />
      <main id="main">
        <Hero dict={dict} locale={params.locale} />
        <Method dict={dict} />
        <BentoFeatures dict={dict} />
        <Metrics dict={dict} />
        <Pricing dict={dict} locale={params.locale} />
        <Faq dict={dict} />
        <CtaFinal dict={dict} locale={params.locale} />
      </main>
      <Footer dict={dict} locale={params.locale} />
    </>
  );
}
