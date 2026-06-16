import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { getWeeklyLeaderboard, type LeaderboardEntry } from '@/lib/db/leaderboard-queries';
import { KpiStrip, LivePulse } from '@/components/ui/KpiStrip';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'leaderboard',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Tableau' : 'Leaderboard',
    description:
      params.locale === 'fr'
        ? 'Le tableau hebdomadaire des lecteurs les plus assidus, anonymisé.'
        : 'Weekly board of the most consistent readers, anonymised.',
    ogEyebrow: params.locale === 'fr' ? 'Tickra · Tableau' : 'Tickra · Leaderboard',
  });
}
export const dynamic = 'force-dynamic';

const COPY = {
  fr: {
    eyebrow: '7 derniers jours',
    title: 'Tableau hebdomadaire',
    body: 'Meilleurs apprenants par XP gagnée et plus longue série en cours. Anonyme par défaut — activez l’apparition par nom dans vos paramètres.',
    topXp: 'XP maximale',
    topStreak: 'Plus longue série',
    ranked: 'Classés',
    window: 'Fenêtre',
    windowHint: 'glissante',
    weekly: 'hebdomadaire',
    topXpThisWeek: 'XP cette semaine',
    topStreaks: 'Meilleures séries',
    empty: 'Aucune entrée cette semaine.',
    anonTrader: (hash: string) => `Trader #${hash}`,
    days: 'j',
  },
  en: {
    eyebrow: 'Last 7 days',
    title: 'Weekly leaderboard',
    body: 'Top traders by XP earned and longest current streak. Anonymous by default — opt in from your account to appear by name.',
    topXp: 'Top XP',
    topStreak: 'Top Streak',
    ranked: 'Ranked',
    window: 'Window',
    windowHint: 'rolling',
    weekly: 'weekly',
    topXpThisWeek: 'Top XP this week',
    topStreaks: 'Top streaks',
    empty: 'No entries yet this week.',
    anonTrader: (hash: string) => `Trader #${hash}`,
    days: 'd',
  },
} as const;

export default async function LeaderboardPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const { topXp, topStreak } = await getWeeklyLeaderboard();
  const t = COPY[locale];

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-24">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              {t.eyebrow}
            </span>
            <h1 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink">
              {t.title}
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted">
              {t.body}
            </p>
          </Container>
        </section>

        <section>
          <Container as="div" className="py-8">
            <KpiStrip
              items={[
                { label: t.topXp, value: String(topXp[0]?.xp ?? 0), tone: 'brand' },
                { label: t.topStreak, value: `${topStreak[0]?.streak ?? 0}${t.days}`, tone: 'up' },
                { label: t.ranked, value: String(topXp.length + topStreak.length) },
                { label: t.window, value: `7${t.days}`, hint: t.windowHint },
              ]}
              trailing={<LivePulse label={t.weekly} />}
            />
          </Container>
          <Container as="div" className="pb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <LeaderboardColumn
              title={t.topXpThisWeek}
              metric="xp"
              entries={topXp}
              locale={locale}
              emptyLabel={t.empty}
              anonTrader={t.anonTrader}
              daysSuffix={t.days}
            />
            <LeaderboardColumn
              title={t.topStreaks}
              metric="streak"
              entries={topStreak}
              locale={locale}
              emptyLabel={t.empty}
              anonTrader={t.anonTrader}
              daysSuffix={t.days}
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
  emptyLabel,
  anonTrader,
  daysSuffix,
}: {
  title: string;
  metric: 'xp' | 'streak';
  entries: LeaderboardEntry[];
  locale: Locale;
  emptyLabel: string;
  anonTrader: (hash: string) => string;
  daysSuffix: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-canvas">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-display text-lg font-medium text-ink">{title}</h2>
      </div>
      {entries.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted">{emptyLabel}</p>
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
                    {e.displayName ?? anonTrader(e.anonHash)}
                  </Link>
                ) : (
                  <span className="text-sm text-muted truncate block">
                    {anonTrader(e.anonHash)}
                  </span>
                )}
              </div>
              <span className="font-mono text-sm text-ink">
                {metric === 'xp' ? `${e.xp} XP` : `${e.streak}${daysSuffix}`}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
