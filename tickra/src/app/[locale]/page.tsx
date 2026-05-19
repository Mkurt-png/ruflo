import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Hero } from '@/components/sections/Hero';

export default async function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);

  return (
    <>
      <Navbar dict={dict} locale={params.locale} />
      <main id="main">
        <Hero dict={dict} locale={params.locale} />
      </main>
    </>
  );
}
