'use client';

import type { ReactNode } from 'react';
import { useUser } from '@/lib/auth/useUser';
import { isLessonUnlocked } from '@/lib/curriculum/entitlement';
import { PaywallCard } from './PaywallCard';

type Locale = 'fr' | 'en';

// Wraps the lesson content. If the current user's plan does not unlock this
// global index, swap the runner for a paywall card.
// Render both `unlocked` and `extras` slots inline so the page layout (two
// stacked sections) is preserved.
export function LessonGate({
  locale,
  globalIndex,
  freeLessonHref,
  unlockedMain,
  unlockedExtras,
}: {
  locale: Locale;
  globalIndex: number;
  freeLessonHref: string;
  unlockedMain: ReactNode;
  unlockedExtras: ReactNode;
}) {
  const { user, plan, ready } = useUser();

  if (!ready) {
    return <div className="h-[60vh]" aria-hidden />;
  }

  if (!isLessonUnlocked(globalIndex, plan)) {
    return (
      <PaywallCard
        locale={locale}
        signedIn={Boolean(user)}
        freeLessonHref={freeLessonHref}
      />
    );
  }

  return (
    <>
      {unlockedMain}
      <div className="mt-12 md:mt-16">{unlockedExtras}</div>
    </>
  );
}
