'use client';

// useCote — reads all client-side progress sources and computes the
// composite Tickra Cote. Re-runs when the scope changes (sign-in) or
// when a store dispatches a storage update.

import { useEffect, useState } from 'react';
import { useProgress } from '@/lib/progress/hook';
import { SCOPE_EVENT, scopedKey } from '@/lib/progress/scope';
import { currentDailyStreak } from '@/lib/progress/streak';
import { computeCote, type CoteOutput } from './cote';

function readJournalCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(scopedKey('tickra-journal-v1'));
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { entries?: unknown[] };
    return Array.isArray(parsed?.entries) ? parsed.entries.length : 0;
  } catch {
    return 0;
  }
}

function computeStreak(completed: Record<string, number>): number {
  if (typeof window === 'undefined') return 0;
  return currentDailyStreak(completed);
}

const ZERO: CoteOutput = {
  score: 0,
  parts: { regularite: 0, precision: 0, honnete: 0, revision: 0 },
  delta: 0,
  trail: new Array(30).fill(0),
};

export function useCote(): { cote: CoteOutput; ready: boolean } {
  const { state, ready } = useProgress();
  const [cote, setCote] = useState<CoteOutput>(ZERO);

  useEffect(() => {
    if (!ready) return;
    const next = computeCote({
      completed: state.completed,
      mistakes: state.mistakes ?? {},
      streakDays: computeStreak(state.completed),
      journalCount: readJournalCount(),
    });
    setCote(next);
  }, [ready, state]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const refresh = () => {
      const next = computeCote({
        completed: state.completed,
        mistakes: state.mistakes ?? {},
        streakDays: computeStreak(state.completed),
        journalCount: readJournalCount(),
      });
      setCote(next);
    };
    window.addEventListener(SCOPE_EVENT, refresh);
    return () => window.removeEventListener(SCOPE_EVENT, refresh);
  }, [state]);

  return { cote, ready };
}
