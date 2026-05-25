import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/session';

// POST or GET /api/auth/signout?locale=fr|en — clears the session cookie.
async function handle(req: Request) {
  const url = new URL(req.url);
  const locale = url.searchParams.get('locale') === 'fr' ? 'fr' : 'en';
  const response = NextResponse.redirect(new URL(`/${locale}/signin?signedout=1`, url));
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}

export const GET = handle;
export const POST = handle;
