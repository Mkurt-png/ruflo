import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getUser,
  listProgress,
  listMistakes,
  listBookmarks,
  isDbConfigured,
} from '@/lib/db/queries';

// GET /api/me/export
// Returns a JSON dump of every row attached to the current user.
// RGPD-style portability — let users grab their own data.

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'db_not_configured' }, { status: 501 });
  }

  const [user, progress, mistakes, bookmarks] = await Promise.all([
    getUser(session.email),
    listProgress(session.email),
    listMistakes(session.email),
    listBookmarks(session.email),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    email: session.email,
    user,
    progress,
    mistakes,
    bookmarks,
  };

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `tickra-export-${stamp}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  });
}
