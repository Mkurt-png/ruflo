import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { consumeMagicNonce, ensureUser, isDbConfigured } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

// GET /api/auth/callback?token=…&locale=fr|en
// Verifies the magic-link token issued by /api/auth/magic-link, sets a session
// cookie, and redirects to /<locale>/onboarding?session=success.
//
// This route closes the auth loop initiated by SignInForm. The session cookie
// is signed but the actual user lookup lives downstream (Supabase / Postgres /
// whatever you wire in). For now we set a short-lived signed marker so the
// front-end can read `?session=success` and the UI can react.

const COOKIE_NAME = 'tickra-session';
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return timingSafeEqual(A, B);
}

// TICKRA-FIX: granular error codes so the signin page can show a human
// message + a "resend link" button on failure, instead of a generic "invalid".
const fail = (locale: 'fr' | 'en', reason: string, url: URL) =>
  NextResponse.redirect(new URL(`/${locale}/signin?error=${encodeURIComponent(reason)}`, url));

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const locale = url.searchParams.get('locale') === 'fr' ? 'fr' : 'en';
  const secret = process.env.AUTH_SIGNING_SECRET;

  if (!secret) return fail(locale, 'not_configured', url);
  if (!token) return fail(locale, 'missing_token', url);

  const parts = token.split('.');
  if (parts.length !== 2) return fail(locale, 'malformed_token', url);
  const [encodedPayload, sig] = parts;

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
  } catch {
    return fail(locale, 'bad_encoding', url);
  }

  const expected = sign(payload, secret);
  if (!safeEqual(expected, sig)) return fail(locale, 'bad_signature', url);

  // Magic-link payload is `<email>.<expiresAt>.<nonce>`. Emails contain dots,
  // so naive split('.') breaks. Pop the trailing two fields instead.
  const payloadParts = payload.split('.');
  if (payloadParts.length < 3) return fail(locale, 'bad_payload', url);
  const nonce = payloadParts.pop();
  const expiresAtStr = payloadParts.pop();
  const email = payloadParts.join('.');
  const expiresAt = Number(expiresAtStr);
  if (!email || !nonce || !Number.isFinite(expiresAt)) return fail(locale, 'bad_payload', url);
  // TICKRA-FIX: 30s clock-skew tolerance — some servers run slightly ahead
  // and tripped "expired" right at the boundary on first click.
  if (Date.now() / 1000 > expiresAt + 30) {
    return fail(locale, 'expired', url);
  }

  // TICKRA-FIX(security): consume the nonce once. If the row was already
  // marked used (replay), or doesn't exist (e.g. Gmail mailscanner already
  // tripped it), refuse to log in. When DB is not configured we fall back
  // to the previous best-effort behaviour so the auth flow still works in
  // dev — but in production with DB the nonce is single-use.
  if (isDbConfigured()) {
    const consumed = await consumeMagicNonce(nonce, email);
    if (!consumed) {
      return fail(locale, 'expired', url);
    }
    // Now safe to ensure the user row.
    ensureUser(email).catch(() => {
      /* swallow */
    });
  }

  // Set a signed session marker. Replace with a real session ID from your store.
  const sessionPayload = `${email}.${Math.floor(Date.now() / 1000) + COOKIE_TTL_SECONDS}`;
  const sessionSig = sign(sessionPayload, secret);
  const sessionValue = `${Buffer.from(sessionPayload).toString('base64url')}.${sessionSig}`;

  const redirect = NextResponse.redirect(
    new URL(`/${locale}/onboarding?session=success`, url),
  );
  redirect.cookies.set(COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_TTL_SECONDS,
  });
  return redirect;
}
