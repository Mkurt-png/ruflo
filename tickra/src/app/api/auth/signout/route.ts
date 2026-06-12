import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/session';

// POST or GET /api/auth/signout?locale=fr|en — clears the session cookie
// and bounces the user back to the localised home page.
//
// TICKRA-FIX: a default 307 redirect preserves the request method, so a POST
// signout landed on a GET-only page and triggered HTTP 405. Use 303 (See
// Other) to force a GET. Also redirect to "/<locale>" instead of
// "/<locale>/signin" so the user lands on the public landing, not on the
// sign-in form they just left.
async function handle(req: Request) {
  const url = new URL(req.url);
  const locale = url.searchParams.get('locale') === 'fr' ? 'fr' : 'en';
  const response = NextResponse.redirect(new URL(`/${locale}`, url), { status: 303 });
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}

export const GET = handle;
export const POST = handle;
