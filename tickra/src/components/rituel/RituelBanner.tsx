'use client';

// RituelBanner — shows on the dashboard when the reader returns after
// ≥ 3 days away. Once dismissed it does not return until the next
// qualifying return. Storage is scoped per-account so each user has
// their own ritual state.

import { useEffect, useMemo, useState } from 'react';
import { useProgress } from '@/lib/progress/hook';
import { scopedKey, SCOPE_EVENT } from '@/lib/progress/scope';
import { computeRituel, type Rituel } from '@/lib/tickra/rituel';
import { currentDailyStreak } from '@/lib/progress/streak';

type Locale = 'fr' | 'en';

const COPY = {
  fr: {
    eyebrow: 'Le Rituel — retour',
    dismiss: 'Refermer',
    open: 'Ouvrir une leçon',
    learnHref: 'learn',
    carnet: 'Voir le carnet complet',
    carnetHref: 'rentree',
  },
  en: {
    eyebrow: 'The Ritual — return',
    dismiss: 'Close',
    open: 'Open a lesson',
    learnHref: 'learn',
    carnet: 'See the full register',
    carnetHref: 'rentree',
  },
} as const;

const DISMISS_BASE = 'tickra-rituel-dismissed-v1';


export function RituelBanner({ locale }: { locale: Locale }) {
  const { state, ready } = useProgress();
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const t = COPY[locale];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const read = () => {
      try {
        setDismissedFor(window.localStorage.getItem(scopedKey(DISMISS_BASE)));
      } catch {
        setDismissedFor(null);
      }
    };
    read();
    window.addEventListener(SCOPE_EVENT, read);
    return () => window.removeEventListener(SCOPE_EVENT, read);
  }, []);

  const rituel: Rituel | null = useMemo(() => {
    if (!ready) return null;
    return computeRituel({
      completed: state.completed ?? {},
      mistakes: state.mistakes ?? {},
      streakDays: currentDailyStreak(state.completed ?? {}),
    });
  }, [ready, state]);

  if (!ready || !rituel) return null;
  if (dismissedFor === rituel.lastActiveDate) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(scopedKey(DISMISS_BASE), rituel.lastActiveDate);
    } catch {
      /* ignore */
    }
    setDismissedFor(rituel.lastActiveDate);
  };

  return (
    <section
      aria-label={t.eyebrow}
      className="relative rounded-sm border border-line bg-[#F4F1EA] p-8 md:p-12"
    >
      <header className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
          {t.eyebrow}
        </span>
        <button
          onClick={dismiss}
          className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/45 hover:text-black/80 transition-colors"
        >
          {t.dismiss} ×
        </button>
      </header>

      <ol className="mt-8 space-y-5 max-w-[680px]">
        {rituel.lines.map((line, i) => (
          <li key={i} className="grid grid-cols-[2ch_1fr] gap-x-5 items-baseline">
            <span className="font-mono text-[10px] tracking-[0.22em] text-black/35 tabular-nums">
              {String(i + 1).padStart(2, '0')}
            </span>
            <p
              className="font-display leading-snug text-balance text-[#0E0E0E]/85"
              style={{ fontSize: 'clamp(16px, 1.7vw, 20px)' }}
            >
              {line[locale]}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3">
        <a
          href={`/${locale}/${t.carnetHref}`}
          className="inline-flex h-10 items-center rounded-full border border-black/70 px-5 font-mono text-[11px] uppercase tracking-[0.22em] text-[#0E0E0E] hover:bg-[#0E0E0E] hover:text-[#F4F1EA] transition-colors"
        >
          {t.carnet} →
        </a>
        <a
          href={`/${locale}/${t.learnHref}`}
          className="inline-flex h-10 items-center font-mono text-[11px] uppercase tracking-[0.22em] text-black/65 hover:text-black/90 transition-colors"
        >
          {t.open}
        </a>
      </div>
    </section>
  );
}

export default RituelBanner;
