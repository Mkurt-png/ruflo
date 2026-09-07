import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { LegalPage } from '@/components/legal/LegalPage';
import { pageSeo } from '@/lib/seo';

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale = params.locale === 'en' ? 'en' : 'fr';
  return {
    title: locale === 'fr' ? 'CGU' : 'Terms',
    ...pageSeo(locale, '/terms', locale === 'fr' ? 'CGU' : 'Terms'),
  };
}

export default async function TermsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  return <LegalPage dict={dict} locale={params.locale} which="terms" />;
}
