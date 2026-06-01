// Weekly leaderboard queries.
//
// Reads from the `tickra_leaderboard_weekly` view (migration 013). The view
// aggregates the last 7 days of `tickra_progress` and joins user metadata
// (display_name, share_slug, share_public) so we can decide per-row whether
// to surface the real identity or anonymize.
//
// Privacy contract:
//   - email is NEVER returned to callers
//   - displayName is null unless the row's share_public = true
//   - anonymized rows expose a stable opaque tag (`anonHash`) derived from
//     sha256(email); the page renders "Trader #<hash>"
//
// Degrades gracefully: returns empty arrays when the DB isn't configured
// (so the page can still render an empty state during local dev).

import { createHash } from 'node:crypto';
import { getDb } from './supabase';

export type LeaderboardEntry = {
  rank: number;
  displayName: string | null;
  slug: string | null;
  anonHash: string; // always present; stable per-email; safe to render
  xp: number;
  streak: number;
  isPublic: boolean;
};

export type WeeklyLeaderboard = {
  topXp: LeaderboardEntry[];
  topStreak: LeaderboardEntry[];
};

type ViewRow = {
  email: string;
  lessons_week: number | null;
  xp_week: number | null;
  current_streak: number | null;
  display_name: string | null;
  share_slug: string | null;
  share_public: boolean | null;
};

function anonHash(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 4);
}

function toEntry(row: ViewRow, rank: number): LeaderboardEntry {
  const isPublic = Boolean(row.share_public);
  return {
    rank,
    displayName: isPublic ? row.display_name ?? null : null,
    slug: isPublic ? row.share_slug ?? null : null,
    anonHash: anonHash(row.email),
    xp: row.xp_week ?? 0,
    streak: row.current_streak ?? 0,
    isPublic,
  };
}

export async function getWeeklyLeaderboard(): Promise<WeeklyLeaderboard> {
  const db = await getDb();
  if (!db) return { topXp: [], topStreak: [] };

  const [{ data: xpRows }, { data: streakRows }] = await Promise.all([
    db
      .from('tickra_leaderboard_weekly')
      .select('email, lessons_week, xp_week, current_streak, display_name, share_slug, share_public')
      .order('xp_week', { ascending: false })
      .limit(20),
    db
      .from('tickra_leaderboard_weekly')
      .select('email, lessons_week, xp_week, current_streak, display_name, share_slug, share_public')
      .order('current_streak', { ascending: false })
      .limit(20),
  ]);

  const topXp = ((xpRows as ViewRow[] | null) ?? [])
    .filter((r) => (r.xp_week ?? 0) > 0)
    .map((r, i) => toEntry(r, i + 1));

  const topStreak = ((streakRows as ViewRow[] | null) ?? [])
    .filter((r) => (r.current_streak ?? 0) > 0)
    .map((r, i) => toEntry(r, i + 1));

  return { topXp, topStreak };
}
