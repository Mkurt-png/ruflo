import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { listPasskeys } from '@/lib/db/passkeys-queries';

export const dynamic = 'force-dynamic';

// GET /api/auth/webauthn/list
// Returns the current user's registered passkeys (metadata only).
export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ passkeys: [] });
  const passkeys = await listPasskeys(session.email);
  return NextResponse.json({
    passkeys: passkeys.map((p) => ({
      credential_id: p.credential_id,
      created_at: p.created_at,
      last_used_at: p.last_used_at,
      transports: p.transports,
    })),
  });
}
