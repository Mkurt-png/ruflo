'use client';

import { Lock } from 'lucide-react';
import { useUser } from '@/lib/auth/useUser';
import { isLessonUnlocked } from '@/lib/curriculum/entitlement';

type Locale = 'fr' | 'en';

// Tiny client-side badge that shows a lock icon next to lessons that the
// current user's plan cannot access yet. Renders nothing when unlocked.
export function LessonLockBadge({
  globalIndex,
  locale,
}: {
  globalIndex: number;
  locale: Locale;
}) {
  const { plan, ready } = useUser();
  if (!ready) return null;
  if (isLessonUnlocked(globalIndex, plan)) return null;
  return (
    <span
      aria-label={locale === 'fr' ? 'Leçon réservée à Pro' : 'Pro-only lesson'}
      className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted"
    >
      <Lock aria-hidden className="h-3 w-3" strokeWidth={2} />
      Pro
    </span>
  );
}
