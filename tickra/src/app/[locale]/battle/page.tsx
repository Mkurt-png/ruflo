import { redirect, notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getCurrentPlan } from '@/lib/auth/server-plan';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { BattleJoin } from '@/components/battle/BattleJoin';
import { KpiStrip, LivePulse } from '@/components/ui/KpiStrip';
import dynamic from 'next/dynamic';

const BattleArena3D = dynamic(
  () => import('@/components/sections/BattleArena3D').then((m) => m.BattleArena3D),
  { ssr: false, loading: () => <div className="w-full h-[460px]" aria-hidden /> },
);

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

        {/* Futuristic duel arena — two glowing avatars facing off across
            an energy beam with travelling pulses. */}
        <section className="relative bg-black text-white border-b border-white/10 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-55"
            style={{
              background:
                'radial-gradient(ellipse at 30% 50%, rgba(0,230,118,0.12), transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(255,99,102,0.10), transparent 60%)',
            }}
          />
          <div className="relative z-10 mx-auto w-full max-w-container px-6 md:px-10 py-10">
            <BattleArena3D height={420} />
          </div>
        </section>

        <section className="border-b border-line">
          <Container as="div" className="py-12 md:py-16">
            <KpiStrip
              className="mb-6"
              items={[
                { label: locale === 'fr' ? 'Questions' : 'Questions', value: '5', tone: 'brand' },
                { label: locale === 'fr' ? 'Timer' : 'Timer', value: '60s', hint: locale === 'fr' ? '/ question' : '/ question' },
                { label: locale === 'fr' ? 'Joueurs' : 'Players', value: '2', hint: '1v1' },
                { label: locale === 'fr' ? 'Format' : 'Format', value: locale === 'fr' ? 'BO5' : 'BO5', tone: 'up' },
              ]}
              trailing={<LivePulse label={locale === 'fr' ? 'salons ouverts' : 'rooms open'} />}
            />
            <BattleJoin locale={locale} mode="create" />
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
