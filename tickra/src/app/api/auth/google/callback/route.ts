import { NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { ensureUser, isDbConfigured } from '@/lib/db/queries';
import { attachReferrer } from '@/lib/db/referral-queries';
import { postDiscord, formatSignup } from '@/lib/notify/discord';
import { getSession } from '@/lib/auth/session';

const REF_COOKIE = 'tickra-ref';

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
  if (!cookieState || cookieState !== state) {
    // TICKRA-FIX: if the user already has a valid kNOWTrade session, the OAuth
    // flow is redundant — just send them home instead of surfacing a scary
    // "invalid_state" error. This covers the case where the state cookie
    // got dropped (browser quirk, narrow path, multiple tabs) but the user
    // actually IS authenticated.
    const existing = getSession();
    if (existing) {
      const ok = NextResponse.redirect(new URL(`/${locale}/learn?session=success`, url));
      ok.cookies.set(STATE_COOKIE, '', { path: '/', maxAge: 0 });
      // Also clear the legacy narrow-path cookie in case it's still around.
      ok.cookies.set(STATE_COOKIE, '', { path: '/api/auth/google', maxAge: 0 });
      return ok;
    }
    return fail('invalid_state');
  }

  // Exchange code for token.
  let userEmail: string | null = null;
  let userDisplayName: string | null = null;
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
    // TICKRA-FIX(security): UserInfo returns whatever Google says — but we
    // must also confirm the email is verified, otherwise an attacker with a
    // misconfigured external IdP federation could hand us an email that they
    // don't actually own. `email_verified` is a documented Google field.
    const user = (await userRes.json()) as { email?: string; email_verified?: boolean; name?: string };
    if (!user.email_verified) return fail('email_not_verified');
    userEmail = user.email ?? null;
    userDisplayName = user.name ?? null;
  } catch {
    return fail('oauth_network_error');
  }

  if (!userEmail) return fail('no_email');

  // Persist the user row immediately so it appears in Supabase as soon as
  // someone signs in. Fire-and-forget — no need to block the redirect on it.
  if (isDbConfigured()) {
    ensureUser(userEmail)
      .then(() => {
        // Fire-and-forget Discord ping on signup (upsert means we always fire;
        // channel mods can dedupe). Display name from Google userinfo when
        // available, anonymous fallback otherwise — never emit the email.
        postDiscord('signups', formatSignup({ displayName: userDisplayName })).catch(() => undefined);
      })
      .catch(() => {
        /* swallow — login still succeeds, the row will be created on the next
           /api/me/profile or /api/progress write. */
      });
  }

  // Referral wiring: consume tickra-ref cookie (set by /[locale]/r/[slug]).
  // Wait on ensureUser before attach so the FK resolves.
  const refSlug = parseCookie(cookie, REF_COOKIE);
  if (refSlug && isDbConfigured()) {
    await ensureUser(userEmail).catch(() => undefined);
    await attachReferrer(userEmail, refSlug).catch(() => undefined);
  }

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
  // Clear the state cookie. We clear BOTH the new path '/' and the legacy
  // narrow path '/api/auth/google' so stale cookies from old deploys don't
  // linger in the browser's cookie jar.
  redirect.cookies.set(STATE_COOKIE, '', { path: '/', maxAge: 0 });
  redirect.cookies.set(STATE_COOKIE, '', { path: '/api/auth/google', maxAge: 0 });
  // Clear referral cookie once consumed.
  if (refSlug) {
    redirect.cookies.set(REF_COOKIE, '', { path: '/', maxAge: 0 });
  }
  return redirect;
}

function parseCookie(header: string, name: string): string | null {
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}
