import { NextResponse } from 'next/server';
import { createHmac, randomBytes } from 'node:crypto';
import { FROM, sendEmail } from '@/lib/email/resend';
import { isDbConfigured, recordMagicNonce } from '@/lib/db/queries';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';

// TICKRA-FIX(security): throttle sign-in mail. Without this, the endpoint can
// be looped to mail any address through our Resend domain (quota burn + spam
// reputation). Two buckets so one abuser can't mail-bomb a single victim, and
// can't fan out across many victims either.
const EMAIL_LIMIT = 5;      // per address
const EMAIL_WINDOW = 15 * 60;
const IP_LIMIT = 15;        // per source IP
const IP_WINDOW = 60 * 60;

export const dynamic = 'force-dynamic';

// POST /api/auth/magic-link   { email, locale? }
//
// Generates a single-use signed token (HMAC-SHA256), emails the magic link.
// The actual session creation lives at GET /api/auth/callback (not in this PR —
// requires a session store / DB). This endpoint is wired so the front-end flow
// works end-to-end as soon as AUTH_SIGNING_SECRET is set.

const TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

function emailLooksValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; locale?: 'fr' | 'en' }
    | null;

  if (!body?.email || !emailLooksValid(body.email)) {
    return NextResponse.json({ error: 'valid email is required' }, { status: 400 });
  }

  const email = body.email.slice(0, 200);
  const locale: 'fr' | 'en' = body.locale === 'fr' ? 'fr' : 'en';
  const secret = process.env.AUTH_SIGNING_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

  if (!secret) {
    // Always return 200 so we don't leak whether the env is wired.
    return NextResponse.json({ ok: true, delivered: false, reason: 'not_configured' });
  }

  // Throttle before doing any work. We still answer 200 so the response is
  // indistinguishable from a successful send — never reveal whether an address
  // exists, or that a limit was hit.
  const emailBucket = await rateLimit(
    `magic:email:${email.toLowerCase()}`,
    EMAIL_LIMIT,
    EMAIL_WINDOW,
  );
  if (!emailBucket.allowed) {
    return NextResponse.json({ ok: true });
  }
  const ip = clientIp(req);
  if (ip) {
    const ipBucket = await rateLimit(`magic:ip:${ip}`, IP_LIMIT, IP_WINDOW);
    if (!ipBucket.allowed) {
      return NextResponse.json({ ok: true });
    }
  }

  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const nonce = randomBytes(16).toString('base64url');
  const payload = `${email}.${expiresAt}.${nonce}`;
  const sig = sign(payload, secret);
  const token = `${Buffer.from(payload).toString('base64url')}.${sig}`;

  // TICKRA-FIX(security): persist the nonce so the callback can mark it
  // consumed (single-use). Without DB this gracefully no-ops — the
  // callback's consume returns false, which we treat as replay-safe only
  // when DB is configured. See callback route comment.
  if (isDbConfigured()) {
    await recordMagicNonce(email, nonce, expiresAt);
  }

  const url = `${siteUrl}/api/auth/callback?token=${encodeURIComponent(token)}&locale=${locale}`;

  const subject = locale === 'fr' ? 'Votre lien de connexion Tickra' : 'Your Tickra sign-in link';
  const intro = locale === 'fr' ? 'Cliquez pour vous connecter (lien valable 15 minutes) :' : 'Click to sign in (link valid 15 minutes):';
  const ignore = locale === 'fr' ? 'Vous n’avez pas demandé ce lien ? Ignorez ce message.' : 'Didn’t request this link? You can ignore this email.';

  await sendEmail({
    from: FROM,
    to: email,
    subject,
    text: `${intro}\n\n${url}\n\n${ignore}`,
    html: `<p>${intro}</p><p><a href="${url}">${url}</a></p><p style="color:#666">${ignore}</p>`,
  });

  // Always return ok — never reveal whether the address has an account.
  return NextResponse.json({ ok: true });
}
