import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { consumeMagicNonce, ensureUser, isDbConfigured } from '@/lib/db/queries';
import { attachReferrer } from '@/lib/db/referral-queries';
import { postDiscord, formatSignup } from '@/lib/notify/discord';

const REF_COOKIE = 'tickra-ref';

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export const dynamic = 'force-dynamic';

// GET /api/auth/callback?token=…&locale=fr|en
// Verifies the magic-link token issued by /api/auth/magic-link, sets a session
// cookie, and redirects to /<locale>/onboarding?session=success.
//
// This route closes the auth loop initiated by SignInForm. The session cookie
// is signed but the actual user lookup lives downstream (Supabase / Postgres /
// whatever you wire in). For now we set a short-lived signed marker so the
// front-end can read `?session=success` and the UI can react.

const COOKIE_NAME = 'tickra-session';
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return timingSafeEqual(A, B);
}

// TICKRA-FIX: granular error codes so the signin page can show a human
// message + a "resend link" button on failure, instead of a generic "invalid".
const fail = (locale: 'fr' | 'en', reason: string, url: URL) =>
  NextResponse.redirect(new URL(`/${locale}/signin?error=${encodeURIComponent(reason)}`, url));

// TICKRA-FIX(auth): mail providers (Gmail, Outlook SafeLinks, corporate AV)
// pre-fetch links to scan them. Because the magic-link nonce is single-use,
// that scan consumed the token and the human's first click then failed with
// "expired" — the classic "works on the second try" report.
//
// Fix: GET no longer consumes anything. It only verifies the token shape and
// renders a tiny page that immediately re-submits it as a POST. Scanners issue
// plain GETs and run no JavaScript, so they can no longer burn the nonce; real
// browsers auto-submit instantly, so the user sees no extra step. A <noscript>
// button keeps it working without JavaScript.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function confirmPage(token: string, locale: 'fr' | 'en'): Response {
  const copy =
    locale === 'fr'
      ? { title: 'Connexion en cours…', button: 'Confirmer la connexion', hint: 'Un instant, nous vous connectons.' }
      : { title: 'Signing you in…', button: 'Confirm sign-in', hint: 'One moment, we are signing you in.' };
  const html = `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${copy.title}</title>
<style>
 body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:#F4F6FC;color:#111320;font:15px/1.5 ui-sans-serif,system-ui,sans-serif}
 .card{padding:32px;text-align:center}
 button{margin-top:16px;height:44px;padding:0 22px;border:0;border-radius:999px;
        background:#111320;color:#fff;font-size:15px;cursor:pointer}
</style>
</head>
<body>
<div class="card">
  <p>${copy.hint}</p>
  <form id="f" method="POST" action="/api/auth/callback">
    <input type="hidden" name="token" value="${escapeHtml(token)}">
    <input type="hidden" name="locale" value="${locale}">
    <noscript><button type="submit">${copy.button}</button></noscript>
  </form>
</div>
<script>document.getElementById('f').submit();</script>
</body>
</html>`;
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'referrer-policy': 'no-referrer',
    },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const locale = url.searchParams.get('locale') === 'fr' ? 'fr' : 'en';
  const secret = process.env.AUTH_SIGNING_SECRET;

  if (!secret) return fail(locale, 'not_configured', url);
  if (!token) return fail(locale, 'missing_token', url);

  // Hand off to POST without touching the nonce.
  return confirmPage(token, locale);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const form = await req.formData().catch(() => null);
  const token = typeof form?.get('token') === 'string' ? (form.get('token') as string) : null;
  const locale = form?.get('locale') === 'fr' ? 'fr' : 'en';
  const secret = process.env.AUTH_SIGNING_SECRET;

  if (!secret) return fail(locale, 'not_configured', url);
  if (!token) return fail(locale, 'missing_token', url);

  const parts = token.split('.');
  if (parts.length !== 2) return fail(locale, 'malformed_token', url);
  const [encodedPayload, sig] = parts;

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
  } catch {
    return fail(locale, 'bad_encoding', url);
  }

  const expected = sign(payload, secret);
  if (!safeEqual(expected, sig)) return fail(locale, 'bad_signature', url);

  // Magic-link payload is `<email>.<expiresAt>.<nonce>`. Emails contain dots,
  // so naive split('.') breaks. Pop the trailing two fields instead.
  const payloadParts = payload.split('.');
  if (payloadParts.length < 3) return fail(locale, 'bad_payload', url);
  const nonce = payloadParts.pop();
  const expiresAtStr = payloadParts.pop();
  const email = payloadParts.join('.');
  const expiresAt = Number(expiresAtStr);
  if (!email || !nonce || !Number.isFinite(expiresAt)) return fail(locale, 'bad_payload', url);
  // TICKRA-FIX: 30s clock-skew tolerance — some servers run slightly ahead
  // and tripped "expired" right at the boundary on first click.
  if (Date.now() / 1000 > expiresAt + 30) {
    return fail(locale, 'expired', url);
  }

  // TICKRA-FIX(security): consume the nonce once. If the row was already
  // marked used (replay), or doesn't exist (e.g. Gmail mailscanner already
  // tripped it), refuse to log in. When DB is not configured we fall back
  // to the previous best-effort behaviour so the auth flow still works in
  // dev — but in production with DB the nonce is single-use.
  if (isDbConfigured()) {
    const consumed = await consumeMagicNonce(nonce, email);
    if (!consumed) {
      return fail(locale, 'expired', url);
    }
    // TICKRA-FIX(auth): await the user row before issuing the session. It used
    // to be fire-and-forget, so the redirect could land on /onboarding before
    // the row existed and downstream reads (plan, progress) saw nothing.
    await ensureUser(email).catch(() => {
      /* swallow — a missing row must not block sign-in */
    });
    // Discord ping stays fire-and-forget: ensureUser is an upsert and doesn't
    // surface created-vs-found, so we always fire and let the channel dedupe.
    postDiscord('signups', formatSignup({ displayName: null })).catch(() => undefined);
  }

  // Referral wiring: if a tickra-ref cookie is present, attach inviter to
  // this (potentially brand-new) user once. Ensure the user row exists first
  // so the FK in tickra_referrals resolves.
  const refSlug = readCookie(req.headers.get('cookie'), REF_COOKIE);
  if (refSlug && isDbConfigured()) {
    await ensureUser(email).catch(() => undefined);
    await attachReferrer(email, refSlug).catch(() => undefined);
  }

  // Set a signed session marker. Replace with a real session ID from your store.
  const sessionPayload = `${email}.${Math.floor(Date.now() / 1000) + COOKIE_TTL_SECONDS}`;
  const sessionSig = sign(sessionPayload, secret);
  const sessionValue = `${Buffer.from(sessionPayload).toString('base64url')}.${sessionSig}`;

  const redirect = NextResponse.redirect(
    new URL(`/${locale}/onboarding?session=success`, url),
  );
  redirect.cookies.set(COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_TTL_SECONDS,
  });
  // Clear referral cookie once consumed.
  if (refSlug) {
    redirect.cookies.set(REF_COOKIE, '', { path: '/', maxAge: 0 });
  }
  return redirect;
}
