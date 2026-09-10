import { NextResponse } from 'next/server';
import { pickCard, type Locale } from '@/lib/curriculum/daily-card';

// GET /api/daily-challenge?locale=fr|en — today's card, and only today's.
//
// The picking logic lives in lib/curriculum/daily-card (a route file may only
// export route handlers and config). See that module for why this is served
// from the server at all.

export const runtime = 'nodejs';
// The answer rolls over at UTC midnight, so it must not be baked into the build.
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale: Locale = url.searchParams.get('locale') === 'fr' ? 'fr' : 'en';
  const card = pickCard(locale);
  if (!card) return NextResponse.json({ error: 'no_content' }, { status: 404 });
  return NextResponse.json(
    { card },
    // Same answer for everyone until UTC midnight; let the CDN hold it briefly
    // rather than rebuilding the index on every account-page load.
    { headers: { 'cache-control': 'public, max-age=300, stale-while-revalidate=3600' } },
  );
}
