// TICKRA-PHASE-3: Forex market-session schedule (pure, UTC-based).
// The four major FX sessions and helpers to tell which are open at a given
// instant, when each next flips, and where the high-liquidity overlaps fall.
//
// Times are standard (winter) UTC windows. DST shifts London/New York by an
// hour through part of the year — surfaced as an "approximate" note in the UI,
// not modelled here, to keep the logic deterministic and testable.

export type SessionId = 'sydney' | 'tokyo' | 'london' | 'newyork';

export type MarketSession = {
  id: SessionId;
  label: { fr: string; en: string };
  city: string;
  /** Minutes from 00:00 UTC. */
  openUtcMin: number;
  closeUtcMin: number;
};

const H = (h: number) => h * 60;

export const SESSIONS: MarketSession[] = [
  { id: 'sydney', label: { fr: 'Sydney', en: 'Sydney' }, city: 'Sydney', openUtcMin: H(22), closeUtcMin: H(7) },
  { id: 'tokyo', label: { fr: 'Tokyo', en: 'Tokyo' }, city: 'Tokyo', openUtcMin: H(0), closeUtcMin: H(9) },
  { id: 'london', label: { fr: 'Londres', en: 'London' }, city: 'London', openUtcMin: H(8), closeUtcMin: H(17) },
  { id: 'newyork', label: { fr: 'New York', en: 'New York' }, city: 'New York', openUtcMin: H(13), closeUtcMin: H(22) },
];

const DAY = 24 * 60;

/** Minutes elapsed since 00:00 UTC for the given date (0..1439). */
export function utcMinutes(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

/** Whether a window [open, close) — possibly wrapping midnight — contains t. */
function withinWindow(openMin: number, closeMin: number, t: number): boolean {
  if (openMin === closeMin) return false;
  if (openMin < closeMin) return t >= openMin && t < closeMin;
  // Wraps midnight (e.g. Sydney 22:00 → 07:00).
  return t >= openMin || t < closeMin;
}

export function isSessionOpen(session: MarketSession, date: Date): boolean {
  return withinWindow(session.openUtcMin, session.closeUtcMin, utcMinutes(date));
}

/** Positive modulo into [0, DAY). */
function mod(n: number): number {
  return ((n % DAY) + DAY) % DAY;
}

export type SessionState = {
  id: SessionId;
  open: boolean;
  /** Minutes until this session next opens (if closed) or closes (if open). */
  minutesToChange: number;
};

export function sessionState(session: MarketSession, date: Date): SessionState {
  const t = utcMinutes(date);
  const open = withinWindow(session.openUtcMin, session.closeUtcMin, t);
  const target = open ? session.closeUtcMin : session.openUtcMin;
  // Distance forward to the target boundary, wrapping over midnight.
  let minutesToChange = mod(target - t);
  // When sitting exactly on a boundary, the next change is a full day away,
  // never zero — guard so "opens in 0m" never shows for a closed session.
  if (minutesToChange === 0) minutesToChange = DAY;
  return { id: session.id, open, minutesToChange };
}

export function openSessions(date: Date): SessionId[] {
  return SESSIONS.filter((s) => isSessionOpen(s, date)).map((s) => s.id);
}

/** True when two or more sessions are open at once (high-liquidity overlap). */
export function isOverlap(date: Date): boolean {
  return openSessions(date).length >= 2;
}

export function allSessionStates(date: Date): SessionState[] {
  return SESSIONS.map((s) => sessionState(s, date));
}
