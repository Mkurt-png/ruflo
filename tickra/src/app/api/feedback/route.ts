import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isDbConfigured, recordFeedback } from '@/lib/db/queries';

// POST /api/feedback
// Body: { lessonId: string, vote: 'up' | 'down', note?: string }
// Accepts anonymous votes (session optional).

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { lessonId?: string; vote?: 'up' | 'down'; note?: string }
    | null;

  if (!body?.lessonId || (body.vote !== 'up' && body.vote !== 'down')) {
    return NextResponse.json({ error: 'lessonId and vote required' }, { status: 400 });
  }

  const session = getSession();
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, persisted: false, reason: 'db_not_configured' });
  }
  const ok = await recordFeedback({
    email: session?.email ?? null,
    lessonId: body.lessonId,
    vote: body.vote,
    note: body.note?.slice(0, 1000),
  });
  return NextResponse.json({ ok: true, persisted: ok, sessionPresent: Boolean(session) });
}
