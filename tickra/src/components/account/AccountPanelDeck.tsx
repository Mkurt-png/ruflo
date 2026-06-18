'use client';

import type { Locale } from '@/lib/i18n/config';
import { LifetimeStats } from './LifetimeStats';
import { StreakHeatmap } from './StreakHeatmap';
import { ActivityChart } from './ActivityChart';
import { CurriculumHeatmap } from './CurriculumHeatmap';
import { NotificationOptin } from './NotificationOptin';
import { ReviewQueue } from './ReviewQueue';
import { Bookmarks } from './Bookmarks';
import { TrackCertificates } from './TrackCertificates';
import { Achievements } from './Achievements';
import { ExportProgress } from './ExportProgress';
import { ImportProgress } from './ImportProgress';
import { ShareProfile } from './ShareProfile';
import { PositionSizer } from '@/components/learn/PositionSizer';
import { ExpectancyCalculator } from '@/components/learn/ExpectancyCalculator';

// PERF: the bottom half of the account dashboard — ~14 panels that all
// sit well below the fold and read purely from client-side stores
// (progress, bookmarks, XP). Extracted into one chunk that AccountPanel
// pulls in via next/dynamic (ssr:false) so it stays out of /me's First
// Load JS. Rendering is identical to the previous inline version.
export function AccountPanelDeck({ locale }: { locale: Locale }) {
  return (
    <>
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
    </>
  );
}

export default AccountPanelDeck;
