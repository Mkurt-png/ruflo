import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { deletePasskey } from '@/lib/db/passkeys-queries';

export const dynamic = 'force-dynamic';

// POST /api/auth/webauthn/remove   { credentialId }
// Removes the passkey from the current user. Requires a live session.
export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { credentialId?: string } | null;
  if (!body?.credentialId) {
    return NextResponse.json({ error: 'missing_credential_id' }, { status: 400 });
  }
  const ok = await deletePasskey(session.email, body.credentialId);
  if (!ok) return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
