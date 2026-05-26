// Typed query helpers for every Tickra table.
// Each helper returns a plain shape; errors surface as `null` for reads and
// `{ ok: false }` for writes — callers degrade gracefully when DB is unset.

import { getDb, isDbConfigured } from './supabase';

export type Plan = 'free' | 'pro' | 'lifetime';
export type Cycle = 'monthly' | 'annual' | 'once';

export type TickraUser = {
  email: string;
  created_at?: string;
  stripe_customer?: string | null;
  plan?: Plan | null;
  cycle?: Cycle | null;
  current_period_end?: string | null;
  placement_track?: string | null;
  placement_score?: number | null;
  placement_taken_at?: string | null;
  marketing_optin?: boolean | null;
};

export type ProgressRow = { lesson_id: string; completed_at: string };
export type MistakeRow = { lesson_id: string; logged_at: string; reviewed_at: string | null; review_count: number };
export type BookmarkRow = { lesson_id: string; starred_at: string };

// ─── Users ────────────────────────────────────────────────────────────────

export async function ensureUser(email: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.from('tickra_users').upsert({ email }, { onConflict: 'email' });
}

export async function updateUser(email: string, patch: Partial<TickraUser>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .from('tickra_users')
    .upsert({ email, ...patch }, { onConflict: 'email' });
}

export async function getUser(email: string): Promise<TickraUser | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db
    .from('tickra_users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) return null;
  return (data as TickraUser | null) ?? null;
}

export async function getUserByStripeCustomer(customerId: string): Promise<TickraUser | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db
    .from('tickra_users')
    .select('*')
    .eq('stripe_customer', customerId)
    .maybeSingle();
  if (error) return null;
  return (data as TickraUser | null) ?? null;
}

// ─── Progress ─────────────────────────────────────────────────────────────

export async function listProgress(email: string): Promise<ProgressRow[]> {
  const db = await getDb();
  if (!db) return [];
  const { data, error } = await db
    .from('tickra_progress')
    .select('lesson_id, completed_at')
    .eq('email', email);
  if (error || !data) return [];
  return data as ProgressRow[];
}

export async function markComplete(email: string, lessonId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await ensureUser(email);
  const { error } = await db
    .from('tickra_progress')
    .upsert(
      { email, lesson_id: lessonId, completed_at: new Date().toISOString() },
      { onConflict: 'email,lesson_id' },
    );
  return !error;
}

// ─── Mistakes ─────────────────────────────────────────────────────────────

export async function listMistakes(email: string): Promise<MistakeRow[]> {
  const db = await getDb();
  if (!db) return [];
  const { data, error } = await db
    .from('tickra_mistakes')
    .select('lesson_id, logged_at, reviewed_at, review_count')
    .eq('email', email);
  if (error || !data) return [];
  return data as MistakeRow[];
}

export async function logMistake(email: string, lessonId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await ensureUser(email);
  // Don't bump logged_at on repeated mistakes — only set on first log.
  const existing = await db
    .from('tickra_mistakes')
    .select('logged_at')
    .eq('email', email)
    .eq('lesson_id', lessonId)
    .maybeSingle();
  if (existing.data) return true;
  const { error } = await db
    .from('tickra_mistakes')
    .upsert(
      { email, lesson_id: lessonId, logged_at: new Date().toISOString() },
      { onConflict: 'email,lesson_id' },
    );
  return !error;
}

export async function markReviewed(email: string, lessonId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Read current count, increment, write back. Two trips, simple semantics.
  const cur = await db
    .from('tickra_mistakes')
    .select('review_count')
    .eq('email', email)
    .eq('lesson_id', lessonId)
    .maybeSingle();
  if (!cur.data) return false;
  const nextCount = ((cur.data as { review_count?: number }).review_count ?? 0) + 1;
  const { error } = await db
    .from('tickra_mistakes')
    .update({ reviewed_at: new Date().toISOString(), review_count: nextCount })
    .eq('email', email)
    .eq('lesson_id', lessonId);
  return !error;
}

// ─── Bookmarks ────────────────────────────────────────────────────────────

export async function listBookmarks(email: string): Promise<BookmarkRow[]> {
  const db = await getDb();
  if (!db) return [];
  const { data, error } = await db
    .from('tickra_bookmarks')
    .select('lesson_id, starred_at')
    .eq('email', email);
  if (error || !data) return [];
  return data as BookmarkRow[];
}

export async function setBookmark(email: string, lessonId: string, on: boolean): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await ensureUser(email);
  if (on) {
    const { error } = await db
      .from('tickra_bookmarks')
      .upsert(
        { email, lesson_id: lessonId, starred_at: new Date().toISOString() },
        { onConflict: 'email,lesson_id' },
      );
    return !error;
  }
  const { error } = await db
    .from('tickra_bookmarks')
    .delete()
    .eq('email', email)
    .eq('lesson_id', lessonId);
  return !error;
}

// ─── Feedback ─────────────────────────────────────────────────────────────

export async function recordFeedback(args: {
  email: string | null;
  lessonId: string;
  vote: 'up' | 'down';
  note?: string;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  if (args.email) await ensureUser(args.email);
  const { error } = await db.from('tickra_feedback').insert({
    email: args.email,
    lesson_id: args.lessonId,
    vote: args.vote,
    note: args.note ?? null,
  });
  return !error;
}

export { isDbConfigured };
