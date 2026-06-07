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
  display_name?: string | null;
  avatar_url?: string | null;
  locale?: 'fr' | 'en' | null;
  theme?: 'light' | 'dark' | null;
  weekly_digest_opt_in?: boolean | null;
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

export async function deleteUser(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Cascade through the foreign keys removes progress/mistakes/bookmarks too.
  const { error } = await db.from('tickra_users').delete().eq('email', email);
  return !error;
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
  // TICKRA-PHASE-5A: schedule the new mistake into SRS — due tomorrow with
  // default ease/interval. Migration 016 added next_review_at; safe-default
  // on inserts so the card surfaces in /review the next day.
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await db
    .from('tickra_mistakes')
    .upsert(
      {
        email,
        lesson_id: lessonId,
        logged_at: new Date().toISOString(),
        next_review_at: tomorrow,
      },
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

// ─── Personalised 14-day plan ────────────────────────────────────────────

export type PlanEntry = { day_index: number; lesson_id: string };

export async function getUserPlan(email: string): Promise<PlanEntry[]> {
  const db = await getDb();
  if (!db) return [];
  const { data, error } = await db
    .from('tickra_user_plan')
    .select('day_index, lesson_id')
    .eq('email', email)
    .order('day_index', { ascending: true });
  if (error || !data) return [];
  return data as PlanEntry[];
}

export async function setUserPlan(email: string, entries: PlanEntry[]): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await ensureUser(email);
  await db.from('tickra_user_plan').delete().eq('email', email);
  if (entries.length === 0) return true;
  const rows = entries.map((e) => ({ email, day_index: e.day_index, lesson_id: e.lesson_id }));
  const { error } = await db.from('tickra_user_plan').insert(rows);
  return !error;
}

// ─── Notifications log ───────────────────────────────────────────────────

export async function recordNotification(email: string, kind: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .from('tickra_notifications')
    .upsert({ email, kind, sent_at: new Date().toISOString() }, { onConflict: 'email,kind' });
}

export async function lastNotificationAt(email: string, kind: string): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db
    .from('tickra_notifications')
    .select('sent_at')
    .eq('email', email)
    .eq('kind', kind)
    .maybeSingle();
  if (error || !data) return null;
  return new Date(data.sent_at).getTime();
}

export async function listUsersForDailyNotifications(): Promise<Array<{ email: string; plan: string | null }>> {
  const db = await getDb();
  if (!db) return [];
  const { data, error } = await db
    .from('tickra_users')
    .select('email, plan')
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error || !data) return [];
  return data as Array<{ email: string; plan: string | null }>;
}

// ─── Magic-link nonces ───────────────────────────────────────────────────

export async function recordMagicNonce(
  email: string,
  nonce: string,
  expiresAt: number,
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const { error } = await db.from('tickra_magic_nonces').insert({
    nonce,
    email,
    expires_at: new Date(expiresAt * 1000).toISOString(),
  });
  return !error;
}

// Consume returns true exactly once per nonce, false on every other call
// (including replays, expired, or unknown nonces).
export async function consumeMagicNonce(
  nonce: string,
  email: string,
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const { data, error } = await db
    .from('tickra_magic_nonces')
    .update({ used_at: new Date().toISOString() })
    .eq('nonce', nonce)
    .eq('email', email)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('nonce')
    .maybeSingle();
  if (error || !data) return false;
  return true;
}

// ─── Stripe event idempotency ─────────────────────────────────────────────
// One row per processed event.id so retries are no-ops.

export async function alreadyProcessedStripeEvent(eventId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const { data } = await db
    .from('tickra_stripe_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle();
  return Boolean(data);
}

export async function markStripeEventProcessed(eventId: string, type: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.from('tickra_stripe_events').upsert({ id: eventId, type }, { onConflict: 'id' });
}

// ─── User update (non-creating) ───────────────────────────────────────────
// Webhook should never CREATE a row from Stripe data alone — only UPDATE
// existing users. This avoids "gift-pwn" where an attacker provides a
// victim's email at checkout and creates a Pro row for them.

export async function updateExistingUser(
  email: string,
  patch: Partial<TickraUser>,
): Promise<{ updated: boolean }> {
  const db = await getDb();
  if (!db) return { updated: false };
  const { data, error } = await db
    .from('tickra_users')
    .update(patch)
    .eq('email', email)
    .select('email')
    .maybeSingle();
  if (error || !data) return { updated: false };
  return { updated: true };
}

export { isDbConfigured };
