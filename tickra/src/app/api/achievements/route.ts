import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isDbConfigured, listProgress, listMistakes, getUser } from '@/lib/db/queries';
import {
  ACHIEVEMENTS,
  buildSnapshot,
  evaluateAll,
} from '@/lib/achievements/catalog';
import { listUnlocked, recordUnlocks } from '@/lib/db/achievements-queries';
import { notifyAchievements } from '@/lib/achievements/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/achievements — returns catalog with unlock status. Triggers a
// re-evaluation server-side so users always see the latest unlocks even if
// the post-progress hook missed something (e.g. clock-based achievements
// like streak_7 that depend on wall-clock time, not on a write event).
export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const catalog = ACHIEVEMENTS.map((a) => ({
    id: a.id,
    tone: a.tone,
    title: a.title,
    description: a.description,
  }));

  if (!isDbConfigured()) {
    return NextResponse.json({ catalog, unlocked: [], configured: false });
  }

  const [progress, mistakes, knownUnlocks, user] = await Promise.all([
    listProgress(session.email),
    listMistakes(session.email),
    listUnlocked(session.email),
    getUser(session.email),
  ]);

  const snapshot = buildSnapshot({ progress, mistakes });
  const earnedNow = evaluateAll(snapshot);
  const fresh = await recordUnlocks(session.email, earnedNow);
  if (fresh.length > 0) {
    notifyAchievements(fresh, user?.display_name ?? null).catch(() => undefined);
  }

  // Merge known + fresh for the response.
  const knownMap = new Map(knownUnlocks.map((u) => [u.achievement_id, u.unlocked_at]));
  const nowIso = new Date().toISOString();
  for (const id of fresh) knownMap.set(id, nowIso);

  const unlocked = Array.from(knownMap.entries()).map(([id, unlocked_at]) => ({
    id,
    unlocked_at,
  }));

  return NextResponse.json({ catalog, unlocked, configured: true });
}
