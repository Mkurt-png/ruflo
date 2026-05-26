import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

// POST /api/feedback
// Body: { lessonId: string, vote: 'up' | 'down', note?: string }
//
// Lightweight feedback collector. Stores nothing by itself; would persist via
// the DB when wired. Accepts anonymous votes (session optional).

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { lessonId?: string; vote?: 'up' | 'down'; note?: string }
    | null;

  if (!body?.lessonId || (body.vote !== 'up' && body.vote !== 'down')) {
    return NextResponse.json({ error: 'lessonId and vote required' }, { status: 400 });
  }

  const session = getSession();

  // Real implementation: persist { lessonId, vote, note, email: session?.email, at: now() }.
  // Kept as a no-op so the endpoint behaves cleanly without a DB. Honest copy:
  return NextResponse.json({
    ok: true,
    persisted: false,
    sessionPresent: Boolean(session),
  });
}
