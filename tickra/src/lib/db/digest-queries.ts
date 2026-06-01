// Weekly digest support queries. Reads opt-in roster + per-user stats for
// the last 7 days. All writes are idempotent updates on tickra_users.

import { getDb } from './supabase';

export type DigestRecipient = {
  email: string;
  display_name: string | null;
  locale: 'fr' | 'en' | null;
  last_digest_at: string | null;
};

export type WeeklyStats = {
  xpThisWeek: number;
  lessonsThisWeek: number;
  streak: number;
};

export async function listDigestRecipients(): Promise<DigestRecipient[]> {
  const db = await getDb();
  if (!db) return [];
  const { data, error } = await db
    .from('tickra_users')
    .select('email, display_name, locale, last_digest_at, weekly_digest_opt_in')
    .eq('weekly_digest_opt_in', true);
  if (error || !data) return [];
  return (data as (DigestRecipient & { weekly_digest_opt_in: boolean })[]).map((r) => ({
    email: r.email,
    display_name: r.display_name,
    locale: r.locale,
    last_digest_at: r.last_digest_at,
  }));
}

export async function getWeeklyStats(email: string): Promise<WeeklyStats> {
  const db = await getDb();
  if (!db) return { xpThisWeek: 0, lessonsThisWeek: 0, streak: 0 };
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: weekRows } = await db
    .from('tickra_progress')
    .select('completed_at')
    .eq('email', email)
    .gte('completed_at', since);
  const lessonsThisWeek = (weekRows ?? []).length;
  const xpThisWeek = lessonsThisWeek * 25;

  // Streak: pull last 90 days of completions, dedupe by day, walk back from today/yesterday.
  const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: allRows } = await db
    .from('tickra_progress')
    .select('completed_at')
    .eq('email', email)
    .gte('completed_at', since90);
  const days = new Set<string>();
  for (const r of (allRows ?? []) as { completed_at: string }[]) {
    days.add(new Date(r.completed_at).toISOString().slice(0, 10));
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  let streak = 0;
  // Allow streak to anchor on today OR yesterday.
  const startOffset = days.has(today.toISOString().slice(0, 10)) ? 0 : 1;
  for (let i = startOffset; i < 365; i += 1) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    if (days.has(d.toISOString().slice(0, 10))) streak += 1;
    else break;
  }
  return { xpThisWeek, lessonsThisWeek, streak };
}

export async function recordDigestSent(email: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .from('tickra_users')
    .update({ last_digest_at: new Date().toISOString() })
    .eq('email', email);
}

export async function setDigestOptIn(email: string, optIn: boolean): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const { error } = await db
    .from('tickra_users')
    .update({ weekly_digest_opt_in: optIn })
    .eq('email', email);
  return !error;
}
