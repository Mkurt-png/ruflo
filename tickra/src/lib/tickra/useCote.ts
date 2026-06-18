'use client';

// useCote — reads all client-side progress sources and computes the
// composite Tickra Cote. Re-runs when the scope changes (sign-in) or
// when a store dispatches a storage update.

import { useEffect, useState } from 'react';
import { useProgress } from '@/lib/progress/hook';
import { SCOPE_EVENT, scopedKey } from '@/lib/progress/scope';
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

// Local-time YYYY-MM-DD key. Users think in their own calendar day, so a
// lesson finished at 14:00 local belongs to that local day — not the UTC
// day, which toISOString() would have used (off by one east of UTC).
function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Current consecutive-day streak: number of local days, ending today,
 * each carrying at least one completion. Pure + now-injectable for tests.
 * Keys and the walking cursor are both in local time so the comparison is
 * timezone-consistent, and the cursor steps back by calendar day
 * (`setDate`) rather than a fixed 24h so DST transitions don't skip a day. */
export function currentDailyStreak(
  completed: Record<string, number>,
  now: number = Date.now(),
): number {
  const days = new Set<string>();
  for (const ts of Object.values(completed)) {
    days.add(localDayKey(new Date(ts)));
  }
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  for (;;) {
    if (days.has(localDayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
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
