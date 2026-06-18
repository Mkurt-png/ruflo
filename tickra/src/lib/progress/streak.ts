// Shared current-streak math. Four call sites (useCote, RituelBanner,
// LettrePanel, Bureau) used to each inline a copy that keyed completion
// days with toISOString() (UTC) while starting the cursor at local
// midnight — a calendar mix that under-counted the streak for users east
// of UTC. Consolidated here, keyed and walked entirely in LOCAL time.

/** Local-time YYYY-MM-DD key. A lesson finished at 14:00 local belongs to
 * that local day, not the UTC day toISOString() would have used. */
export function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Number of consecutive local days, ending today, that each carry at
 * least one completion. Pure and now-injectable for tests. Steps back by
 * calendar day (setDate) rather than a fixed 24h so DST transitions never
 * skip a day. */
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
