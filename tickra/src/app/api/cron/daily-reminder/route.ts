import { NextResponse } from 'next/server';
import { FROM, sendEmail } from '@/lib/email/resend';
import { isDbConfigured, lastNotificationAt, recordNotification } from '@/lib/db/queries';

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

const SUBJECT_FR = '10 minutes — votre leçon kNOWTrade du jour';
const SUBJECT_EN = '10 minutes — your kNOWTrade lesson for today';

// TICKRA-FIX(security): fail CLOSED — see weekly-digest. This endpoint mails
// the entire Resend audience, so the old permissive path (forgeable
// `x-vercel-cron` header, or no CRON_SECRET at all) was a spam cannon.
function authorise(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

type Contact = { email: string; first_name?: string; unsubscribed?: boolean };

async function listAudienceContacts(audienceId: string): Promise<Contact[]> {
  // TICKRA-FIX: previously returned only Resend's first page; anyone beyond
  // ~100 contacts never got the reminder. We try cursor-based pagination
  // (when Resend's SDK exposes it) and fall back to single-page otherwise.
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY!);
    type ResendContact = { email?: string; first_name?: string; unsubscribed?: boolean };
    type ListBody = { data?: ResendContact[]; has_more?: boolean; next?: string } | null;
    const out: Contact[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 50; page += 1) {
      const args = (cursor ? { audienceId, cursor } : { audienceId }) as { audienceId: string };
      const res = await resend.contacts.list(args);
      if (res.error) break;
      const body = res.data as ListBody;
      const data = body?.data ?? [];
      for (const c of data) {
        if (!c.email) continue;
        out.push({
          email: c.email,
          first_name: c.first_name,
          unsubscribed: Boolean(c.unsubscribed),
        });
      }
      if (!body?.has_more || !body?.next) break;
      cursor = body.next;
    }
    return out;
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
  let skipped = 0;

  // TICKRA-FIX: per-user idempotence — only send if 20h+ since last send to
  // the same address. Prevents duplicate emails if the cron fires twice or
  // is manually triggered the same day.
  const dbReady = isDbConfigured();
  const NEARLY_DAY = 20 * 60 * 60 * 1000;

  for (const c of active) {
    if (dbReady) {
      const last = await lastNotificationAt(c.email, 'daily_reminder');
      if (last && Date.now() - last < NEARLY_DAY) {
        skipped += 1;
        continue;
      }
    }

    const locale: 'fr' | 'en' = /\.(fr|be|ca)$/i.test(c.email) ? 'fr' : 'en';
    const resumeUrl = `${siteUrl}/${locale}/learn`;
    const subject = locale === 'fr' ? SUBJECT_FR : SUBJECT_EN;
    const greeting = locale === 'fr'
      ? `Bonjour${c.first_name ? ' ' + c.first_name : ''},`
      : `Hi${c.first_name ? ' ' + c.first_name : ''},`;
    const body = locale === 'fr'
      ? `${greeting}\n\nDix minutes suffisent pour avancer d'une leçon. Reprenez où vous en étiez :\n${resumeUrl}\n\n— kNOWTrade`
      : `${greeting}\n\nTen minutes is enough for one lesson. Pick up where you left off:\n${resumeUrl}\n\n— kNOWTrade`;

    const r = await sendEmail({ from: FROM, to: c.email, subject, text: body });
    if (r.ok && 'delivered' in r && r.delivered) {
      sent += 1;
      if (dbReady) await recordNotification(c.email, 'daily_reminder');
    } else {
      failed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    audienceSize: contacts.length,
    active: active.length,
    sent,
    failed,
    skipped,
  });
}
