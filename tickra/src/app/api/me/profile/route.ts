import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { ensureUser, getUser, isDbConfigured, updateUser } from '@/lib/db/queries';

// GET   /api/me/profile    → user row (or { configured: false } when DB unset)
// PATCH /api/me/profile    body: { display_name?, avatar_url?, locale?, theme?, marketing_optin? }

type PatchBody = Partial<{
  display_name: string | null;
  avatar_url: string | null;
  locale: 'fr' | 'en';
  theme: 'light' | 'dark';
  marketing_optin: boolean;
}>;

function clip(s: string | null | undefined, n: number): string | null {
  if (typeof s !== 'string') return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, n);
}

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ user: null, configured: isDbConfigured() }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ user: { email: session.email }, configured: false });
  }
  await ensureUser(session.email);
  const user = await getUser(session.email);
  return NextResponse.json({ user, configured: true });
}

export async function PATCH(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, persisted: false, reason: 'db_not_configured' });
  }

  const patch: Parameters<typeof updateUser>[1] = {};
  if ('display_name' in body) patch.display_name = clip(body.display_name, 64);
  if ('avatar_url' in body) patch.avatar_url = clip(body.avatar_url, 500);
  if (body.locale === 'fr' || body.locale === 'en') patch.locale = body.locale;
  if (body.theme === 'light' || body.theme === 'dark') patch.theme = body.theme;
  if (typeof body.marketing_optin === 'boolean') patch.marketing_optin = body.marketing_optin;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true, persisted: false, reason: 'no_fields' });
  }

  await updateUser(session.email, patch);
  return NextResponse.json({ ok: true, persisted: true });
}
