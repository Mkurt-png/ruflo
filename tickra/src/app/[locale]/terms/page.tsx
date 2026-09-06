import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata = { title: 'CGU · kNOWTrade' };

export default async function TermsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  return <LegalPage dict={dict} locale={params.locale} which="terms" />;
}
