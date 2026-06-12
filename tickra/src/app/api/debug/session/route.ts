import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { isDebugAuthorised } from '@/lib/debug/gate';

export const dynamic = 'force-dynamic';

// GET /api/debug/session
// TICKRA-FIX(security): never returns the session email anymore (was a
// fingerprinting/XSS amplifier). Only presence/length. Production callers
// still need `x-debug-token: $DEBUG_TOKEN`.
export async function GET(req: Request) {
  const gate = isDebugAuthorised(req);
  if (!gate.ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const sessionCookie = cookies().get(SESSION_COOKIE);
  return NextResponse.json({
    runtime: process.env.VERCEL_ENV ?? 'local',
    region: process.env.VERCEL_REGION ?? null,
    authSigningSecret: {
      present: typeof process.env.AUTH_SIGNING_SECRET === 'string',
    },
    siteUrlConfigured: typeof process.env.NEXT_PUBLIC_SITE_URL === 'string',
    sessionCookie: {
      present: Boolean(sessionCookie),
    },
  });
}
