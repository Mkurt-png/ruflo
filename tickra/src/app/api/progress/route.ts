import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isDbConfigured, listProgress, listMistakes, markComplete } from '@/lib/db/queries';

// GET  /api/progress    → { completed, mistakes, configured }
// POST /api/progress    body { lessonId } → marks complete server-side
//
// Both endpoints require a valid session. When the DB is not configured, they
// return cleanly so the client can continue to rely on localStorage.

export async function GET() {
  const session = getSession();
  if (!session) {
    // No session — return `configured` based on DB env state, not on auth.
    // This way the same endpoint can answer "is the DB wired?" before login.
    return NextResponse.json(
      { completed: {}, mistakes: {}, configured: isDbConfigured(), authenticated: false },
      { status: 401 },
    );
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ completed: {}, mistakes: {}, configured: false, authenticated: true });
  }

  const [rows, mistakes] = await Promise.all([
    listProgress(session.email),
    listMistakes(session.email),
  ]);

  const completed: Record<string, number> = {};
  for (const r of rows) completed[r.lesson_id] = new Date(r.completed_at).getTime();

  const m: Record<string, { lessonId: string; loggedAt: number; reviewedAt?: number }> = {};
  for (const r of mistakes) {
    m[r.lesson_id] = {
      lessonId: r.lesson_id,
      loggedAt: new Date(r.logged_at).getTime(),
      reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).getTime() : undefined,
    };
  }

  return NextResponse.json({ completed, mistakes: m, configured: true, email: session.email });
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { lessonId?: string } | null;
  if (!body?.lessonId) {
    return NextResponse.json({ error: 'lessonId required' }, { status: 400 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, persisted: false, reason: 'db_not_configured' });
  }

  const ok = await markComplete(session.email, body.lessonId);
  return NextResponse.json({ ok: true, persisted: ok, lessonId: body.lessonId });
}
