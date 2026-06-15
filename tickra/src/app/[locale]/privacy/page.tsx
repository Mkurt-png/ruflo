import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { LegalPage } from '@/components/legal/LegalPage';
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'privacy',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Confidentialité' : 'Privacy',
    description:
      params.locale === 'fr'
        ? 'Comment Tickra traite vos données — sobrement, et avec une politique d’effacement publique.'
        : 'How Tickra handles your data — sparingly, with a public deletion policy.',
    ogEyebrow: params.locale === 'fr' ? 'Tickra · Confidentialité' : 'Tickra · Privacy',
  });
}

export default async function PrivacyPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  return (
    <>
      <PageBreadcrumb
        locale={params.locale}
        slug="privacy"
        title={{ fr: 'Confidentialité', en: 'Privacy' }}
      />
      <LegalPage dict={dict} locale={params.locale} which="privacy" />
    </>
  );
}
