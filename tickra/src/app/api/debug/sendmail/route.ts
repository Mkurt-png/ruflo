import { NextResponse } from 'next/server';
import { sendEmail, FROM } from '@/lib/email/resend';
import { isDebugAuthorised } from '@/lib/debug/gate';

// Per-request: never cached.
export const dynamic = 'force-dynamic';

// GET /api/debug/sendmail?to=you@example.com
// TICKRA-FIX(security): gated — was a "spam any address through our Resend"
// vulnerability. Production callers need `x-debug-token: $DEBUG_TOKEN`.
export async function GET(req: Request) {
  const gate = isDebugAuthorised(req);
  if (!gate.ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const url = new URL(req.url);
  const to = url.searchParams.get('to') ?? '';
  if (!to.includes('@')) {
    return NextResponse.json({ ok: false, error: 'pass ?to=email@example.com' }, { status: 400 });
  }

  const apiKeyPresent = typeof process.env.RESEND_API_KEY === 'string';
  const audiencePresent = typeof process.env.RESEND_AUDIENCE_ID === 'string';

  const result = await sendEmail({
    from: FROM,
    to,
    subject: 'Tickra diag — test',
    text: 'This is a Tickra diagnostic test email. If you see it, Resend is working.',
  });

  return NextResponse.json({
    env: {
      RESEND_API_KEY: apiKeyPresent,
      RESEND_AUDIENCE_ID: audiencePresent,
      RESEND_FROM: process.env.RESEND_FROM ?? null,
    },
    from: FROM,
    to,
    result,
  });
}
