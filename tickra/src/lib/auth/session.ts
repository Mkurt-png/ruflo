// Server-side helpers to read and verify the nkNOWTrade session cookie.
//
// The session cookie is set by /api/auth/callback (magic-link) and
// /api/auth/google/callback (Google OAuth). Both use the same encoding:
//   value = base64url(`<email>.<expiresAt>`) + '.' + HMAC-SHA256
//
// `getSession()` returns { email } when the cookie is present and valid;
// `null` otherwise. Safe to call from any server component or route handler.

import * as React from 'react';
import { cookies } from 'next/headers';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { normaliseEmail } from './email';
import { getDb, isDbConfigured } from '@/lib/db/supabase';

export const SESSION_COOKIE = 'tickra-session';

/**
 * Lifetime of every session cookie, whichever way it was issued. Revocation
 * derives when a cookie was issued from `expiresAt − SESSION_TTL_SECONDS`, so
 * the issuers must all use this constant (session-ttl.test.ts checks).
 */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

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

/** A cookie value that verified, before the revocation check. */
export type DecodedSession = Session & { issuedAt: number; tokenHash: string };

/**
 * Verify a cookie value's signature and expiry. Pure: no I/O, so it is the
 * part that can be tested directly.
 */
export function decodeSession(
  cookie: string | undefined,
  secret: string | undefined,
  nowSeconds = Date.now() / 1000,
): DecodedSession | null {
  if (!secret || !cookie) return null;

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
  if (nowSeconds > expiresAt) return null;

  // Normalised on the way out, not only on the way in: cookies issued before
  // addresses were canonicalised are still valid for seven days, and their
  // payload carries whatever casing was typed. Without this, an existing
  // session keeps reading and writing a second, empty account until it expires.
  return {
    email: normaliseEmail(email),
    expiresAt,
    issuedAt: expiresAt - SESSION_TTL_SECONDS,
    tokenHash: hashToken(cookie),
  };
}

/** sha256 of the cookie value — what the revocation list stores. */
export function hashToken(cookie: string): string {
  return createHash('sha256').update(cookie).digest('hex');
}

// ─── Revocation ───────────────────────────────────────────────────────────
//
// A signed cookie is valid until it expires, whatever the server thinks —
// unless the server keeps a list. Sign-out used to clear the cookie in the
// browser that asked and nowhere else, so a copy (shared computer, synced
// profile, malware) stayed good for up to seven days. Account deletion did not
// end sessions either. Migration 024 adds the list; this asks it.
//
// Posture when the check cannot run — migration not applied yet, database
// down — is to ALLOW, and say so in the log. Revocation is a second line of
// defence behind the signature; failing closed would sign every user out
// whenever Supabase blinks, which is a worse outage than the risk it covers.

let warnedUnavailable = false;

// Per-request memoisation. `React.cache` exists in the React build Next uses
// on the server; the plain react package (tests, scripts) does not export it,
// and there a call per use is fine.
const perRequest: <F extends (...args: never[]) => unknown>(fn: F) => F =
  typeof (React as { cache?: unknown }).cache === 'function'
    ? (React as unknown as { cache: <F>(fn: F) => F }).cache
    : (fn) => fn;

async function stillValid(d: DecodedSession): Promise<boolean> {
  if (!isDbConfigured()) return true;
  const db = await getDb();
  if (!db) return true;
  const { data, error } = await db.rpc('tickra_session_valid', {
    p_email: d.email,
    p_issued_at: new Date(d.issuedAt * 1000).toISOString(),
    p_token_hash: d.tokenHash,
  });
  if (error || typeof data !== 'boolean') {
    if (!warnedUnavailable) {
      warnedUnavailable = true;
      console.warn('[session] revocation check unavailable (%s) — allowing', error?.message ?? 'no data');
    }
    return true;
  }
  return data;
}

/**
 * The signed-in user, or null. Verifies the signature, the expiry, and that
 * the session has not been revoked.
 *
 * Async because of the revocation check; `cache` makes it one database call
 * per request however many components ask.
 */
export const getSession = perRequest(async (): Promise<Session | null> => {
  const decoded = decodeSession(
    cookies().get(SESSION_COOKIE)?.value,
    process.env.AUTH_SIGNING_SECRET,
  );
  if (!decoded) return null;
  if (!(await stillValid(decoded))) return null;
  return { email: decoded.email, expiresAt: decoded.expiresAt };
});

/**
 * Revoke one cookie — this browser's session, on sign-out. Other devices stay
 * signed in. Best-effort: the cookie is cleared regardless.
 */
export async function revokeSession(cookie: string | undefined): Promise<void> {
  const decoded = decodeSession(cookie, process.env.AUTH_SIGNING_SECRET);
  if (!decoded || !isDbConfigured()) return;
  const db = await getDb();
  if (!db) return;
  const { error } = await db.rpc('tickra_revoke_session', {
    p_token_hash: decoded.tokenHash,
    p_expires_at: new Date(decoded.expiresAt * 1000).toISOString(),
  });
  if (error) console.warn('[session] could not revoke session: %s', error.message);
}

/**
 * Revoke every session for an address issued before now — on account
 * deletion. Returns false when it could not be recorded.
 */
export async function revokeAllSessions(email: string): Promise<boolean> {
  if (!isDbConfigured()) return false;
  const db = await getDb();
  if (!db) return false;
  const { error } = await db.rpc('tickra_revoke_all_sessions', { p_email: normaliseEmail(email) });
  if (error) {
    console.warn('[session] could not revoke all sessions: %s', error.message);
    return false;
  }
  return true;
}
