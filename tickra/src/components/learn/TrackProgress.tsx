'use client';

import { useProgress } from '@/lib/progress/hook';

export function TrackProgress({
  lessonIds,
  locale,
}: {
  lessonIds: string[];
  locale: 'fr' | 'en';
}) {
  const { state, ready } = useProgress();
  const total = lessonIds.length;
  const done = ready ? lessonIds.filter((id) => state.completed[id]).length : 0;
  const ratio = total > 0 ? done / total : 0;

  const label = locale === 'fr' ? `${done} / ${total} terminées` : `${done} / ${total} done`;

  return (
    <div className="flex-1">
      <div aria-hidden className="h-1 w-full rounded-full bg-line">
        <div
          className="h-1 rounded-full bg-ink transition-all"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted">
        {label}
      </div>
    </div>
  );
}
