// POST /api/auth/webauthn/authenticate
// Body: { email, response }. Verifies the AuthenticationResponseJSON against
// the stored credential and the challenge cookie, then issues the same
// `tickra-session` cookie used by the magic-link flow.

import { NextResponse } from 'next/server';
import {
  buildSessionCookieValue,
  isWebAuthnAvailable,
  verifyAuthentication,
} from '@/lib/auth/passkeys';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { ensureUser, isDbConfigured } from '@/lib/db/queries';
import { getPasskey, updatePasskeyCounter } from '@/lib/db/passkeys-queries';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days — match magic-link callback

export async function POST(req: Request) {
  if (!(await isWebAuthnAvailable())) {
    return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  }

  let body: { email?: string; response?: unknown };
  try {
    body = (await req.json()) as { email?: string; response?: unknown };
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) return NextResponse.json({ error: 'bad_email' }, { status: 400 });
  if (!body.response) return NextResponse.json({ error: 'missing_response' }, { status: 400 });

  // Identify the credential by id from the response payload.
  const credentialId = (body.response as { id?: string }).id;
  if (!credentialId) return NextResponse.json({ error: 'missing_credential_id' }, { status: 400 });

  const stored = await getPasskey(credentialId);
  if (!stored) return NextResponse.json({ error: 'unknown_credential' }, { status: 404 });

  // Bind the credential to the claimed email — defence against passing
  // someone else's credential id under your own email.
  if (stored.email !== email) {
    return NextResponse.json({ error: 'email_mismatch' }, { status: 403 });
  }

  const result = await verifyAuthentication({
    response: body.response,
    credential: {
      credential_id: stored.credential_id,
      public_key: stored.public_key,
      counter: stored.counter,
      transports: stored.transports,
    },
  });
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });

  // Persist new counter (best-effort) and make sure the user row exists.
  await updatePasskeyCounter(result.credentialId, result.newCounter);
  if (isDbConfigured()) {
    ensureUser(email).catch(() => {
      /* swallow */
    });
  }

  const cookie = buildSessionCookieValue(email, SESSION_TTL_SECONDS);
  if (!cookie) return NextResponse.json({ error: 'not_configured' }, { status: 501 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, cookie.value, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: cookie.maxAge,
  });
  return res;
}
