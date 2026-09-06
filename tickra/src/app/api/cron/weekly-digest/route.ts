import { NextResponse } from 'next/server';
import { FROM, sendEmail } from '@/lib/email/resend';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import {
  listDigestRecipients,
  getWeeklyStats,
  recordDigestSent,
} from '@/lib/db/digest-queries';
import { buildDigestEmail, signUnsubToken } from '@/lib/email/digest';
import { TRACKS, getTrack } from '@/lib/curriculum/data';

// GET /api/cron/weekly-digest
//
// Fired by Vercel Cron Sunday 18:00 UTC. Sends a personalised weekly digest
// to every tickra_users row with weekly_digest_opt_in = true.
//
// Auth: same posture as daily-reminder — accepts the Vercel cron header or a
// `Bearer ${CRON_SECRET}` Authorization header.
//
// Idempotence: per-user `last_digest_at` is updated after each successful
// send; we skip recipients sent in the last 6 days so manual re-triggers
// don't double-mail anyone.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// TICKRA-FIX(security): fail CLOSED. The previous version trusted the
// `x-vercel-cron` header, which is an ordinary unsigned request header any
// caller can forge, and fell open when CRON_SECRET was unset — so anyone could
// trigger a mass mailing to the whole audience (Resend quota burn + domain
// reputation damage). Only a matching CRON_SECRET is accepted now.
function authorise(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorise(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'resend_not_configured', hint: 'Set RESEND_API_KEY.' },
      { status: 501 },
    );
  }
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'db_not_configured', hint: 'Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 501 },
    );
  }
  const signingSecret = process.env.AUTH_SIGNING_SECRET;
  if (!signingSecret) {
    return NextResponse.json(
      { error: 'signing_secret_missing', hint: 'Set AUTH_SIGNING_SECRET.' },
      { status: 501 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const recipients = await listDigestRecipients();
  const SIX_DAYS = 6 * 24 * 60 * 60 * 1000;

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const r of recipients) {
    if (r.last_digest_at && Date.now() - new Date(r.last_digest_at).getTime() < SIX_DAYS) {
      skipped += 1;
      continue;
    }

    const stats = await getWeeklyStats(r.email);
    // Pick recommended next lesson: user's placement_track, falling back to
    // the first global track. Then walk to the first incomplete lesson — for
    // simplicity we use lesson 1 of that track (mirrors /welcome).
    const user = await getUser(r.email).catch(() => null);
    const trackSlug = user?.placement_track && getTrack(user.placement_track)
      ? user.placement_track
      : TRACKS[0].slug;
    const track = getTrack(trackSlug) ?? TRACKS[0];
    const lesson = track.lessons[0];
    const locale: 'fr' | 'en' = r.locale === 'fr' ? 'fr' : 'en';
    const nextLessonUrl = `${siteUrl}/${locale}/learn/${track.slug}/${lesson.slug}`;
    const nextLessonTitle = lesson.title[locale];

    const { subject, html, text } = buildDigestEmail(
      { email: r.email, firstName: r.display_name, locale: r.locale },
      { ...stats, nextLessonTitle, nextLessonUrl },
      siteUrl,
      signUnsubToken(r.email, signingSecret),
    );

    const result = await sendEmail({
      from: FROM,
      to: r.email,
      subject,
      html,
      text,
    });
    if (result.ok && 'delivered' in result && result.delivered) {
      sent += 1;
      await recordDigestSent(r.email);
    } else {
      failed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    eligible: recipients.length,
    sent,
    failed,
    skipped,
  });
}
