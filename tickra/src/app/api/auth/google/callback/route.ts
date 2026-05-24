import { NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';

// GET /api/auth/google/callback?code=…&state=…
//
// Exchanges the OAuth code for an access token, hits Google's userinfo endpoint,
// then sets the same signed session cookie as the magic-link flow.
//
// Env required:
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   AUTH_SIGNING_SECRET
//   NEXT_PUBLIC_SITE_URL

const COOKIE_NAME = 'tickra-session';
const STATE_COOKIE = 'tickra-oauth-state';
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 7;

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const signingSecret = process.env.AUTH_SIGNING_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  // Parse locale out of the state.
  const locale = state?.startsWith('fr.') ? 'fr' : 'en';
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/${locale}/signin?error=${encodeURIComponent(reason)}`, url));

  if (!code || !state) return fail('missing_code_or_state');
  if (!clientId || !clientSecret || !signingSecret) return fail('oauth_not_configured');

  // Verify state matches the cookie we set.
  const cookie = req.headers.get('cookie') ?? '';
  const cookieState = parseCookie(cookie, STATE_COOKIE);
  if (!cookieState || cookieState !== state) return fail('invalid_state');

  // Exchange code for token.
  let userEmail: string | null = null;
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${siteUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return fail('token_exchange_failed');
    const tokenJson = (await tokenRes.json()) as { access_token?: string; id_token?: string };
    if (!tokenJson.access_token) return fail('no_access_token');

    const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (!userRes.ok) return fail('userinfo_failed');
    const user = (await userRes.json()) as { email?: string };
    userEmail = user.email ?? null;
  } catch {
    return fail('oauth_network_error');
  }

  if (!userEmail) return fail('no_email');

  // Set the same signed session cookie as the magic-link flow.
  const sessionPayload = `${userEmail}.${Math.floor(Date.now() / 1000) + COOKIE_TTL_SECONDS}`;
  const sig = sign(sessionPayload, signingSecret);
  const value = `${Buffer.from(sessionPayload).toString('base64url')}.${sig}`;

  const redirect = NextResponse.redirect(new URL(`/${locale}/learn?session=success`, url));
  redirect.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_TTL_SECONDS,
  });
  // Clear the state cookie.
  redirect.cookies.set(STATE_COOKIE, '', {
    path: '/api/auth/google',
    maxAge: 0,
  });
  return redirect;
}

function parseCookie(header: string, name: string): string | null {
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}
