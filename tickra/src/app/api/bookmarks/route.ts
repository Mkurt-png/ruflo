import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isDbConfigured, listBookmarks, setBookmark } from '@/lib/db/queries';

// GET  /api/bookmarks                → { bookmarks: { lessonId: starredAtMs }, configured }
// POST /api/bookmarks  { lessonId, on } → toggles

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ bookmarks: {}, configured: false }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ bookmarks: {}, configured: false });
  }
  const rows = await listBookmarks(session.email);
  const bookmarks: Record<string, number> = {};
  for (const r of rows) bookmarks[r.lesson_id] = new Date(r.starred_at).getTime();
  return NextResponse.json({ bookmarks, configured: true });
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { lessonId?: string; on?: boolean } | null;
  if (!body?.lessonId || typeof body.on !== 'boolean') {
    return NextResponse.json({ error: 'lessonId + on required' }, { status: 400 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, persisted: false, reason: 'db_not_configured' });
  }
  const ok = await setBookmark(session.email, body.lessonId, body.on);
  return NextResponse.json({ ok: true, persisted: ok });
}
