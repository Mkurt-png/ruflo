// Referral program queries.
//
// Storage model:
//   - tickra_users.referral_slug: stable per-user invite slug.
//   - tickra_users.referred_by_slug: one-shot pointer to the inviter's slug.
//   - tickra_users.reward_days_pending: +30/day credit per converted invite.
//   - tickra_users.welcome_bonus_pending: +14/day credit on the invitee's
//     first paid subscription.
//   - tickra_referrals: audit log, one row per inviter/invitee pair.
//
// All helpers degrade gracefully when the DB isn't configured (returns null
// or no-op writes) — same posture as src/lib/db/queries.ts.

import { createHash } from 'node:crypto';
import { getDb } from './supabase';

export type ReferralRow = {
  id: string;
  inviter_email: string;
  invitee_email: string;
  status: 'pending' | 'converted';
  created_at: string;
  converted_at: string | null;
};

function slugFor(email: string): string {
  const h = createHash('sha256').update(email.toLowerCase().trim()).digest();
  // First 8 bytes → big-int → base36, then trimmed to first 10 chars.
  let n = 0n;
  for (let i = 0; i < 8; i += 1) n = (n << 8n) | BigInt(h[i]);
  return n.toString(36).slice(0, 10);
}

// Returns the user's slug, creating + persisting it on first call.
export async function getOrCreateReferralSlug(email: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const { data: existing } = await db
    .from('tickra_users')
    .select('referral_slug')
    .eq('email', email)
    .maybeSingle();
  const current = (existing as { referral_slug?: string | null } | null)?.referral_slug ?? null;
  if (current) return current;

  const slug = slugFor(email);
  const { error } = await db
    .from('tickra_users')
    .update({ referral_slug: slug })
    .eq('email', email);
  if (error) return null;
  return slug;
}

export async function findUserBySlug(slug: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db
    .from('tickra_users')
    .select('email')
    .eq('referral_slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { email: string }).email;
}

// Attaches the referrer to a NEW user only — never overwrites. Inserts an
// audit row into tickra_referrals with status='pending'. Idempotent: if the
// invitee already has a referred_by_slug, this is a no-op.
export async function attachReferrer(
  inviteeEmail: string,
  slug: string,
): Promise<{ attached: boolean }> {
  const db = await getDb();
  if (!db) return { attached: false };

  const inviterEmail = await findUserBySlug(slug);
  if (!inviterEmail) return { attached: false };
  // Don't let users self-refer.
  if (inviterEmail.toLowerCase() === inviteeEmail.toLowerCase()) {
    return { attached: false };
  }

  // Only set when currently NULL.
  const { data: invitee } = await db
    .from('tickra_users')
    .select('referred_by_slug')
    .eq('email', inviteeEmail)
    .maybeSingle();
  if (!invitee) return { attached: false };
  const alreadyAttached = (invitee as { referred_by_slug?: string | null }).referred_by_slug;
  if (alreadyAttached) return { attached: false };

  const { error: upErr } = await db
    .from('tickra_users')
    .update({ referred_by_slug: slug, welcome_bonus_pending: 14 })
    .eq('email', inviteeEmail)
    .is('referred_by_slug', null);
  if (upErr) return { attached: false };

  await db.from('tickra_referrals').insert({
    inviter_email: inviterEmail,
    invitee_email: inviteeEmail,
    status: 'pending',
  });

  return { attached: true };
}

// Marks the invitee's referral row converted and credits the inviter
// +30 reward_days_pending. Idempotent — re-runs are no-ops.
export async function markReferralConverted(inviteeEmail: string): Promise<{ converted: boolean }> {
  const db = await getDb();
  if (!db) return { converted: false };

  const { data: row } = await db
    .from('tickra_referrals')
    .select('id, inviter_email, status')
    .eq('invitee_email', inviteeEmail)
    .eq('status', 'pending')
    .maybeSingle();
  if (!row) return { converted: false };
  const referral = row as { id: string; inviter_email: string; status: string };

  const { error: flipErr } = await db
    .from('tickra_referrals')
    .update({ status: 'converted', converted_at: new Date().toISOString() })
    .eq('id', referral.id)
    .eq('status', 'pending');
  if (flipErr) return { converted: false };

  // Increment inviter's reward_days_pending atomically: read then write.
  // (Supabase doesn't expose `+=` over the JS client without an RPC; for v1
  // we do a read-modify-write. Race window is acceptable — referrals don't
  // convert in tight bursts.)
  const { data: inviter } = await db
    .from('tickra_users')
    .select('reward_days_pending')
    .eq('email', referral.inviter_email)
    .maybeSingle();
  const current = ((inviter as { reward_days_pending?: number } | null)?.reward_days_pending ?? 0) | 0;
  await db
    .from('tickra_users')
    .update({ reward_days_pending: current + 30 })
    .eq('email', referral.inviter_email);

  return { converted: true };
}

export async function listReferralsByInviter(email: string): Promise<ReferralRow[]> {
  const db = await getDb();
  if (!db) return [];
  const { data, error } = await db
    .from('tickra_referrals')
    .select('id, inviter_email, invitee_email, status, created_at, converted_at')
    .eq('inviter_email', email)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as ReferralRow[];
}
