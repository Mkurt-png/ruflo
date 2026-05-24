import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Hero } from '@/components/sections/Hero';
import { Method } from '@/components/sections/Method';
import { BentoFeatures } from '@/components/sections/BentoFeatures';
import { CurriculumPreview } from '@/components/sections/CurriculumPreview';
import { WhyNotYoutube } from '@/components/sections/WhyNotYoutube';
import { Metrics } from '@/components/sections/Metrics';
import { Testimonials } from '@/components/sections/Testimonials';
import { BuiltBy } from '@/components/sections/BuiltBy';
import { Pricing } from '@/components/sections/Pricing';
import { Faq } from '@/components/sections/Faq';
import { Newsletter } from '@/components/sections/Newsletter';
import { CtaFinal } from '@/components/sections/CtaFinal';
import { Footer } from '@/components/sections/Footer';
import { HomeJsonLd } from '@/components/seo/HomeJsonLd';

export default async function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);

  return (
    <>
      <HomeJsonLd dict={dict} locale={params.locale} />
      <Navbar dict={dict} locale={params.locale} />
      <main id="main">
        <Hero dict={dict} locale={params.locale} />
        <Method dict={dict} />
        <BentoFeatures dict={dict} />
        <CurriculumPreview dict={dict} locale={params.locale} />
        <WhyNotYoutube dict={dict} />
        <Metrics dict={dict} />
        <Testimonials dict={dict} />
        <BuiltBy dict={dict} />
        <Pricing dict={dict} locale={params.locale} />
        <Faq dict={dict} />
        <Newsletter dict={dict} locale={params.locale} />
        <CtaFinal dict={dict} locale={params.locale} />
      </main>
      <Footer dict={dict} locale={params.locale} />
    </>
  );
}
