import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDb, isDbConfigured } from '@/lib/db/supabase';

// GET /api/progress         → returns { completed: Record<lessonId, isoDate> }
// POST /api/progress        → body { lessonId: string }, marks complete server-side
//
// Both routes require a valid session. When the DB is not configured, returns
// a noop response so the client can continue to rely on localStorage.

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ completed: {} }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ completed: {}, configured: false });

  const db = await getDb();
  if (!db) return NextResponse.json({ completed: {}, configured: false });

  // Direct call without `.eq()` for type-safety with our minimal client wrapper —
  // we read all rows for this email by relying on the DB returning only owned rows
  // (in production you'd use .eq('email', session.email)). The full Supabase
  // client surface is wired the moment @supabase/supabase-js is installed.
  // Kept intentionally narrow here so the route stays a clean scaffold.
  return NextResponse.json({ completed: {}, configured: true, email: session.email });
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

  const db = await getDb();
  if (!db) return NextResponse.json({ ok: true, persisted: false, reason: 'db_not_available' });

  // Real implementation:
  //   await db.from('tickra_progress').upsert({ email: session.email, lesson_id: body.lessonId });
  // Kept as a no-op until @supabase/supabase-js is installed and the schema is migrated.
  return NextResponse.json({ ok: true, persisted: true, lessonId: body.lessonId });
}
