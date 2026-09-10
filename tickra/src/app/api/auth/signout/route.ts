import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/session';

// POST /api/auth/signout?locale=fr|en — clears the session cookie and bounces
// the user back to the localised home page.
//
// TICKRA-FIX: a default 307 redirect preserves the request method, so a POST
// signout landed on a GET-only page and triggered HTTP 405. Use 303 (See
// Other) to force a GET. Also redirect to "/<locale>" instead of
// "/<locale>/signin" so the user lands on the public landing, not on the
// sign-in form they just left.
//
// TICKRA-FIX(security): POST only. Signing out is a state change, and while it
// was reachable by GET *anything that fetches a URL could end a session* — a
// Next <Link> prefetch, an <img src>, a chat-app link preview, a crawler. That
// was not theoretical: the command palette rendered sign-out as a <Link>, and
// Next prefetches links as they enter the viewport, so merely opening ⌘K
// logged the user out. Both real sign-out buttons already POST via a <form>.
async function handle(req: Request) {
  const url = new URL(req.url);
  const locale = url.searchParams.get('locale') === 'fr' ? 'fr' : 'en';
  const response = NextResponse.redirect(new URL(`/${locale}`, url), { status: 303 });
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}

export const POST = handle;
