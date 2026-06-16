// Public share profile: /<locale>/u/<slug>
//
// LinkedIn-style flex page. Renders only public-safe stats (streak, level,
// XP, lessons, tracks, plan badge, join month) — never the email or any
// progress detail. 404s when the slug is unknown OR share_public is false.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Award, Flame, GraduationCap, Trophy, Calendar, Sparkles } from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { findUserBySlug, type PublicShareUser } from '@/lib/db/share-queries';
import { listProgress } from '@/lib/db/queries';
import { TRACKS, totalLessons } from '@/lib/curriculum/data';
import { deriveLevel } from '@/lib/progress/xp';
import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';

type Params = { locale: string; slug: string };

export const dynamic = 'force-dynamic';
// Tickra awards XP for many actions client-side, but on the public page we
// only know server-side completions. Map each completed lesson to a fixed
// XP value — this keeps the displayed level deterministic and conservative.
const XP_PER_LESSON = 25;

const copy = {
  fr: {
    anonymous: 'Apprenant Tickra',
    eyebrow: 'Profil public',
    summary: 'progresse sur Tickra.',
    streak: 'Série la plus longue',
    streakUnit: 'jours',
    level: 'Niveau',
    xp: 'XP total',
    lessons: 'Leçons terminées',
    tracks: 'Pistes complétées',
    joined: 'Inscrit depuis',
    plan: 'Statut',
    free: 'Gratuit',
    pro: 'Pro',
    lifetime: 'Lifetime',
    cta: 'Commencer mon propre parcours',
    learn: 'Découvrir Tickra',
    of: 'sur',
    months: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  },
  en: {
    anonymous: 'Tickra learner',
    eyebrow: 'Public profile',
    summary: 'is progressing on Tickra.',
    streak: 'Longest streak',
    streakUnit: 'days',
    level: 'Level',
    xp: 'Total XP',
    lessons: 'Lessons completed',
    tracks: 'Tracks completed',
    joined: 'Joined',
    plan: 'Status',
    free: 'Free',
    pro: 'Pro',
    lifetime: 'Lifetime',
    cta: 'Start my own journey',
    learn: 'Discover Tickra',
    of: 'of',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
} as const;

// ─── Stats derivation (server-side, public-safe) ──────────────────────────

type Stats = {
  lessons: number;
  tracks: number;
  streak: number;
  xp: number;
  level: number;
};

function longestStreak(completedAt: string[]): number {
  if (completedAt.length === 0) return 0;
  const days = new Set(completedAt.map((iso) => iso.slice(0, 10)));
  // Sort ascending day-strings then walk.
  const sorted = Array.from(days).sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00Z').getTime();
    const cur = new Date(sorted[i] + 'T00:00:00Z').getTime();
    const diff = Math.round((cur - prev) / 86_400_000);
    if (diff === 1) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
}

function computeTrackCount(lessonIds: Set<string>): number {
  // A track is "completed" when every lesson in it is in the user's set.
  let count = 0;
  for (const track of TRACKS) {
    if (track.lessons.length === 0) continue;
    const allDone = track.lessons.every((l) => lessonIds.has(l.id));
    if (allDone) count += 1;
  }
  return count;
}

async function computeStats(email: string): Promise<Stats> {
  const rows = await listProgress(email);
  const lessons = rows.length;
  const ids = new Set(rows.map((r) => r.lesson_id));
  const tracks = computeTrackCount(ids);
  const streak = longestStreak(rows.map((r) => r.completed_at));
  const xp = lessons * XP_PER_LESSON;
  const { level } = deriveLevel(xp);
  return { lessons, tracks, streak, xp, level };
}

function displayNameFor(user: PublicShareUser, locale: Locale): string {
  const trimmed = (user.display_name ?? '').trim();
  return trimmed.length > 0 ? trimmed : copy[locale].anonymous;
}

function joinedLabel(iso: string | null, locale: Locale): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const m = copy[locale].months[d.getUTCMonth()];
  return `${m} ${d.getUTCFullYear()}`;
}

function planLabel(plan: PublicShareUser['plan'], locale: Locale): string {
  const t = copy[locale];
  if (plan === 'pro') return t.pro;
  if (plan === 'lifetime') return t.lifetime;
  return t.free;
}

// ─── Metadata ─────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const locale: Locale = params.locale;
  const user = await findUserBySlug(params.slug);
  if (!user) return {};
  const name = displayNameFor(user, locale);
  const stats = await computeStats(user.email);
  const title = `${name} · Tickra`;
  const description =
    locale === 'fr'
      ? `${stats.lessons} leçons, ${stats.tracks} pistes, ${stats.streak} jours de série sur Tickra.`
      : `${stats.lessons} lessons, ${stats.tracks} tracks, ${stats.streak}-day streak on Tickra.`;
  const url = `${SITE_URL}/${locale}/u/${params.slug}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      // The /u profile renders bilingual content (stats labels switch
      // per locale). Declare hreflang so Google serves /fr/u/foo to
      // French queries and /en/u/foo to English ones, matching the
      // rest of the site's language matrix.
      languages: {
        'fr-FR': `${SITE_URL}/fr/u/${params.slug}`,
        'en-GB': `${SITE_URL}/en/u/${params.slug}`,
        'x-default': `${SITE_URL}/fr/u/${params.slug}`,
      },
    },
    openGraph: {
      type: 'profile',
      url,
      title,
      description,
      siteName: 'Tickra',
      images: user.avatar_url ? [{ url: user.avatar_url }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: user.avatar_url ? [user.avatar_url] : undefined,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function PublicProfilePage({ params }: { params: Params }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const slug = params.slug?.trim();
  if (!slug) notFound();

  const user = await findUserBySlug(slug);
  if (!user) notFound();

  const t = copy[locale];
  const dict = await getDictionary(locale);
  const name = displayNameFor(user, locale);
  const stats = await computeStats(user.email);
  const joined = joinedLabel(user.created_at, locale);
  const isPaid = user.plan === 'pro' || user.plan === 'lifetime';
  const total = totalLessons();

  // Schema.org ProfilePage + Person — gives Google a clean signal that
  // this URL is a public-profile page about a single Person, with the
  // displayed name (which may be a pseudonym) as mainEntity.name. Stats
  // are intentionally NOT serialised: they shift with progress and
  // would otherwise trigger churn on every revalidation.
  const profileSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: `${SITE_URL}/${locale}/u/${slug}`,
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
    mainEntity: {
      '@type': 'Person',
      name,
      url: `${SITE_URL}/${locale}/u/${slug}`,
      ...(user.avatar_url && { image: user.avatar_url }),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(profileSchema) }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Tickra', path: `/${locale}` },
          { name, path: `/${locale}/u/${slug}` },
        ]}
      />
      <Navbar dict={dict} locale={locale} />
      <main className="bg-canvas text-ink">
        <Container className="py-16 md:py-24">
          {/* Hero */}
          <header className="rounded-sm border border-line bg-surface p-8 md:p-12">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
              {t.eyebrow}
            </div>
            <div className="mt-5 flex items-center gap-5">
              {user.avatar_url ? (
                // Avatar is a remote URL; rendered as an unoptimised <img> on
                // purpose so we don't have to allowlist arbitrary hosts in
                // next.config.mjs for the public page.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={name}
                  className="h-20 w-20 rounded-full border border-line object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-line bg-canvas">
                  <GraduationCap className="h-9 w-9 text-muted" strokeWidth={1.5} />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
                  {name}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {name} {t.summary}
                </p>
                {isPaid ? (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-brand/40 bg-brand/10 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.2em] text-brand">
                    <Sparkles className="h-3 w-3" strokeWidth={1.75} />
                    {planLabel(user.plan, locale)}
                  </span>
                ) : null}
              </div>
            </div>
          </header>

          {/* Stats grid */}
          <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            <Stat
              icon={<Flame className="h-4 w-4" strokeWidth={1.75} />}
              label={t.streak}
              value={`${stats.streak} ${t.streakUnit}`}
            />
            <Stat
              icon={<Trophy className="h-4 w-4" strokeWidth={1.75} />}
              label={t.level}
              value={String(stats.level)}
            />
            <Stat
              icon={<Award className="h-4 w-4" strokeWidth={1.75} />}
              label={t.xp}
              value={String(stats.xp)}
            />
            <Stat
              icon={<GraduationCap className="h-4 w-4" strokeWidth={1.75} />}
              label={t.lessons}
              value={`${stats.lessons} ${t.of} ${total}`}
            />
            <Stat
              icon={<GraduationCap className="h-4 w-4" strokeWidth={1.75} />}
              label={t.tracks}
              value={`${stats.tracks} ${t.of} ${TRACKS.length}`}
            />
            {joined ? (
              <Stat
                icon={<Calendar className="h-4 w-4" strokeWidth={1.75} />}
                label={t.joined}
                value={joined}
              />
            ) : null}
          </section>

          {/* CTA */}
          <section className="mt-10 rounded-sm border border-line bg-surface p-8 text-center">
            <Link
              href={`/${locale}/onboarding`}
              className="inline-flex items-center gap-2 rounded-sm bg-brand px-5 py-3 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
            >
              {t.cta}
            </Link>
            <div className="mt-3">
              <Link
                href={`/${locale}`}
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted hover:text-ink"
              >
                {t.learn}
              </Link>
            </div>
          </section>
        </Container>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-sm border border-line bg-surface p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-medium tracking-tight text-ink">
        {value}
      </div>
    </div>
  );
}
