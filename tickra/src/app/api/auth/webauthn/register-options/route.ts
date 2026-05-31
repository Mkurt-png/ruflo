// POST /api/auth/webauthn/register-options
// Authenticated. Returns PublicKeyCredentialCreationOptionsJSON for the client
// to feed into navigator.credentials.create(). Also writes the challenge into
// an httpOnly cookie that the matching /register endpoint reads back.

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { generateRegistrationOptions, isWebAuthnAvailable } from '@/lib/auth/passkeys';
import { listPasskeys } from '@/lib/db/passkeys-queries';

export async function POST() {
  if (!(await isWebAuthnAvailable())) {
    return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  }
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const existing = await listPasskeys(session.email);
  const options = await generateRegistrationOptions({
    email: session.email,
    existingCredentialIds: existing.map((p) => p.credential_id),
  });
  if (!options) return NextResponse.json({ error: 'not_configured' }, { status: 501 });

  return NextResponse.json({ options });
}
