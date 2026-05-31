// POST /api/auth/webauthn/authenticate-options
// Body: { email }. Returns PublicKeyCredentialRequestOptionsJSON listing the
// credentials registered to that email. Unauthenticated — this is the first
// step of an email-then-passkey signin flow.

import { NextResponse } from 'next/server';
import { generateAuthenticationOptions, isWebAuthnAvailable } from '@/lib/auth/passkeys';
import { listPasskeys } from '@/lib/db/passkeys-queries';

export async function POST(req: Request) {
  if (!(await isWebAuthnAvailable())) {
    return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  }

  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'bad_email' }, { status: 400 });
  }

  const credentials = await listPasskeys(email);
  // Don't leak whether the user exists — return empty allowCredentials when
  // none registered. The browser will surface an appropriate UX error.
  const options = await generateAuthenticationOptions({
    allowCredentialIds: credentials.map((c) => c.credential_id),
  });
  if (!options) return NextResponse.json({ error: 'not_configured' }, { status: 501 });

  return NextResponse.json({ options });
}
