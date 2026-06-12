// POST /api/auth/webauthn/register
// Authenticated. Accepts the RegistrationResponseJSON produced by
// navigator.credentials.create(), verifies it against the challenge cookie,
// and stores the credential in tickra_passkeys.

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { isWebAuthnAvailable, verifyRegistration } from '@/lib/auth/passkeys';
import { addPasskey } from '@/lib/db/passkeys-queries';

export async function POST(req: Request) {
  if (!(await isWebAuthnAvailable())) {
    return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  }
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { response?: unknown };
  try {
    body = (await req.json()) as { response?: unknown };
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }
  if (!body?.response) return NextResponse.json({ error: 'missing_response' }, { status: 400 });

  const result = await verifyRegistration({ response: body.response });
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });

  const stored = await addPasskey(session.email, {
    credential_id: result.credentialId,
    public_key: result.publicKey,
    counter: result.counter,
    transports: result.transports,
  });
  if (!stored) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
