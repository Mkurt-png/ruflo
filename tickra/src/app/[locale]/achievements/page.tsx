import { notFound, redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getSession } from '@/lib/auth/session';
import { isDbConfigured, listProgress, listMistakes } from '@/lib/db/queries';
import {
  ACHIEVEMENTS,
  buildSnapshot,
  evaluateAll,
  type AchievementTone,
} from '@/lib/achievements/catalog';
import { listUnlocked, recordUnlocks } from '@/lib/db/achievements-queries';
import { Navbar } from '@/components/nav/Navbar';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { KpiStrip, LivePulse } from '@/components/ui/KpiStrip';

// Per-user achievement board — gated by getSession, never indexable.
export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'achievements',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Réussites' : 'Achievements',
    description:
      params.locale === 'fr'
        ? 'Vos jalons de lecture et d’apprentissage. Calculé localement.'
        : 'Your reading and learning milestones. Computed locally.',
    ogEyebrow: params.locale === 'fr' ? 'Tickra · Réussites' : 'Tickra · Achievements',
    noindex: true,
  });
}

export const dynamic = 'force-dynamic';

const TONE_STYLES: Record<AchievementTone, string> = {
  bronze: 'border-[#A97142] bg-[#A97142]/10 text-[#7B4F2E]',
  silver: 'border-[#A0A4AB] bg-[#A0A4AB]/10 text-[#5F6469]',
  gold: 'border-[#D4A017] bg-[#D4A017]/10 text-[#856200]',
  platinum: 'border-[#8DA3A8] bg-[#8DA3A8]/10 text-[#4A6470]',
};

export default async function AchievementsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);

  const session = getSession();
  if (!session) redirect(`/${locale}/signin`);

  const unlockedMap = new Map<string, string>();
  if (isDbConfigured()) {
    const [progress, mistakes, known] = await Promise.all([
      listProgress(session.email),
      listMistakes(session.email),
      listUnlocked(session.email),
    ]);
    for (const u of known) unlockedMap.set(u.achievement_id, u.unlocked_at);
    // Re-evaluate now so clock-based ones (streaks) catch up.
    const snapshot = buildSnapshot({ progress, mistakes });
    const earned = evaluateAll(snapshot);
    const fresh = await recordUnlocks(session.email, earned);
    const nowIso = new Date().toISOString();
    for (const id of fresh) unlockedMap.set(id, nowIso);
  }

  const t = COPY[locale];
  const totalUnlocked = unlockedMap.size;

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main className="mx-auto w-full max-w-4xl px-6 py-12 md:py-16">
        <header className="mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
            {t.eyebrow}
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium text-ink md:text-4xl">
            {t.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{t.body}</p>
        </header>

        <KpiStrip
          className="mb-8"
          items={[
            { label: locale === 'fr' ? 'Débloqués' : 'Unlocked', value: String(totalUnlocked), tone: 'brand', hint: `/ ${ACHIEVEMENTS.length}` },
            { label: locale === 'fr' ? 'Restants' : 'Locked', value: String(ACHIEVEMENTS.length - totalUnlocked) },
            { label: locale === 'fr' ? 'Progression' : 'Progress', value: `${Math.round((totalUnlocked / Math.max(1, ACHIEVEMENTS.length)) * 100)}%`, tone: totalUnlocked > 0 ? 'up' : 'neutral' },
            { label: locale === 'fr' ? 'Total' : 'Total', value: String(ACHIEVEMENTS.length) },
          ]}
          trailing={<LivePulse label={locale === 'fr' ? 'à jour' : 'synced'} />}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const unlockedAt = unlockedMap.get(a.id);
            const isUnlocked = !!unlockedAt;
            return (
              <article
                key={a.id}
                className={`rounded-2xl border p-5 transition ${
                  isUnlocked
                    ? `${TONE_STYLES[a.tone]} border-2`
                    : 'border-line bg-surface opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                      isUnlocked ? 'bg-ink text-canvas' : 'bg-line text-muted'
                    }`}
                    aria-hidden
                  >
                    {isUnlocked ? '🏆' : '🔒'}
                  </span>
                  <span className="rounded-full bg-canvas/70 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-subtle">
                    {a.tone}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-medium text-ink">
                  {a.title[locale]}
                </h3>
                <p className="mt-1 text-sm text-muted">{a.description[locale]}</p>
                {isUnlocked ? (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-subtle">
                    {t.unlockedAt}{' '}
                    {new Date(unlockedAt!).toLocaleDateString(
                      locale === 'fr' ? 'fr-FR' : 'en-US',
                    )}
                  </p>
                ) : (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-subtle">
                    {t.locked}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </main>
    </>
  );
}

const COPY = {
  fr: {
    eyebrow: 'Récompenses · Discipline',
    title: 'Vos succès',
    body: 'Les succès se débloquent automatiquement quand vous progressez. Le but n’est pas la performance — c’est la régularité.',
    unlockedLabel: 'débloqués',
    unlockedAt: 'Débloqué le',
    locked: 'Verrouillé',
  },
  en: {
    eyebrow: 'Rewards · Discipline',
    title: 'Your achievements',
    body: 'Achievements unlock automatically as you progress. The point isn’t performance — it’s consistency.',
    unlockedLabel: 'unlocked',
    unlockedAt: 'Unlocked',
    locked: 'Locked',
  },
} as const;
