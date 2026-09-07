import { NextResponse } from 'next/server';
import { createHmac, randomBytes } from 'node:crypto';
import { FROM, sendEmailLogged } from '@/lib/email/resend';
import { isDbConfigured, recordMagicNonce } from '@/lib/db/queries';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';
import { normaliseEmail, emailLooksValid } from '@/lib/auth/email';
import { BRAND_NAME, EMAIL } from '@/lib/brand';

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

  // Normalised HERE, before the token payload is signed — so the address the
  // callback verifies, the nonce row, the session and the user row are all the
  // same string. Signing the raw casing meant a link from a phone keyboard and
  // one from a desktop resolved to two different accounts.
  const email = normaliseEmail(body.email);
  const locale: 'fr' | 'en' = body.locale === 'fr' ? 'fr' : 'en';
  const secret = process.env.AUTH_SIGNING_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

  if (!secret) {
    // Always return 200 so we don't leak whether the env is wired.
    return NextResponse.json({ ok: true, delivered: false, reason: 'not_configured' });
  }

  // TICKRA-FIX(auth): say when a request was throttled.
  //
  // This used to answer `{ ok: true }`, on the reasoning that a uniform reply
  // reveals nothing about whether an address has an account. But the throttle
  // applies to every address equally, account or not, so admitting to it leaks
  // nothing — it only tells the requester that THIS address has been asked for
  // a lot recently, which they already know, because it was them.
  //
  // What the silence did cost was real: the page said "check your email" and
  // nothing arrived, with no way to tell a throttle from a broken mailer. That
  // is the same invisible-failure shape this route was fixed for elsewhere, and
  // it cost a debugging session on production.
  const emailBucket = await rateLimit(
    `magic:email:${email}`, // already normalised
    EMAIL_LIMIT,
    EMAIL_WINDOW,
  );
  if (!emailBucket.allowed) {
    console.warn('[magic-link] throttled: address bucket, %d hits', emailBucket.count);
    return NextResponse.json(
      { error: 'rate_limited', retryAfterSeconds: EMAIL_WINDOW },
      { status: 429, headers: { 'retry-after': String(EMAIL_WINDOW) } },
    );
  }
  const ip = clientIp(req);
  if (ip) {
    const ipBucket = await rateLimit(`magic:ip:${ip}`, IP_LIMIT, IP_WINDOW);
    if (!ipBucket.allowed) {
      console.warn('[magic-link] throttled: IP bucket, %d hits', ipBucket.count);
      return NextResponse.json(
        { error: 'rate_limited', retryAfterSeconds: IP_WINDOW },
        { status: 429, headers: { 'retry-after': String(IP_WINDOW) } },
      );
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
  //
  // TICKRA-FIX(auth): the result used to be discarded. If the insert failed —
  // a connection blip, a full table, a schema change — the mail went out
  // anyway carrying a nonce no row exists for. The callback then found
  // nothing to consume and answered `error=expired` on a link that had never
  // been used. Requesting another link produced the same dead link, so the
  // user was locked out with a message telling them to do the one thing that
  // could not work.
  //
  // A link we know cannot succeed is worse than no link: send nothing, and say
  // the failure is ours so the person retries instead of doubting their
  // address.
  if (isDbConfigured()) {
    const recorded = await recordMagicNonce(email, nonce, expiresAt);
    if (!recorded) {
      console.error('[magic-link] could not persist nonce for %s — mail not sent', email);
      return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
  }

  const url = `${siteUrl}/api/auth/callback?token=${encodeURIComponent(token)}&locale=${locale}`;

  // TICKRA-FIX(deliverability): the first version of this mail was three bare
  // <p> tags whose only link used the raw tokenised URL as its own anchor text.
  // That is the shape of a phishing mail, and filters score it as one — it
  // landed in Gmail's spam folder on the very first send from the new domain.
  //
  // Reputation and volume dominate here and no markup fixes those, but three
  // things in the message itself were working against us and are worth fixing:
  //
  //   - no Reply-To, so the visible sender had no reachable inbox
  //   - a long URL as clickable text, the classic phishing tell
  //   - nothing identifying the sender or why the message was received
  const t = locale === 'fr'
    ? {
        subject: `Votre lien de connexion ${BRAND_NAME}`,
        heading: 'Connexion à votre compte',
        intro: 'Voici votre lien de connexion. Il est valable 15 minutes et ne peut servir qu’une fois.',
        cta: 'Se connecter',
        fallback: 'Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :',
        why: `Vous recevez ce message parce qu’une connexion a été demandée pour ${email} sur ${BRAND_NAME}.`,
        ignore: 'Si ce n’est pas vous, ignorez ce message : sans le lien, personne ne peut accéder au compte.',
      }
    : {
        subject: `Your ${BRAND_NAME} sign-in link`,
        heading: 'Sign in to your account',
        intro: 'Here is your sign-in link. It is valid for 15 minutes and can only be used once.',
        cta: 'Sign in',
        fallback: 'If the button does not work, copy this address into your browser:',
        why: `You are receiving this because a sign-in was requested for ${email} on ${BRAND_NAME}.`,
        ignore: 'If this was not you, ignore this message — without the link nobody can reach the account.',
      };

  await sendEmailLogged({
    from: FROM,
    // A visible sender with no inbox behind it is a deliverability penalty, and
    // a dead end for anyone who simply replies.
    replyTo: EMAIL.support,
    to: email,
    subject: t.subject,
    text: `${t.heading}\n\n${t.intro}\n\n${url}\n\n${t.why}\n${t.ignore}\n\n${BRAND_NAME}`,
    html: `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#111320">
  <p style="margin:0 0 24px;font-size:15px;font-weight:600;letter-spacing:-0.01em">${BRAND_NAME}</p>
  <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;letter-spacing:-0.02em">${t.heading}</h1>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3d4255">${t.intro}</p>
  <p style="margin:0 0 24px">
    <a href="${url}" style="display:inline-block;background:#38bdf8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:999px">${t.cta}</a>
  </p>
  <p style="margin:0 0 8px;font-size:13px;color:#6c7490">${t.fallback}</p>
  <p style="margin:0 0 28px;font-size:12px;line-height:1.5;color:#6c7490;word-break:break-all">${url}</p>
  <hr style="border:none;border-top:1px solid #dde3f0;margin:0 0 16px">
  <p style="margin:0 0 4px;font-size:12px;line-height:1.6;color:#6c7490">${t.why}</p>
  <p style="margin:0;font-size:12px;line-height:1.6;color:#6c7490">${t.ignore}</p>
</div>`,
  }, 'magic-link');

  // Always return ok — never reveal whether the address has an account.
  return NextResponse.json({ ok: true });
}
