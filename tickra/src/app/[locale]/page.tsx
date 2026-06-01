import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Hero } from '@/components/sections/Hero';
// TICKRA-IMPROVEMENT: press-strip removed until real article URLs are available.
// To re-enable: uncomment the import + the <PressStrip /> below <Hero /> once
// real hrefs are wired in `src/components/sections/PressStrip.tsx`.
// import { PressStrip } from '@/components/sections/PressStrip';
import { Method } from '@/components/sections/Method';
import { BentoFeatures } from '@/components/sections/BentoFeatures';
import { CurriculumPreview } from '@/components/sections/CurriculumPreview';
import { WhyNotYoutube } from '@/components/sections/WhyNotYoutube';
import { Metrics } from '@/components/sections/Metrics';
import { Testimonials } from '@/components/sections/Testimonials';
import { BuiltBy } from '@/components/sections/BuiltBy';
import { Pricing } from '@/components/sections/Pricing';
import { SimulatorShowcase } from '@/components/sections/SimulatorShowcase';
import { Community } from '@/components/sections/Community';
import { Roadmap } from '@/components/sections/Roadmap';
import { WallOfWins } from '@/components/sections/WallOfWins';
import { ChangelogPing } from '@/components/sections/ChangelogPing';
import { Faq } from '@/components/sections/Faq';
import { Newsletter } from '@/components/sections/Newsletter';
import { CtaFinal } from '@/components/sections/CtaFinal';
import { Footer } from '@/components/sections/Footer';
import { HomeJsonLd } from '@/components/seo/HomeJsonLd';
import { PublicQuizSection } from '@/components/landing/PublicQuizSection';
import { EditorialPreview } from '@/components/landing/EditorialPreview';
// TICKRA-PHASE-6: MobileStickyCta now mounted globally in the layout.

export default async function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);

  return (
    <>
      <HomeJsonLd dict={dict} locale={params.locale} />
      <Navbar dict={dict} locale={params.locale} />
      <main id="main">
        <Hero dict={dict} locale={params.locale} />
        {/* TICKRA-IMPROVEMENT: <PressStrip /> hidden until real article links exist. */}
        <Method dict={dict} />
        <BentoFeatures dict={dict} />
        <PublicQuizSection locale={params.locale} />
        <CurriculumPreview dict={dict} locale={params.locale} />
        <WhyNotYoutube dict={dict} />
        <Metrics dict={dict} />
        <Testimonials dict={dict} />
        <BuiltBy dict={dict} />
        <Pricing dict={dict} locale={params.locale} />
        {/* TICKRA-FEATURE: simulator showcase teasing the Pro paper-trading tool. */}
        <SimulatorShowcase locale={params.locale} />
        <Community dict={dict} locale={params.locale} />
        <Roadmap dict={dict} />
        {/* TICKRA-PHASE-4: anonymised weekly wall-of-wins, transparent stats. */}
        <WallOfWins locale={params.locale} />
        {/* TICKRA-IMPROVEMENT: small "last product update" proof-of-life line. */}
        <ChangelogPing locale={params.locale} />
        <EditorialPreview locale={params.locale} />
        <Faq dict={dict} />
        <Newsletter dict={dict} locale={params.locale} />
        <CtaFinal dict={dict} locale={params.locale} />
      </main>
      <Footer dict={dict} locale={params.locale} />
    </>
  );
}
