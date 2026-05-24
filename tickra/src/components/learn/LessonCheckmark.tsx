'use client';

import { Check } from 'lucide-react';
import { useProgress } from '@/lib/progress/hook';

export function LessonCheckmark({ lessonId }: { lessonId: string }) {
  const { isComplete, ready } = useProgress();
  if (!ready || !isComplete(lessonId)) {
    return <span aria-hidden className="block h-4 w-4 rounded-full border border-line" />;
  }
  return (
    <span
      aria-label="Completed"
      className="flex h-4 w-4 items-center justify-center rounded-full bg-ink text-canvas"
    >
      <Check aria-hidden className="h-2.5 w-2.5" strokeWidth={2.5} />
    </span>
  );
}
