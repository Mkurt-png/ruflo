import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { setDigestOptIn } from '@/lib/db/digest-queries';

// POST /api/me/digest  body { optIn: boolean }
// Flips the current user's weekly_digest_opt_in flag.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { optIn?: boolean } | null;
  if (typeof body?.optIn !== 'boolean') {
    return NextResponse.json({ error: 'optIn required' }, { status: 400 });
  }
  const ok = await setDigestOptIn(session.email, body.optIn);
  return NextResponse.json({ ok });
}
