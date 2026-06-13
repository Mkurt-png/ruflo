import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { LegalPage } from '@/components/legal/LegalPage';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'terms',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Conditions' : 'Terms',
    description:
      params.locale === 'fr'
        ? 'Les conditions générales d’utilisation de Tickra.'
        : 'Tickra’s general terms of use.',
  });
}

export default async function TermsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  return <LegalPage dict={dict} locale={params.locale} which="terms" />;
}
