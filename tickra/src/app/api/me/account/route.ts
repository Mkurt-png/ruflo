import { NextResponse } from 'next/server';
import { getSession, revokeAllSessions, SESSION_COOKIE } from '@/lib/auth/session';
import { deleteUser, isDbConfigured } from '@/lib/db/queries';

// DELETE /api/me/account
// Erases the user row + cascades all related data (progress, mistakes,
// bookmarks). Clears the session cookie. Body { confirm: 'DELETE' } required
// to prevent accidental triggers from generic clients.

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { confirm?: string } | null;
  if (body?.confirm !== 'DELETE') {
    return NextResponse.json({ error: 'missing_confirmation' }, { status: 400 });
  }

  if (isDbConfigured()) {
    // Before the delete, and on every device: a session left alive on another
    // browser would recreate the row on its next write, bringing back an
    // account its owner asked us to erase.
    await revokeAllSessions(session.email);
    await deleteUser(session.email);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
