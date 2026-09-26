import { NextResponse } from 'next/server';
import { verifyUnsubToken } from '@/lib/email/digest';
import { setDigestOptIn } from '@/lib/db/digest-queries';
import { unsubscribeFromAudience } from '@/lib/email/resend';

// GET  /api/unsubscribe?token=...  → confirmation page, changes nothing
// POST /api/unsubscribe?token=...  → unsubscribes, idempotent
//
// GET used to perform the unsubscribe. Mail security scanners (Outlook
// SafeLinks, Gmail, corporate gateways) fetch every link in a message before
// the recipient sees it, so people were being unsubscribed by their own
// antivirus — the same pre-fetch that burned single-use sign-in links. A GET
// now only renders a button; the change happens on POST, which scanners do
// not send.
//
// POST is also what RFC 8058 one-click unsubscribe uses: the mail client
// POSTs `List-Unsubscribe=One-Click` to the List-Unsubscribe URL directly.

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

function page(status: number, title: string, body: string): NextResponse {
  return new NextResponse(htmlPage(title, body), {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'referrer-policy': 'no-referrer',
    },
  });
}

function readToken(req: Request): { token: string; email: string } | null {
  const token = new URL(req.url).searchParams.get('token');
  const secret = process.env.AUTH_SIGNING_SECRET;
  if (!token || !secret) return null;
  const email = verifyUnsubToken(token, secret);
  return email ? { token, email } : null;
}

const INVALID = ['Invalid link', 'We could not verify this unsubscribe link.'] as const;

export async function GET(req: Request) {
  const found = readToken(req);
  if (!found) return page(400, ...INVALID);
  // The token is base64url + '.', so it is safe inside a quoted attribute;
  // encodeURIComponent keeps it that way regardless.
  const action = `/api/unsubscribe?token=${encodeURIComponent(found.token)}`;
  return page(
    200,
    'Unsubscribe',
    `Stop receiving nkNOWTrade emails at this address?</p>` +
      `<form method="POST" action="${action}">` +
      `<button type="submit" style="margin-top:12px;height:44px;padding:0 22px;border:0;border-radius:999px;` +
      `background:#5b8def;color:#fff;font-size:15px;cursor:pointer">Unsubscribe</button></form><p>`,
  );
}

export async function POST(req: Request) {
  const found = readToken(req);
  if (!found) return page(400, ...INVALID);
  // Both lists: the weekly digest flag lives on the user row, newsletter
  // subscribers live in the Resend audience and often have no user row.
  await Promise.all([
    setDigestOptIn(found.email, false),
    unsubscribeFromAudience(found.email),
  ]);
  return page(
    200,
    "You're unsubscribed",
    'You will no longer receive nkNOWTrade emails at this address. You can re-enable the weekly digest any time from your account settings.',
  );
}
