import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isDbConfigured, updateUser } from '@/lib/db/queries';

// POST /api/placement/submit
// Body: { score: number (0..6), recommendedTrackId: string }
//
// Persists the placement result on tickra_users when the caller is
// authenticated and the DB is configured. Returns ok with `persisted` flag
// either way so the client can render the recommendation regardless.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { score?: number; recommendedTrackId?: string }
    | null;
  if (!body || typeof body.score !== 'number' || !body.recommendedTrackId) {
    return NextResponse.json({ error: 'score + recommendedTrackId required' }, { status: 400 });
  }
  if (body.score < 0 || body.score > 6 || !Number.isInteger(body.score)) {
    return NextResponse.json({ error: 'score must be an integer 0..6' }, { status: 400 });
  }

  const session = getSession();
  if (!session) {
    return NextResponse.json({ ok: true, persisted: false, reason: 'not_authenticated' });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, persisted: false, reason: 'db_not_configured' });
  }

  await updateUser(session.email, {
    placement_track: body.recommendedTrackId,
    placement_score: body.score,
    placement_taken_at: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true, persisted: true });
}
