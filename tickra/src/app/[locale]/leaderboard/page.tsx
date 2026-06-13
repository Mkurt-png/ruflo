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

// TODO i18n — leaderboard copy is English-only for now (Phase 4A).
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
  });
}
export const dynamic = 'force-dynamic';

export default async function LeaderboardPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const { topXp, topStreak } = await getWeeklyLeaderboard();

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-24">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              Last 7 days
            </span>
            <h1 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink">
              Weekly leaderboard
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted">
              Top traders by XP earned and longest current streak. Anonymous by default — opt in
              from your account to appear by name.
            </p>
          </Container>
        </section>

        <section>
          <Container as="div" className="py-8">
            <KpiStrip
              items={[
                { label: 'Top XP', value: String(topXp[0]?.xp ?? 0), tone: 'brand' },
                { label: 'Top Streak', value: `${topStreak[0]?.streak ?? 0}d`, tone: 'up' },
                { label: 'Ranked', value: String(topXp.length + topStreak.length) },
                { label: 'Window', value: '7d', hint: 'rolling' },
              ]}
              trailing={<LivePulse label="weekly" />}
            />
          </Container>
          <Container as="div" className="pb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <LeaderboardColumn
              title="Top XP this week"
              metric="xp"
              entries={topXp}
              locale={locale}
            />
            <LeaderboardColumn
              title="Top streaks"
              metric="streak"
              entries={topStreak}
              locale={locale}
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
}: {
  title: string;
  metric: 'xp' | 'streak';
  entries: LeaderboardEntry[];
  locale: Locale;
}) {
  return (
    <div className="rounded-xl border border-line bg-canvas">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-display text-lg font-medium text-ink">{title}</h2>
      </div>
      {entries.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted">No entries yet this week.</p>
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
                    {e.displayName ?? `Trader #${e.anonHash}`}
                  </Link>
                ) : (
                  <span className="text-sm text-muted truncate block">
                    Trader #{e.anonHash}
                  </span>
                )}
              </div>
              <span className="font-mono text-sm text-ink">
                {metric === 'xp' ? `${e.xp} XP` : `${e.streak}d`}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
