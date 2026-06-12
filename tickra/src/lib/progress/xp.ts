// TICKRA-SPRINT-C: tiny XP + level system, stored in localStorage.
//
// XP is awarded for any meaningful action: completing a lesson, finishing a
// quest, closing a simulator trade. Levels scale gently (100 XP each for the
// first 5, then 150, 200, 250…) so the early levels feel quick to reach.

import { scopedKey } from './scope';

const BASE_KEY = 'tickra-xp-v1';
const STORAGE_KEY = () => scopedKey(BASE_KEY);

export type XpState = {
  total: number;
  // History of recent awards keyed by ISO date for the daily quest engine.
  daily: Record<string, number>;
};

const empty: XpState = { total: 0, daily: {} };

export function readXp(): XpState {
  if (typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY());
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as XpState;
    if (typeof parsed?.total !== 'number') return empty;
    return { total: parsed.total, daily: parsed.daily ?? {} };
  } catch {
    return empty;
  }
}

export function writeXp(state: XpState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY(), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function addXp(amount: number): XpState {
  const state = readXp();
  const today = new Date().toISOString().slice(0, 10);
  const next: XpState = {
    total: state.total + amount,
    daily: { ...state.daily, [today]: (state.daily[today] ?? 0) + amount },
  };
  writeXp(next);
  return next;
}

// Level curve: 100 XP × level for levels 1-5, +50 XP/level after that.
function xpForLevel(level: number): number {
  if (level <= 5) return 100 * level;
  return 500 + (level - 5) * 150;
}

export function deriveLevel(total: number): { level: number; intoLevel: number; needed: number; pct: number } {
  let level = 0;
  let cumulative = 0;
  while (true) {
    const needed = xpForLevel(level + 1);
    if (cumulative + needed > total) break;
    cumulative += needed;
    level += 1;
  }
  const needed = xpForLevel(level + 1);
  const intoLevel = total - cumulative;
  const pct = Math.min(100, Math.round((intoLevel / needed) * 100));
  return { level, intoLevel, needed, pct };
}
