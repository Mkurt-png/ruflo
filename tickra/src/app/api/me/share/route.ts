// /api/me/share — read and toggle the current user's public share profile.
//
// GET  → { slug, url, visible, plan } for the signed-in user. Always
//        materialises a slug (lazy create) so the UI can show the URL even
//        before the user flips visibility on.
// POST { visible: boolean } → flip share_public on or off. Returns the
//        updated config. Free users may still toggle (the public page works
//        for any plan), but the SharePanel UI gates this to Pro+.

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import {
  getOrCreateShareSlug,
  getShareVisibility,
  updateShareVisibility,
} from '@/lib/db/share-queries';
import { SITE_URL } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

function urlFor(locale: 'fr' | 'en', slug: string | null): string | null {
  if (!slug) return null;
  return `${SITE_URL}/${locale}/u/${slug}`;
}

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'db_not_configured' }, { status: 501 });
  }

  const user = await getUser(session.email);
  if (!user) return NextResponse.json({ error: 'no_user' }, { status: 404 });

  const slug = await getOrCreateShareSlug(session.email);
  const visible = await getShareVisibility(session.email);
  const locale: 'fr' | 'en' = user.locale ?? 'en';

  return NextResponse.json({
    slug,
    url: urlFor(locale, slug),
    visible,
    plan: user.plan ?? 'free',
  });
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'db_not_configured' }, { status: 501 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }
  const visible = Boolean((body as { visible?: unknown } | null)?.visible);

  const result = await updateShareVisibility(session.email, visible);
  if (!result.ok) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  const user = await getUser(session.email);
  const slug = await getOrCreateShareSlug(session.email);
  const locale: 'fr' | 'en' = user?.locale ?? 'en';

  return NextResponse.json({
    slug,
    url: urlFor(locale, slug),
    visible,
    plan: user?.plan ?? 'free',
  });
}
