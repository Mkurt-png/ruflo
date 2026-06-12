// Achievement unlocks. One row per (email, achievement_id). Idempotent
// insert via on-conflict so the post-progress hook can re-evaluate freely.

import { getDb } from './supabase';
import { ensureUser } from './queries';

export type UnlockRow = { achievement_id: string; unlocked_at: string };

const TABLE = 'tickra_achievements';

export async function listUnlocked(email: string): Promise<UnlockRow[]> {
  const db = await getDb();
  if (!db) return [];
  const { data, error } = await db
    .from(TABLE)
    .select('achievement_id, unlocked_at')
    .eq('email', email);
  if (error || !data) return [];
  return data as UnlockRow[];
}

// Returns the list of achievement IDs that were INSERTED (i.e. newly
// unlocked) — duplicates are ignored. Callers can use this to fire side
// effects like Discord notifications without spamming on re-evaluation.
export async function recordUnlocks(
  email: string,
  achievementIds: string[],
): Promise<string[]> {
  const db = await getDb();
  if (!db || achievementIds.length === 0) return [];
  await ensureUser(email);

  const known = await listUnlocked(email);
  const known_ids = new Set(known.map((u) => u.achievement_id));
  const fresh = achievementIds.filter((id) => !known_ids.has(id));
  if (fresh.length === 0) return [];

  const rows = fresh.map((id) => ({ email, achievement_id: id }));
  const { error } = await db
    .from(TABLE)
    .upsert(rows, { onConflict: 'email,achievement_id', ignoreDuplicates: true });
  if (error) return [];
  return fresh;
}
