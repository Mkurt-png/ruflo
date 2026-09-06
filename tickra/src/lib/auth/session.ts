// Server-side helpers to read and verify the kNOWTrade session cookie.
//
// The session cookie is set by /api/auth/callback (magic-link) and
// /api/auth/google/callback (Google OAuth). Both use the same encoding:
//   value = base64url(`<email>.<expiresAt>`) + '.' + HMAC-SHA256
//
// `getSession()` returns { email } when the cookie is present and valid;
// `null` otherwise. Safe to call from any server component or route handler.

import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'tickra-session';

export type Session = {
  email: string;
  expiresAt: number; // unix seconds
};

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return timingSafeEqual(A, B);
}

export function getSession(): Session | null {
  const secret = process.env.AUTH_SIGNING_SECRET;
  if (!secret) return null;

  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  const parts = cookie.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, sig] = parts;

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  if (!safeEqual(sign(payload, secret), sig)) return null;

  // expiresAt is a plain integer at the end of the payload. Emails contain
  // dots (`foo@bar.com`), so we split on the LAST `.` only — never on every
  // dot, otherwise `Number("com")` returns NaN and we lose every session.
  const lastDot = payload.lastIndexOf('.');
  if (lastDot < 0) return null;
  const email = payload.slice(0, lastDot);
  const expiresAtStr = payload.slice(lastDot + 1);
  const expiresAt = Number(expiresAtStr);
  if (!email || !Number.isFinite(expiresAt)) return null;
  if (Date.now() / 1000 > expiresAt) return null;

  return { email, expiresAt };
}
