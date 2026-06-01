// Public certificate verification queries.
//
// The "userId" used in /verify/<userId>/<trackId> URLs is the same opaque
// `share_slug` already minted for the public profile feature. It is stable,
// unique, derived from email + a private salt, and NEVER reveals email.
//
// Verification is intentionally always public — like a real diploma. It does
// NOT require share_public = true (that flag only gates the profile page).

import { getDb } from './supabase';

export type VerifiedCertificate = {
  displayName: string | null;
  trackId: string;
  completedAt: string; // ISO of the most recent lesson completion in that track
};

export async function verifyCertificate(
  shareSlug: string,
  trackId: string,
  trackLessonIds: string[],
): Promise<VerifiedCertificate | null> {
  if (!shareSlug || !trackId || trackLessonIds.length === 0) return null;
  const db = await getDb();
  if (!db) return null;

  const { data: userRow } = await db
    .from('tickra_users')
    .select('email, display_name')
    .eq('share_slug', shareSlug)
    .maybeSingle();
  const user = userRow as { email: string; display_name: string | null } | null;
  if (!user) return null;

  const { data: rows } = await db
    .from('tickra_progress')
    .select('lesson_id, completed_at')
    .eq('email', user.email)
    .in('lesson_id', trackLessonIds);
  const completed = (rows as { lesson_id: string; completed_at: string }[] | null) ?? [];
  const completedIds = new Set(completed.map((r) => r.lesson_id));
  const allDone = trackLessonIds.every((id) => completedIds.has(id));
  if (!allDone) return null;

  const latest = completed
    .map((r) => r.completed_at)
    .sort()
    .pop() ?? new Date().toISOString();

  return {
    displayName: user.display_name,
    trackId,
    completedAt: latest,
  };
}
