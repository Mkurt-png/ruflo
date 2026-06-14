import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ArrowRight, BookOpen, Settings } from 'lucide-react';
import { isLocale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import { TRACKS, getTrack } from '@/lib/curriculum/data';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'welcome',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Bienvenue' : 'Welcome',
    description:
      params.locale === 'fr'
        ? 'Bienvenue dans Tickra. La maison est ouverte.'
        : 'Welcome to Tickra. The house is open.',
    ogEyebrow: params.locale === 'fr' ? 'Tickra · Bienvenue' : 'Tickra · Welcome',
    noindex: true,
  });
}

// TICKRA-PHASE-1.1: focused first-action. One big primary CTA pointing at the
// user's recommended first lesson (from placement test). Secondary actions are
// kept but visually downplayed so the choice paralysis disappears.
const copy = {
  fr: {
    eyebrow: 'Paiement confirmé',
    title: 'Bienvenue dans Tickra Pro.',
    body: "Votre accès est actif. Reçu Stripe par email, et un mail de bienvenue arrive dans quelques minutes.",
    primary: 'Démarrer ma première leçon',
    primaryHint: (track: string) => `Première leçon de la piste ${track}`,
    secondaryGroup: 'Plus tard, vous pourrez aussi',
    profile: 'Compléter votre profil',
    profileSub: 'Langue, thème, nom affiché.',
    space: 'Voir mon espace',
    spaceSub: 'Streak, niveau, statistiques.',
  },
  en: {
    eyebrow: 'Payment confirmed',
    title: 'Welcome to Tickra Pro.',
    body: "Your access is live. Stripe receipt by email, welcome mail on its way.",
    primary: 'Start my first lesson',
    primaryHint: (track: string) => `First lesson of the ${track} track`,
    secondaryGroup: 'Later, you can also',
    profile: 'Complete your profile',
    profileSub: 'Language, theme, display name.',
    space: 'Open my space',
    spaceSub: 'Streak, level, stats.',
  },
} as const;

export default async function WelcomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = copy[params.locale];

  // Resolve the user's recommended first lesson:
  // 1. Their placement_track if they took the test.
  // 2. Otherwise the very first global lesson (forex-basics 01).
  let trackSlug = TRACKS[0].slug;
  if (isDbConfigured()) {
    const session = getSession();
    if (session) {
      const user = await getUser(session.email).catch(() => null);
      if (user?.placement_track && getTrack(user.placement_track)) {
        trackSlug = user.placement_track;
      }
    }
  }
  const track = getTrack(trackSlug) ?? TRACKS[0];
  const firstLesson = track.lessons[0];
  const startHref = `/${params.locale}/learn/${track.slug}/${firstLesson.slug}`;
  const trackTitle = track.title[params.locale];

  return (
    <>
      <Navbar dict={dict} locale={params.locale} />
      <main id="main">
        <section className="relative overflow-hidden border-b border-line">
          <span aria-hidden className="aurora" />
          <Container as="div" className="relative py-24 md:py-32">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.eyebrow}</div>
            <h1 className="mt-4 max-w-3xl font-display text-display-lg font-medium tracking-tight text-balance text-ink">
              <CheckCircle2 aria-hidden className="mr-3 inline-block h-8 w-8 align-[-4px] text-up" strokeWidth={1.5} />
              {t.title}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-[17px] leading-relaxed text-muted md:text-lg">{t.body}</p>

            {/* ─── PRIMARY: one big, obvious next step ───────────────── */}
            <div className="mt-12 max-w-2xl rounded-sm border border-ink bg-ink p-8 text-canvas shadow-[0_20px_60px_-25px_rgba(124,92,217,0.55)] md:p-10">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-canvas/55">
                {t.primaryHint(trackTitle)}
              </div>
              <h2 className="mt-3 font-display text-display-md font-medium tracking-tight text-balance">
                {firstLesson.title[params.locale]}
              </h2>
              <Link
                href={startHref}
                className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-canvas px-7 py-3 text-[15px] font-medium tracking-tight text-ink transition-all hover:-translate-y-0.5 hover:brightness-110"
              >
                {t.primary}
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </div>

            {/* ─── SECONDARY: discreet links, not equal cards ────────── */}
            <p className="mt-12 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
              {t.secondaryGroup}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
              <Link
                href={`/${params.locale}/me/settings`}
                className="inline-flex items-center gap-2 text-[14px] text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                <Settings aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t.profile}
              </Link>
              <Link
                href={`/${params.locale}/me`}
                className="inline-flex items-center gap-2 text-[14px] text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                <BookOpen aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t.space}
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={params.locale} />
    </>
  );
}
