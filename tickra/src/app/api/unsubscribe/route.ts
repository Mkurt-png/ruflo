import { NextResponse } from 'next/server';
import { verifyUnsubToken } from '@/lib/email/digest';
import { setDigestOptIn } from '@/lib/db/digest-queries';

// GET /api/unsubscribe?token=...
// Decodes a signed token, flips weekly_digest_opt_in to false, renders a
// tiny HTML acknowledgement. Safe to hit repeatedly (idempotent).

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function htmlPage(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<style>body{font-family:ui-sans-serif,system-ui,sans-serif;background:#0b1220;color:#e6e9ef;` +
    `margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}` +
    `.card{max-width:480px;text-align:center}h1{font-weight:500;font-size:24px;margin:0 0 12px}` +
    `p{color:#a6acba;line-height:1.6}a{color:#5b8def}</style></head>` +
    `<body><div class="card"><h1>${title}</h1><p>${body}</p></div></body></html>`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const secret = process.env.AUTH_SIGNING_SECRET;
  if (!token || !secret) {
    return new NextResponse(
      htmlPage('Invalid link', 'This unsubscribe link is missing or malformed.'),
      { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } },
    );
  }
  const email = verifyUnsubToken(token, secret);
  if (!email) {
    return new NextResponse(
      htmlPage('Invalid link', 'We could not verify this unsubscribe link.'),
      { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } },
    );
  }
  await setDigestOptIn(email, false);
  return new NextResponse(
    htmlPage(
      "You're unsubscribed",
      'You will no longer receive the Tickra weekly digest. You can re-enable it any time from your account settings.',
    ),
    { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}
