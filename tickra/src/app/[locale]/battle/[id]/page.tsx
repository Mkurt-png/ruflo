import { redirect, notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getCurrentPlan } from '@/lib/auth/server-plan';
import { getBattle } from '@/lib/db/battle-queries';
import { battleView, roleOf } from '@/lib/battle/view';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { BattleRoom } from '@/components/battle/BattleRoom';
import { BattleJoin } from '@/components/battle/BattleJoin';

export const dynamic = 'force-dynamic';
export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale = params.locale === 'en' ? 'en' : 'fr';
  return {
    title: locale === 'fr' ? 'Battle' : 'Battle',
  };
}

export default async function BattleRoomPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const { email, plan } = await getCurrentPlan();
  if (!email) redirect(`/${locale}/signin?next=/battle/${params.id}`);
  if (plan !== 'pro' && plan !== 'lifetime') redirect(`/${locale}/pricing`);

  const battle = await getBattle(params.id);
  if (!battle) notFound();

  const dict = await getDictionary(locale);
  const role = roleOf(battle, email);

  const title = locale === 'fr' ? 'Battle en cours' : 'Battle in progress';
  const body =
    locale === 'fr'
      ? '5 questions, 20 secondes chacune. Le score combine justesse et vitesse.'
      : '5 questions, 20 seconds each. Score combines accuracy and speed.';

  // The same view the API serves. This page used to assemble its own object
  // from the raw row — answer key and both email addresses included — and hand
  // it to the browser in the server-rendered payload.
  const initial = role ? battleView(battle, role) : null;

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <PageHero eyebrow={locale === 'fr' ? 'Pro · Battle' : 'Pro · Battle'} title={title} body={body} />
        <section className="border-b border-line">
          <Container as="div" className="py-12 md:py-20">
            {initial ? (
              <BattleRoom locale={locale} initial={initial} />
            ) : battle.status === 'waiting' ? (
              <BattleJoin locale={locale} mode="join" battleId={battle.id} />
            ) : (
              <p className="text-muted">
                {locale === 'fr'
                  ? 'Cette battle est en cours ou terminée. Vous n’en faites pas partie.'
                  : 'This battle is in progress or finished. You are not a participant.'}
              </p>
            )}
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
