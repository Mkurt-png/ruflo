import { NextResponse } from 'next/server';
import { FROM, sendEmail } from '@/lib/email/resend';

// GET /api/cron/daily-reminder
//
// Designed for Vercel Cron (or any scheduled invoker). Fans out a daily
// reminder to every Resend Audience contact. The actual list of recipients
// comes from a Resend Audience (RESEND_AUDIENCE_ID) so unsubscribes are
// honoured by the provider without any extra logic on our side.
//
// Auth: Vercel Cron sets a `x-vercel-cron` header by default. We additionally
// support `CRON_SECRET` for any other invoker.
//
// Env:
//   RESEND_API_KEY
//   RESEND_AUDIENCE_ID
//   CRON_SECRET            (optional, recommended for non-Vercel invokers)
//   NEXT_PUBLIC_SITE_URL

export const runtime = 'nodejs';

const SUBJECT_FR = '10 minutes — votre leçon Tickra du jour';
const SUBJECT_EN = '10 minutes — your Tickra lesson for today';

function authorise(req: Request): boolean {
  if (req.headers.get('x-vercel-cron')) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // Permissive when no secret set — same as the rest of the gated stack.
  const got = req.headers.get('authorization');
  if (!got) return false;
  return got === `Bearer ${secret}`;
}

type Contact = { email: string; first_name?: string; unsubscribed?: boolean };

async function listAudienceContacts(audienceId: string): Promise<Contact[]> {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const res = await resend.contacts.list({ audienceId });
    if (res.error) return [];
    type ResendContact = { email?: string; first_name?: string; unsubscribed?: boolean };
    const data = (res.data as { data?: ResendContact[] } | null)?.data ?? [];
    return data
      .filter((c) => Boolean(c.email))
      .map((c) => ({
        email: c.email!,
        first_name: c.first_name,
        unsubscribed: Boolean(c.unsubscribed),
      }));
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  if (!authorise(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!process.env.RESEND_API_KEY || !audienceId) {
    return NextResponse.json(
      { error: 'resend_not_configured', hint: 'Set RESEND_API_KEY and RESEND_AUDIENCE_ID.' },
      { status: 501 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const contacts = await listAudienceContacts(audienceId);
  const active = contacts.filter((c) => !c.unsubscribed);

  let sent = 0;
  let failed = 0;

  for (const c of active) {
    // Naive locale guess from common French-speaking TLDs. Replace with a real
    // preference column when you wire the DB.
    const locale: 'fr' | 'en' = /\.(fr|be|ca)$/i.test(c.email) ? 'fr' : 'en';
    const resumeUrl = `${siteUrl}/${locale}/learn`;
    const subject = locale === 'fr' ? SUBJECT_FR : SUBJECT_EN;
    const greeting = locale === 'fr'
      ? `Bonjour${c.first_name ? ' ' + c.first_name : ''},`
      : `Hi${c.first_name ? ' ' + c.first_name : ''},`;
    const body = locale === 'fr'
      ? `${greeting}\n\nDix minutes suffisent pour avancer d'une leçon. Reprenez où vous en étiez :\n${resumeUrl}\n\n— Tickra`
      : `${greeting}\n\nTen minutes is enough for one lesson. Pick up where you left off:\n${resumeUrl}\n\n— Tickra`;

    const r = await sendEmail({ from: FROM, to: c.email, subject, text: body });
    if (r.ok && 'delivered' in r && r.delivered) sent += 1;
    else failed += 1;
  }

  return NextResponse.json({ ok: true, audienceSize: contacts.length, active: active.length, sent, failed });
}
