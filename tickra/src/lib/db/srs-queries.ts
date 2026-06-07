// Spaced-repetition queries. Layered on top of tickra_mistakes (extended
// by migration 016). Keeps SM-2 state per (email, lesson_id).

import { getDb } from './supabase';
import { ensureUser } from './queries';
import { sm2Update, INITIAL_SRS_STATE, type Grade, type SrsState } from '@/lib/learning/sm2';

export type DueCard = {
  lesson_id: string;
  ease_factor: number;
  interval_days: number;
  next_review_at: string;
  consecutive_correct: number;
  review_count: number;
};

// Returns cards whose next_review_at <= now, ordered oldest-due first.
// Caps at `limit` so a giant backlog doesn't blow up the page.
export async function listDueReviews(email: string, limit = 50): Promise<DueCard[]> {
  const db = await getDb();
  if (!db) return [];
  const { data, error } = await db
    .from('tickra_mistakes')
    .select('lesson_id, ease_factor, interval_days, next_review_at, consecutive_correct, review_count')
    .eq('email', email)
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at', { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  return data as DueCard[];
}

// Convenience for the ReviewBanner — just count, don't fetch the rows.
export async function countDueReviews(email: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const { count, error } = await db
    .from('tickra_mistakes')
    .select('lesson_id', { count: 'exact', head: true })
    .eq('email', email)
    .lte('next_review_at', new Date().toISOString());
  if (error) return 0;
  return count ?? 0;
}

// Records a review outcome. Pulls current SRS state, runs SM-2, writes back.
// Returns the new state so the client can refresh its in-memory queue.
export async function recordReview(
  email: string,
  lessonId: string,
  grade: Grade,
): Promise<{ ok: true; nextReviewAt: string } | { ok: false; reason: string }> {
  const db = await getDb();
  if (!db) return { ok: false, reason: 'db_unavailable' };
  await ensureUser(email);

  const cur = await db
    .from('tickra_mistakes')
    .select('ease_factor, interval_days, consecutive_correct, review_count')
    .eq('email', email)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  const prev: SrsState = cur.data
    ? {
        easeFactor: Number((cur.data as { ease_factor?: number }).ease_factor ?? 2.5),
        intervalDays: Number((cur.data as { interval_days?: number }).interval_days ?? 1),
        consecutiveCorrect: Number((cur.data as { consecutive_correct?: number }).consecutive_correct ?? 0),
      }
    : INITIAL_SRS_STATE;

  const next = sm2Update(prev, grade);
  const prevCount = Number((cur.data as { review_count?: number } | null)?.review_count ?? 0);

  const { error } = await db.from('tickra_mistakes').upsert(
    {
      email,
      lesson_id: lessonId,
      ease_factor: next.easeFactor,
      interval_days: next.intervalDays,
      consecutive_correct: next.consecutiveCorrect,
      next_review_at: next.nextReviewAt.toISOString(),
      reviewed_at: new Date().toISOString(),
      review_count: prevCount + 1,
    },
    { onConflict: 'email,lesson_id' },
  );
  if (error) return { ok: false, reason: error.message };
  return { ok: true, nextReviewAt: next.nextReviewAt.toISOString() };
}

// Schedules a freshly-logged mistake into SRS (called from logMistake).
// Idempotent — only sets next_review_at if it's null. Safe to call repeatedly.
export async function scheduleNewMistake(email: string, lessonId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  // Only patch the row if next_review_at hasn't been set yet — preserves SM-2
  // state for cards the user has already reviewed.
  await db
    .from('tickra_mistakes')
    .update({ next_review_at: tomorrow })
    .eq('email', email)
    .eq('lesson_id', lessonId)
    .is('next_review_at', null);
}
