import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { LegalPage } from '@/components/legal/LegalPage';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'risk',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Risque' : 'Risk',
    description:
      params.locale === 'fr'
        ? 'Avertissement sur les risques du trading. À lire avant tout ordre réel.'
        : 'Warning on trading risks. Read before any real order.',
    ogEyebrow: params.locale === 'fr' ? 'Tickra · Risque' : 'Tickra · Risk',
  });
}

export default async function RiskPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  return <LegalPage dict={dict} locale={params.locale} which="risk" />;
}
