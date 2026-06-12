import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';

// GET /api/auth/google?locale=fr|en
//
// Starts the Google OAuth flow when configured. Env required:
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET   (used by the callback route)
//   NEXT_PUBLIC_SITE_URL   (e.g. https://tickra.com)
//
// Without those, redirects back to /signin?error=oauth_not_configured.

const SCOPES = ['openid', 'email', 'profile'];
const COOKIE_NAME = 'tickra-oauth-state';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale = url.searchParams.get('locale') === 'fr' ? 'fr' : 'en';

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  if (!clientId) {
    return NextResponse.redirect(new URL(`/${locale}/signin?error=oauth_not_configured`, url));
  }

  const state = `${locale}.${randomBytes(16).toString('base64url')}`;
  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES.join(' '));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'online');
  authUrl.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(authUrl);
  // TICKRA-FIX: path '/' (not '/api/auth/google') so the cookie is reliably
  // sent on the callback request across every browser / proxy / preview
  // deployment. The narrow path caused intermittent "invalid_state" errors
  // where the first OAuth attempt failed but the second worked (because
  // re-running the start route would refresh the cookie with the correct
  // path semantics in the browser's cookie jar).
  response.cookies.set(COOKIE_NAME, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return response;
}
