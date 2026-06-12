// Le Mur du silence — when the day has gone bad, the journal closes.
// Pure detection from the last few closed trades. The rule is plain:
// three losses in the last four closes (with at least four closes
// recorded) raises the wall for the next 24 hours.
//
// The wall is not a punishment; it is an act of care that the trader
// could not easily do for themself. The reader can override (one
// click, no judgement), but the default conduct stays closed.

import type { TradeRow } from '@/lib/db/journal-queries';

export type SilenceState = {
  /** True when the wall should be up. */
  active: boolean;
  /** Timestamp (ms) when the wall lifts, if active. */
  liftsAt: number | null;
  /** How many of the recent closes were losses. */
  losses: number;
  /** Recent closes window size used. */
  window: number;
  /** Cumulative PnL across the window. */
  cumulativePnl: number;
};

const WINDOW = 4;
const LOSS_THRESHOLD = 3;
const SILENCE_MS = 24 * 60 * 60_000;

export function readSilence(trades: TradeRow[], now: number = Date.now()): SilenceState {
  const closed = trades
    .filter((t) => typeof t.pnl === 'number' && t.closed_at)
    .sort(
      (a, b) =>
        new Date(b.closed_at as string).getTime() - new Date(a.closed_at as string).getTime(),
    )
    .slice(0, WINDOW);

  if (closed.length < WINDOW) {
    return {
      active: false,
      liftsAt: null,
      losses: closed.filter((t) => (t.pnl ?? 0) < 0).length,
      window: closed.length,
      cumulativePnl: closed.reduce((a, t) => a + (t.pnl ?? 0), 0),
    };
  }

  const losses = closed.filter((t) => (t.pnl ?? 0) < 0).length;
  const cumulativePnl = closed.reduce((a, t) => a + (t.pnl ?? 0), 0);

  if (losses < LOSS_THRESHOLD || cumulativePnl >= 0) {
    return { active: false, liftsAt: null, losses, window: WINDOW, cumulativePnl };
  }

  // The trigger time is the close of the most recent trade in the
  // window. The wall stands for SILENCE_MS after that.
  const triggeredAt = new Date(closed[0].closed_at as string).getTime();
  const liftsAt = triggeredAt + SILENCE_MS;
  if (now >= liftsAt) {
    return { active: false, liftsAt: null, losses, window: WINDOW, cumulativePnl };
  }

  return { active: true, liftsAt, losses, window: WINDOW, cumulativePnl };
}
