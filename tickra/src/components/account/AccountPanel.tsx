'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CreditCard, GraduationCap, LogOut, RefreshCw } from 'lucide-react';
import { useProgress } from '@/lib/progress/hook';
import { TRACKS, totalLessons } from '@/lib/curriculum/data';
import { StreakHeatmap } from './StreakHeatmap';
import { ActivityChart } from './ActivityChart';
import { Achievements } from './Achievements';
import { TrackCertificates } from './TrackCertificates';
import { ReviewQueue } from './ReviewQueue';
import { Bookmarks } from './Bookmarks';
import { LifetimeStats } from './LifetimeStats';
import { NotificationOptin } from './NotificationOptin';
import { FirstRunTour } from './FirstRunTour';
import { DailyChallenge } from './DailyChallenge';
import { DailyQuests } from './DailyQuests';
import { XpBadge } from './XpBadge';
import { ExportProgress } from './ExportProgress';
import { ImportProgress } from './ImportProgress';
import { CurriculumHeatmap } from './CurriculumHeatmap';
import { ShareProfile } from './ShareProfile';
import { WhatsNewBanner } from './WhatsNewBanner';
import { PositionSizer } from '@/components/learn/PositionSizer';
import { ExpectancyCalculator } from '@/components/learn/ExpectancyCalculator';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    progress: 'Progression',
    lessonsDone: 'leçons terminées',
    tracksStarted: 'pistes commencées',
    resume: 'Reprendre l’apprentissage',
    diploma: 'Voir mon diplôme',
    billing: 'Gérer mon abonnement',
    billingPending: 'Ouverture de Stripe…',
    billingNoCustomer: 'Aucun abonnement actif lié à cet e‑mail.',
    billingNotConfigured: 'Paiements non configurés.',
    signOut: 'Se déconnecter',
    sessionLabel: 'Session active',
    resetProgress: 'Réinitialiser ma progression locale',
    resetConfirm: 'Êtes‑vous sûr ?',
  },
  en: {
    progress: 'Progress',
    lessonsDone: 'lessons done',
    tracksStarted: 'tracks started',
    resume: 'Resume learning',
    diploma: 'View my diploma',
    billing: 'Manage subscription',
    billingPending: 'Opening Stripe…',
    billingNoCustomer: 'No active subscription for this email.',
    billingNotConfigured: 'Billing not configured.',
    signOut: 'Sign out',
    sessionLabel: 'Active session',
    resetProgress: 'Reset my local progress',
    resetConfirm: 'Are you sure?',
  },
};

export function AccountPanel({ locale, email }: { locale: Locale; email: string }) {
  const t = copy[locale];
  const { state, ready, reset, completedCount } = useProgress();
  const [portalState, setPortalState] = useState<'idle' | 'pending' | 'no_customer' | 'not_configured' | 'error'>('idle');

  const total = totalLessons();
  const ratio = ready && total > 0 ? completedCount / total : 0;

  const startedTracks = TRACKS.filter((tr) =>
    tr.lessons.some((l) => state.completed[l.id]),
  ).length;

  // Find the next not-completed lesson, in curriculum order.
  let resumeHref = `/${locale}/learn`;
  if (ready) {
    outer: for (const tr of TRACKS) {
      for (const l of tr.lessons) {
        if (!state.completed[l.id]) {
          resumeHref = `/${locale}/learn/${tr.slug}/${l.slug}`;
          break outer;
        }
      }
    }
  }

  const openPortal = async () => {
    setPortalState('pending');
    try {
      const res = await fetch(`/api/billing/portal?locale=${locale}`, { method: 'POST' });
      const json = (await res.json()) as { url?: string; error?: string };
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      if (json.error === 'no_customer') setPortalState('no_customer');
      else if (json.error === 'stripe_not_configured') setPortalState('not_configured');
      else setPortalState('error');
    } catch {
      setPortalState('error');
    }
  };

  const onReset = () => {
    if (window.confirm(t.resetConfirm)) reset();
  };

  return (
    <div className="grid grid-cols-12 gap-x-6 gap-y-10">
      <FirstRunTour locale={locale} />

      <div className="col-span-12">
        <WhatsNewBanner locale={locale} />
      </div>

      <section className="col-span-12 lg:col-span-8">
        <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            {t.progress}
          </div>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-5xl font-medium tracking-tighter text-ink">
              {completedCount}
            </span>
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-muted">
              / {total} {t.lessonsDone}
            </span>
          </div>
          <div aria-hidden className="mt-6 h-1 w-full rounded-full bg-line">
            <div
              className="h-1 rounded-full bg-ink transition-all"
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </div>
          <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
            {startedTracks} / {TRACKS.length} {t.tracksStarted}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={resumeHref}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
            >
              {t.resume}
              <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </Link>
            <Link
              href={`/${locale}/diploma`}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-line px-6 text-[15px] font-medium tracking-tight text-ink transition-colors hover:border-ink"
            >
              <GraduationCap aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              {t.diploma}
            </Link>
          </div>
        </article>

        {/* TICKRA-SPRINT-C: XP badge surfaces level + progress at a glance. */}
        <div className="mt-3">
          <XpBadge locale={locale} />
        </div>

        {/* TICKRA-SPRINT-C: 3 daily quests with claimable XP rewards. */}
        <div className="mt-3">
          <DailyQuests locale={locale} />
        </div>

        <div className="mt-3">
          <DailyChallenge locale={locale} />
        </div>

        <div className="mt-3">
          <LifetimeStats locale={locale} />
        </div>

        <div className="mt-3">
          <StreakHeatmap locale={locale} />
        </div>

        <div className="mt-3">
          <ActivityChart locale={locale} />
        </div>

        <div className="mt-3">
          <CurriculumHeatmap locale={locale} />
        </div>

        <div className="mt-3">
          <NotificationOptin locale={locale} />
        </div>

        <div className="mt-3">
          <ReviewQueue locale={locale} />
        </div>

        <div className="mt-3">
          <Bookmarks locale={locale} />
        </div>

        <div className="mt-3">
          <TrackCertificates locale={locale} />
        </div>

        <div className="mt-3">
          <Achievements locale={locale} />
        </div>

        <div className="mt-3">
          <PositionSizer locale={locale} />
        </div>

        <div className="mt-3">
          <ExpectancyCalculator locale={locale} />
        </div>

        <div className="mt-3">
          <ExportProgress locale={locale} />
        </div>

        <div className="mt-3">
          <ImportProgress locale={locale} />
        </div>

        <div className="mt-3">
          <ShareProfile locale={locale} />
        </div>
      </section>

      <aside className="col-span-12 lg:col-span-4">
        <div className="space-y-3">
          <div className="rounded-sm border border-line bg-surface p-6">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
              {t.sessionLabel}
            </div>
            <div className="mt-3 truncate text-[14.5px] text-ink">{email}</div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/${locale}/me/settings`}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
              >
                {locale === 'fr' ? 'Paramètres' : 'Settings'}
                <ArrowRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            </div>
            <form action={`/api/auth/signout?locale=${locale}`} method="post" className="mt-3">
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-[13.5px] font-medium tracking-tight text-ink transition-colors hover:border-ink"
              >
                <LogOut aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t.signOut}
              </button>
            </form>
          </div>

          <button
            type="button"
            onClick={openPortal}
            className="flex w-full items-center justify-between rounded-sm border border-line bg-surface p-6 text-left transition-colors hover:border-ink"
          >
            <span className="flex items-center gap-3 text-[14.5px] text-ink">
              <CreditCard aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              {portalState === 'pending' ? t.billingPending : t.billing}
            </span>
            <ArrowRight aria-hidden className="h-4 w-4 text-muted" strokeWidth={1.75} />
          </button>

          {portalState === 'no_customer' ? (
            <p className="px-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
              {t.billingNoCustomer}
            </p>
          ) : null}
          {portalState === 'not_configured' ? (
            <p className="px-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
              {t.billingNotConfigured}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onReset}
            className="flex w-full items-center justify-between rounded-sm border border-line/60 bg-canvas p-6 text-left transition-colors hover:border-line"
          >
            <span className="flex items-center gap-3 text-[13.5px] text-muted">
              <RefreshCw aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
              {t.resetProgress}
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
}
