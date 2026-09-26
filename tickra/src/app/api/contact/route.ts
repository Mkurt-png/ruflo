import { EMAIL } from '@/lib/brand';
import { NextResponse } from 'next/server';
import { FROM, sendEmailLogged } from '@/lib/email/resend';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';
import { emailLooksValid } from '@/lib/auth/email';

// POST /api/contact   { name, email, subject, message }
// Routes to the support address via Resend when RESEND_API_KEY is set.

const CONTACT_TO = process.env.CONTACT_TO ?? EMAIL.support;

// Unauthenticated, and every call is a Resend send. Unthrottled, a script
// could bury the support inbox — and spend the Resend quota that sign-in links
// share, so a flood here would stop anyone from signing in. A person writing
// to support does not need more than a few messages an hour.
const IP_LIMIT = 5;
const IP_WINDOW = 60 * 60;

export const dynamic = 'force-dynamic';

function escape(input: string): string {
  return input.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { name?: string; email?: string; subject?: string; message?: string }
    | null;

  if (!body?.email || !body.message || typeof body.message !== 'string') {
    return NextResponse.json({ error: 'email and message are required' }, { status: 400 });
  }
  // Used as Reply-To: must be an address, not arbitrary header text.
  if (typeof body.email !== 'string' || !emailLooksValid(body.email)) {
    return NextResponse.json({ error: 'valid email is required' }, { status: 400 });
  }

  const ip = clientIp(req);
  if (ip) {
    const bucket = await rateLimit(`contact:ip:${ip}`, IP_LIMIT, IP_WINDOW);
    if (!bucket.allowed) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }
  }

  const name = (typeof body.name === 'string' ? body.name : '').slice(0, 200);
  const email = body.email.trim().slice(0, 200);
  // Goes into the mail Subject header: no line breaks.
  const subject = (typeof body.subject === 'string' && body.subject ? body.subject : '(no subject)')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 200);
  const message = body.message.slice(0, 5000);

  const html = `
    <h2>New contact form submission</h2>
    <p><strong>From:</strong> ${escape(name)} &lt;${escape(email)}&gt;</p>
    <p><strong>Subject:</strong> ${escape(subject)}</p>
    <hr />
    <pre style="white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace">${escape(message)}</pre>
  `;

  const result = await sendEmailLogged({
    from: FROM,
    to: CONTACT_TO,
    replyTo: email,
    subject: `[contact] ${subject}`,
    html,
    text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
  }, 'contact');

  if (!result.ok) {
    // The provider's message stays in the server log (sendEmailLogged); it
    // names configuration — domains, keys, quota — that a visitor has no use for.
    return NextResponse.json({ error: 'send_failed' }, { status: 502 });
  }
  if (!result.delivered) {
    // Resend not configured yet — accept but flag so client doesn't think mail flew.
    return NextResponse.json({ ok: true, delivered: false, reason: result.reason }, { status: 202 });
  }
  return NextResponse.json({ ok: true, delivered: true, id: result.id });
}
