'use client';

// TICKRA-SPRINT-C: three quests refreshed at local midnight, with progress
// auto-derived from existing stores (progress hook + simulator + xp).
// Done quests award XP. State persisted in localStorage.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles, Trophy } from 'lucide-react';
import { useProgress } from '@/lib/progress/hook';
import { addXp } from '@/lib/progress/xp';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';

type Quest = {
  id: string;
  label: string;
  target: number;
  reward: number;
  metric: 'lessonsToday' | 'tradesToday' | 'streakBonus';
  href?: string;
  hrefLabel?: string;
};

const STORAGE_KEY = 'tickra-quests-v1';

type QuestState = {
  date: string; // YYYY-MM-DD
  claimed: Record<string, true>;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readState(): QuestState {
  if (typeof window === 'undefined') return { date: todayKey(), claimed: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayKey(), claimed: {} };
    const parsed = JSON.parse(raw) as QuestState;
    if (parsed.date !== todayKey()) return { date: todayKey(), claimed: {} };
    return parsed;
  } catch {
    return { date: todayKey(), claimed: {} };
  }
}

function writeState(s: QuestState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

const copy = {
  fr: {
    eyebrow: 'Quêtes du jour',
    title: 'Trois objectifs, dix minutes.',
    body: 'Remises à zéro à minuit. XP gagnée alimente votre niveau.',
    claim: 'Récupérer',
    claimed: 'Récupéré',
    open: 'Ouvrir',
    quests: [
      { id: 'q-lessons', label: 'Terminer 2 leçons', target: 2, reward: 30, metric: 'lessonsToday', href: '/learn', hrefLabel: 'Aller au cursus' },
      { id: 'q-trades',  label: 'Ouvrir 1 trade démo', target: 1, reward: 25, metric: 'tradesToday', href: '/me/simulator', hrefLabel: 'Simulateur' },
      { id: 'q-streak',  label: 'Maintenir votre streak', target: 1, reward: 20, metric: 'streakBonus' },
    ] as Quest[],
  },
  en: {
    eyebrow: 'Daily quests',
    title: 'Three goals, ten minutes.',
    body: 'Reset at midnight. XP feeds your level.',
    claim: 'Claim',
    claimed: 'Claimed',
    open: 'Open',
    quests: [
      { id: 'q-lessons', label: 'Finish 2 lessons', target: 2, reward: 30, metric: 'lessonsToday', href: '/learn', hrefLabel: 'Open curriculum' },
      { id: 'q-trades',  label: 'Open 1 demo trade', target: 1, reward: 25, metric: 'tradesToday', href: '/me/simulator', hrefLabel: 'Simulator' },
      { id: 'q-streak',  label: 'Keep your streak alive', target: 1, reward: 20, metric: 'streakBonus' },
    ] as Quest[],
  },
};

function countLessonsToday(completed: Record<string, number>): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();
  return Object.values(completed).filter((ts) => ts >= startMs).length;
}

function countTradesToday(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem('tickra-simulator-v1');
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { closed?: { closedAt: number }[]; open?: { openedAt: number }[] };
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const startMs = start.getTime();
    const opened = (parsed.open ?? []).filter((p) => p.openedAt >= startMs).length;
    const closedToday = (parsed.closed ?? []).filter((c) => c.closedAt >= startMs).length;
    return opened + closedToday;
  } catch {
    return 0;
  }
}

function hasStreakActivityToday(completed: Record<string, number>): boolean {
  return countLessonsToday(completed) > 0 || countTradesToday() > 0;
}

export function DailyQuests({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { state, ready } = useProgress();
  const [qState, setQState] = useState<QuestState>({ date: todayKey(), claimed: {} });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setQState(readState());
    // Re-render every 10s so the trade counter (which lives in another
    // localStorage key) stays roughly fresh.
    const id = setInterval(() => setTick((n) => n + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const progress = useMemo(() => {
    void tick; // ensure recompute on tick
    if (!ready) return { lessonsToday: 0, tradesToday: 0, streakBonus: 0 };
    const lessonsToday = countLessonsToday(state.completed);
    const tradesToday = countTradesToday();
    return {
      lessonsToday,
      tradesToday,
      streakBonus: hasStreakActivityToday(state.completed) ? 1 : 0,
    };
  }, [state, ready, tick]);

  const claim = (q: Quest) => {
    if (qState.claimed[q.id]) return;
    if (progress[q.metric] < q.target) return;
    addXp(q.reward);
    const next = { ...qState, claimed: { ...qState.claimed, [q.id]: true as const } };
    setQState(next);
    writeState(next);
    // Notify other parts of the page (XpBadge) by firing a storage event.
    window.dispatchEvent(new Event('tickra-xp-changed'));
  };

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.eyebrow}</div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
          {Object.keys(qState.claimed).length} / {t.quests.length}
        </div>
      </div>
      <h2 className="mt-3 font-display text-2xl font-medium tracking-tight text-balance text-ink">{t.title}</h2>
      <p className="mt-2 text-[14px] text-muted">{t.body}</p>

      <ul className="mt-7 space-y-3">
        {t.quests.map((q) => {
          const done = progress[q.metric] >= q.target;
          const claimed = Boolean(qState.claimed[q.id]);
          const pct = Math.min(100, Math.round((progress[q.metric] / q.target) * 100));
          return (
            <li key={q.id} className="rounded-sm border border-line p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-full border', claimed ? 'border-up bg-up text-canvas' : done ? 'border-ink text-ink' : 'border-line text-muted')}>
                  {claimed ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Sparkles className="h-3 w-3" strokeWidth={1.75} />}
                </span>
                <span className="text-[14.5px] font-medium tracking-tight text-ink">{q.label}</span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted">
                  {Math.min(progress[q.metric], q.target)} / {q.target}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.2em] text-brand">
                  <Trophy className="h-3 w-3" strokeWidth={1.75} />
                  +{q.reward} XP
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  className={cn('h-full transition-all duration-500', claimed ? 'bg-up' : done ? 'bg-brand' : 'bg-muted/60')}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                {q.href ? (
                  <Link
                    href={`/${locale}${q.href}`}
                    className="inline-flex h-8 items-center rounded-full border border-line px-3 text-[11px] uppercase tracking-[0.18em] text-muted hover:border-ink hover:text-ink"
                  >
                    {q.hrefLabel ?? t.open}
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => claim(q)}
                  disabled={!done || claimed}
                  className={cn(
                    'ml-auto inline-flex h-8 items-center rounded-full px-4 text-[11px] uppercase tracking-[0.18em] transition-colors',
                    claimed
                      ? 'bg-up text-canvas'
                      : done
                        ? 'bg-ink text-canvas hover:brightness-110'
                        : 'cursor-not-allowed bg-line text-subtle',
                  )}
                >
                  {claimed ? t.claimed : t.claim}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
