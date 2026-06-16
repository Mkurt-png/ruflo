'use client';

import { Check } from 'lucide-react';
import { useProgress } from '@/lib/progress/hook';
import type { Locale } from '@/lib/i18n/config';

export function LessonCheckmark({
  lessonId,
  locale = 'en',
}: {
  lessonId: string;
  /** Caller locale — used for the completed badge aria-label. Defaults
   * to English so callers that don't pass it (none today, but
   * future-proofing) don't ship a missing label. */
  locale?: Locale;
}) {
  const { isComplete, ready } = useProgress();
  if (!ready || !isComplete(lessonId)) {
    return <span aria-hidden className="block h-4 w-4 rounded-full border border-line" />;
  }
  return (
    <span
      aria-label={locale === 'fr' ? 'Terminée' : 'Completed'}
      className="flex h-4 w-4 items-center justify-center rounded-full bg-ink text-canvas"
    >
      <Check aria-hidden className="h-2.5 w-2.5" strokeWidth={2.5} />
    </span>
  );
}
