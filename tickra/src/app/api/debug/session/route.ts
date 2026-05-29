import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, SESSION_COOKIE } from '@/lib/auth/session';

// Per-request diagnostic — never cache, always read live cookies.
export const dynamic = 'force-dynamic';

// GET /api/debug/session
// Returns what the server sees: is the session cookie present, is it valid,
// is AUTH_SIGNING_SECRET set, etc. Safe to keep public — leaks no secrets.
export async function GET() {
  const sessionCookie = cookies().get(SESSION_COOKIE);
  const session = getSession();
  return NextResponse.json({
    runtime: process.env.VERCEL_ENV ?? 'local',
    region: process.env.VERCEL_REGION ?? null,
    authSigningSecret: {
      present: typeof process.env.AUTH_SIGNING_SECRET === 'string',
      length: process.env.AUTH_SIGNING_SECRET?.length ?? 0,
    },
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    cookie: {
      present: Boolean(sessionCookie),
      length: sessionCookie?.value.length ?? 0,
    },
    session: session ? { email: session.email, expiresAt: session.expiresAt } : null,
  });
}
