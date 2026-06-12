import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isDbConfigured, updateUser } from '@/lib/db/queries';

// POST /api/placement
// Body: { trackSlug: string, score?: number }

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { trackSlug?: string; score?: number }
    | null;
  if (!body?.trackSlug) {
    return NextResponse.json({ error: 'trackSlug required' }, { status: 400 });
  }

  const session = getSession();
  if (!session) {
    return NextResponse.json({ ok: true, persisted: false, reason: 'not_authenticated' });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, persisted: false, reason: 'db_not_configured' });
  }

  await updateUser(session.email, {
    placement_track: body.trackSlug,
    placement_score: typeof body.score === 'number' ? body.score : null,
    placement_taken_at: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true, persisted: true });
}
