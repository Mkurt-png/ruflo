import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { getWeeklyLeaderboard, type LeaderboardEntry } from '@/lib/db/leaderboard-queries';
import { KpiStrip, LivePulse } from '@/components/ui/KpiStrip';
import { pageSeo } from '@/lib/seo';

// TICKRA-FIX(i18n): this page carried a "TODO i18n — English-only for now"
// note and every string hardcoded in English, while sitting in the navbar's
// Explore menu. A French visitor clicked "Classement" and landed on a fully
// English page. Copy now lives in `copy` below, keyed by locale.
export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale = params.locale === 'en' ? 'en' : 'fr';
  return {
    title: locale === 'fr' ? 'Classement hebdomadaire' : 'Weekly leaderboard',
    ...pageSeo(locale, '/leaderboard', locale === 'fr' ? 'Classement hebdomadaire' : 'Weekly leaderboard'),
  };
}
const copy = {
  fr: {
    window: '7 derniers jours',
    title: 'Classement hebdomadaire',
    intro:
      'Les apprenants en tête par XP gagnés et par plus longue série en cours. ' +
      'Anonyme par défaut — activez l’affichage de votre nom depuis votre compte.',
    kpiXp: 'XP max',
    kpiStreak: 'Série max',
    kpiRanked: 'Classés',
    kpiWindow: 'Fenêtre',
    rolling: 'glissante',
    dayShort: 'j',
    columnXp: 'Meilleurs XP de la semaine',
    columnStreak: 'Plus longues séries',
    empty: 'Aucune entrée cette semaine pour l’instant.',
    anonTrader: 'Apprenant',
  },
  en: {
    window: 'Last 7 days',
    title: 'Weekly leaderboard',
    intro:
      'Top learners by XP earned and longest current streak. Anonymous by default — opt in ' +
      'from your account to appear by name.',
    kpiXp: 'Top XP',
    kpiStreak: 'Top streak',
    kpiRanked: 'Ranked',
    kpiWindow: 'Window',
    rolling: 'rolling',
    dayShort: 'd',
    columnXp: 'Top XP this week',
    columnStreak: 'Top streaks',
    empty: 'No entries yet this week.',
    anonTrader: 'Learner',
  },
} as const;

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const { topXp, topStreak } = await getWeeklyLeaderboard();
  const t = copy[locale];

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-24">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              {t.window}
            </span>
            <h1 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink">
              {t.title}
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted">
              {t.intro}
            </p>
          </Container>
        </section>

        <section>
          <Container as="div" className="py-8">
            <KpiStrip
              items={[
                { label: t.kpiXp, value: String(topXp[0]?.xp ?? 0), tone: 'brand' },
                { label: t.kpiStreak, value: `${topStreak[0]?.streak ?? 0}${t.dayShort}`, tone: 'up' },
                { label: t.kpiRanked, value: String(topXp.length + topStreak.length) },
                { label: t.kpiWindow, value: `7${t.dayShort}`, hint: t.rolling },
              ]}
              trailing={<LivePulse label="weekly" />}
            />
          </Container>
          <Container as="div" className="pb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <LeaderboardColumn
              title={t.columnXp}
              metric="xp"
              entries={topXp}
              locale={locale}
              t={t}
            />
            <LeaderboardColumn
              title={t.columnStreak}
              metric="streak"
              entries={topStreak}
              locale={locale}
              t={t}
            />
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}

function LeaderboardColumn({
  title,
  metric,
  entries,
  locale,
  t,
}: {
  title: string;
  metric: 'xp' | 'streak';
  entries: LeaderboardEntry[];
  locale: Locale;
  t: (typeof copy)[Locale];
}) {
  return (
    <div className="rounded-xl border border-line bg-canvas">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-display text-lg font-medium text-ink">{title}</h2>
      </div>
      {entries.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted">{t.empty}</p>
      ) : (
        <ol className="divide-y divide-line">
          {entries.map((e) => (
            <li key={`${metric}-${e.rank}-${e.anonHash}`} className="flex items-center px-5 py-3">
              <span className="w-8 font-mono text-sm text-muted">#{e.rank}</span>
              <div className="flex-1 min-w-0">
                {e.isPublic && e.slug ? (
                  <Link
                    href={`/${locale}/u/${e.slug}`}
                    className="text-sm font-medium text-ink hover:text-brand truncate block"
                  >
                    {e.displayName ?? `${t.anonTrader} #${e.anonHash}`}
                  </Link>
                ) : (
                  <span className="text-sm text-muted truncate block">
                    {t.anonTrader} #{e.anonHash}
                  </span>
                )}
              </div>
              <span className="font-mono text-sm text-ink">
                {metric === 'xp' ? `${e.xp} XP` : `${e.streak}${t.dayShort}`}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
