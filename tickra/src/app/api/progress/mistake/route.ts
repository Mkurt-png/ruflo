import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isDbConfigured, logMistake } from '@/lib/db/queries';

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { lessonId?: string } | null;
  if (!body?.lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 });

  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, persisted: false, reason: 'db_not_configured' });
  }
  const ok = await logMistake(session.email, body.lessonId);
  return NextResponse.json({ ok: true, persisted: ok });
}
