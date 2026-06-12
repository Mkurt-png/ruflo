// Public share profile queries.
//
// Storage model on tickra_users:
//   - share_slug: stable, unique slug for the public URL /u/<slug>.
//   - share_public: boolean visibility flag. When false the page 404s.
//   - share_stats: optional jsonb cache (not used by the server page —
//     stats are recomputed live — but reserved for future cron snapshots).
//
// All helpers degrade gracefully when the DB isn't configured (returns null
// or no-op writes) — same posture as referral-queries.ts.

import { createHash } from 'node:crypto';
import { getDb } from './supabase';

// Slug is derived from email but uses a different salt prefix than the
// referral slug so the two can't be cross-correlated.
function slugFor(email: string): string {
  const h = createHash('sha256').update(`share:${email.toLowerCase().trim()}`).digest();
  let n = 0n;
  for (let i = 0; i < 8; i += 1) n = (n << 8n) | BigInt(h[i]);
  return n.toString(36).slice(0, 10);
}

// Returns the user's share slug, creating + persisting it on first call.
// Does NOT flip share_public — visibility is controlled separately.
export async function getOrCreateShareSlug(email: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const { data: existing } = await db
    .from('tickra_users')
    .select('share_slug')
    .eq('email', email)
    .maybeSingle();
  const current = (existing as { share_slug?: string | null } | null)?.share_slug ?? null;
  if (current) return current;

  const slug = slugFor(email);
  const { error } = await db
    .from('tickra_users')
    .update({ share_slug: slug })
    .eq('email', email);
  if (error) return null;
  return slug;
}

// Resolves a slug to a public-safe user row. Returns null when the slug
// doesn't exist OR when share_public is false. Only exposes fields we are
// willing to render on a public page — never email, never customer ids.
export type PublicShareUser = {
  email: string; // internal lookup key — never rendered
  display_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'lifetime' | null;
  created_at: string | null;
};

export async function findUserBySlug(slug: string): Promise<PublicShareUser | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db
    .from('tickra_users')
    .select('email, display_name, avatar_url, plan, created_at, share_public')
    .eq('share_slug', slug)
    .eq('share_public', true)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as PublicShareUser & { share_public: boolean };
  return {
    email: row.email,
    display_name: row.display_name ?? null,
    avatar_url: row.avatar_url ?? null,
    plan: row.plan ?? null,
    created_at: row.created_at ?? null,
  };
}

// Toggle public visibility. Idempotent.
export async function updateShareVisibility(
  email: string,
  isPublic: boolean,
): Promise<{ ok: boolean }> {
  const db = await getDb();
  if (!db) return { ok: false };
  const { error } = await db
    .from('tickra_users')
    .update({ share_public: isPublic })
    .eq('email', email);
  return { ok: !error };
}

// Read current visibility flag without touching the slug.
export async function getShareVisibility(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const { data } = await db
    .from('tickra_users')
    .select('share_public')
    .eq('email', email)
    .maybeSingle();
  return Boolean((data as { share_public?: boolean } | null)?.share_public);
}
