import { NextResponse } from 'next/server';
import { FROM, sendEmail } from '@/lib/email/resend';

// POST /api/contact   { name, email, subject, message }
// Routes to hello@tickra.com via Resend when RESEND_API_KEY is set.

const CONTACT_TO = process.env.CONTACT_TO ?? 'hello@tickra.com';

function escape(input: string): string {
  return input.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { name?: string; email?: string; subject?: string; message?: string }
    | null;

  if (!body?.email || !body.message) {
    return NextResponse.json({ error: 'email and message are required' }, { status: 400 });
  }

  const name = (body.name ?? '').slice(0, 200);
  const email = body.email.slice(0, 200);
  const subject = (body.subject ?? '(no subject)').slice(0, 200);
  const message = body.message.slice(0, 5000);

  const html = `
    <h2>New contact form submission</h2>
    <p><strong>From:</strong> ${escape(name)} &lt;${escape(email)}&gt;</p>
    <p><strong>Subject:</strong> ${escape(subject)}</p>
    <hr />
    <pre style="white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace">${escape(message)}</pre>
  `;

  const result = await sendEmail({
    from: FROM,
    to: CONTACT_TO,
    replyTo: email,
    subject: `[contact] ${subject}`,
    html,
    text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
  });

  if (!result.ok) {
    return NextResponse.json({ error: 'send failed', detail: result.error }, { status: 502 });
  }
  if (!result.delivered) {
    // Resend not configured yet — accept but flag so client doesn't think mail flew.
    return NextResponse.json({ ok: true, delivered: false, reason: result.reason }, { status: 202 });
  }
  return NextResponse.json({ ok: true, delivered: true, id: result.id });
}
