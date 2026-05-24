import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Faq } from '@/components/sections/Faq';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { PricingTable } from '@/components/pricing/PricingTable';
import { PricingCompare } from '@/components/pricing/PricingCompare';
import { TrustBar } from '@/components/pricing/TrustBar';

export const metadata = { title: 'Tarifs · Tickra' };

export default async function PricingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.pricing;

  return (
    <>
      <Navbar dict={dict} locale={params.locale} />
      <main id="main">
        <section className="border-b border-line">
          <Container as="div" className="pb-12 pt-16 md:pb-16 md:pt-24">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h1 className="mt-6 max-w-3xl font-display text-display-lg font-medium tracking-tight text-balance text-ink">
              {t.title}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-[17px] leading-relaxed text-muted md:text-lg">
              {t.body}
            </p>
          </Container>

          <Container as="div" className="pb-20 md:pb-28">
            <PricingTable dict={dict} locale={params.locale} />
          </Container>
        </section>

        <section className="border-b border-line bg-elevated">
          <Container as="div" className="py-16 md:py-20">
            <TrustBar dict={dict} />
          </Container>
        </section>

        <section className="border-b border-line">
          <Container as="div" className="py-24 md:py-32">
            <PricingCompare dict={dict} />
          </Container>
        </section>

        <Faq dict={dict} />
      </main>
      <Footer dict={dict} locale={params.locale} />
    </>
  );
}
