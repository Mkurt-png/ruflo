import { redirect, notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getCurrentPlan } from '@/lib/auth/server-plan';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { BattleJoin } from '@/components/battle/BattleJoin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Battle · Tickra' };

export default async function BattleHubPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const { email, plan } = await getCurrentPlan();
  if (!email) redirect(`/${locale}/signin?next=/battle`);
  if (plan !== 'pro' && plan !== 'lifetime') redirect(`/${locale}/pricing`);

  const dict = await getDictionary(locale);
  const title = locale === 'fr' ? 'Battle mode' : 'Battle mode';
  const body =
    locale === 'fr'
      ? 'Affrontez un autre membre Pro sur 5 questions tirées au sort. Le plus rapide et le plus juste gagne.'
      : 'Take on another Pro member over 5 random questions. Fastest and most accurate wins.';

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <PageHero eyebrow={locale === 'fr' ? 'Pro' : 'Pro'} title={title} body={body} />
        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-28">
            <BattleJoin locale={locale} mode="create" />
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
