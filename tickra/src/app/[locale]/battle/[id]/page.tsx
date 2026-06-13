import { redirect, notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getCurrentPlan } from '@/lib/auth/server-plan';
import { getBattle, computeScores } from '@/lib/db/battle-queries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { BattleRoom } from '@/components/battle/BattleRoom';
import { BattleJoin } from '@/components/battle/BattleJoin';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Battle · Tickra',
  // Live duel rooms are ephemeral and user-specific — never index.
  robots: { index: false, follow: false },
};

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
  const isHost = battle.host_email === email;
  const isGuest = battle.guest_email === email;
  const isParticipant = isHost || isGuest;

  const title = locale === 'fr' ? 'Battle en cours' : 'Battle in progress';
  const body =
    locale === 'fr'
      ? '5 questions, 20 secondes chacune. Le score combine justesse et vitesse.'
      : '5 questions, 20 seconds each. Score combines accuracy and speed.';

  const initial = {
    id: battle.id,
    hostEmail: battle.host_email,
    guestEmail: battle.guest_email,
    status: battle.status,
    currentIndex: battle.current_index,
    questions: battle.questions,
    hostAnswers: battle.host_answers,
    guestAnswers: battle.guest_answers,
    hostTimes: battle.host_times,
    guestTimes: battle.guest_times,
    createdAt: battle.created_at,
    startedAt: battle.started_at,
    finishedAt: battle.finished_at,
    scores: computeScores(battle),
  };

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <PageHero eyebrow={locale === 'fr' ? 'Pro · Battle' : 'Pro · Battle'} title={title} body={body} />
        <section className="border-b border-line">
          <Container as="div" className="py-12 md:py-20">
            {isParticipant ? (
              <BattleRoom
                locale={locale}
                viewerEmail={email}
                initial={initial}
              />
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
