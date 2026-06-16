'use client';

import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { useProgress } from '@/lib/progress/hook';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Série',
    days: 'jours',
    last30: '30 derniers jours',
    best: 'Meilleure série',
    current: 'Série en cours',
    none: 'Lancez votre première leçon pour démarrer le compteur.',
  },
  en: {
    title: 'Streak',
    days: 'days',
    last30: 'Last 30 days',
    best: 'Best streak',
    current: 'Current streak',
    none: 'Run your first lesson to start the counter.',
  },
};

// We compute streaks from the localStorage progress timestamps. A "day" is a
// calendar day in the user's local timezone. Two lessons in the same day count
// as the same day for streak purposes — same as Duolingo.
export function StreakHeatmap({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { state, ready } = useProgress();

  const data = useMemo(() => {
    if (!ready) return { current: 0, best: 0, daysActive: new Set<string>(), total: 0 };
    const days = new Set<string>();
    let total = 0;
    for (const ts of Object.values(state.completed)) {
      const d = new Date(ts);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.add(key);
      total += 1;
    }
    // current streak: walk back from today as long as the day is active.
    const today = new Date();
    let current = 0;
    const cursor = new Date(today);
    while (days.has(dayKey(cursor))) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    // best streak across the activity set.
    const sortedKeys = Array.from(days).sort();
    let best = 0;
    let run = 0;
    let prevKey: string | null = null;
    for (const k of sortedKeys) {
      if (prevKey && isNextDay(prevKey, k)) {
        run += 1;
      } else {
        run = 1;
      }
      if (run > best) best = run;
      prevKey = k;
    }
    return { current, best, daysActive: days, total };
  }, [state, ready]);

  // Build the last-30-days grid as a static array, oldest first.
  const cells = useMemo(() => {
    const arr: { key: string; active: boolean }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      arr.push({ key: k, active: data.daysActive.has(k) });
    }
    return arr;
  }, [data.daysActive]);

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-3">
          <Flame
            aria-hidden
            className={cn('h-5 w-5', data.current > 0 ? 'text-down' : 'text-subtle')}
            strokeWidth={1.6}
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            {t.title}
          </span>
        </div>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
          {t.last30}
        </span>
      </div>

      <div className="mt-6 flex items-baseline gap-3">
        <span className="font-display text-5xl font-medium tracking-tighter text-ink">
          {data.current}
        </span>
        <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-muted">
          {t.days}
        </span>
      </div>
      <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
        {t.current} · {t.best} {data.best}
      </div>

      <ul aria-hidden className="mt-8 grid grid-cols-15 gap-1.5 md:grid-cols-30" style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}>
        {cells.map((c) => (
          <li
            key={c.key}
            title={c.key}
            className={cn(
              'aspect-square rounded-[2px]',
              c.active ? 'bg-ink' : 'border border-line bg-canvas',
            )}
          />
        ))}
      </ul>

      {data.total === 0 ? (
        <p className="mt-6 text-[13px] text-muted">{t.none}</p>
      ) : null}
    </article>
  );
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isNextDay(prev: string, next: string): boolean {
  const a = new Date(prev);
  a.setDate(a.getDate() + 1);
  return dayKey(a) === next;
}
