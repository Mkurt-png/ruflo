'use client';

import { useMemo } from 'react';
import { Lock, Trophy } from 'lucide-react';
import { useProgress } from '@/lib/progress/hook';
import { deriveAchievements } from '@/lib/progress/achievements';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Distinctions',
    subtitle: 'Débloquées au fil de votre progression.',
    counter: 'débloquées',
    unlockedSr: 'Débloquée',
    lockedSr: 'Verrouillée',
  },
  en: {
    title: 'Achievements',
    subtitle: 'Unlocked as you progress.',
    counter: 'unlocked',
    unlockedSr: 'Unlocked',
    lockedSr: 'Locked',
  },
};

export function Achievements({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { state, ready } = useProgress();

  const items = useMemo(() => (ready ? deriveAchievements(state) : []), [state, ready]);
  const total = items.length;
  const unlocked = items.filter((i) => i.unlocked).length;

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
          {unlocked} / {total} {t.counter}
        </div>
      </div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.subtitle}</p>

      <ul className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {items.map((a) => (
          <li
            key={a.id}
            className={cn(
              'flex items-start gap-4 rounded-sm border p-4',
              a.unlocked ? 'border-ink bg-elevated' : 'border-line/60 bg-canvas',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border',
                a.unlocked ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-subtle',
              )}
            >
              {a.unlocked ? (
                <Trophy className="h-4 w-4" strokeWidth={1.6} />
              ) : (
                <Lock className="h-3.5 w-3.5" strokeWidth={1.6} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <span className="sr-only">{a.unlocked ? t.unlockedSr : t.lockedSr} — </span>
              <div
                className={cn(
                  'font-display text-[15px] font-medium tracking-tight',
                  a.unlocked ? 'text-ink' : 'text-muted',
                )}
              >
                {a.title[locale]}
              </div>
              <div
                className={cn(
                  'mt-1 text-[13px] leading-relaxed',
                  a.unlocked ? 'text-muted' : 'text-subtle',
                )}
              >
                {a.body[locale]}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
