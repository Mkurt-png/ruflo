import { NextResponse } from 'next/server';
import { FROM, sendEmailLogged } from '@/lib/email/resend';
import {
  getUserPlan,
  isDbConfigured,
  lastNotificationAt,
  listUsersForDailyNotifications,
  recordNotification,
} from '@/lib/db/queries';
import { TRACKS } from '@/lib/curriculum/data';
import { SITE_URL } from '@/lib/site-url';

// TICKRA-PHASE-1.6: per-user transactional notifications.
// Two kinds for now:
//  - `plan_today`: "Aujourd'hui : <lesson title>" once per day
//  - `streak_at_risk`: sent at most once every 20h
//
// Schedule this from Vercel Cron with the JSON:
//   { "path": "/api/cron/notifications", "schedule": "0 8 * * *" }
//
// Or any other scheduler hitting GET with `x-vercel-cron` header or
// Authorization: Bearer CRON_SECRET.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// TICKRA-FIX(security): fail CLOSED — see weekly-digest. `x-vercel-cron` is an
// unsigned header anyone can forge, and an unset CRON_SECRET used to open the
// endpoint to the whole internet.
function authorise(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

const ONE_DAY = 24 * 60 * 60 * 1000;
const NEARLY_ONE_DAY = 20 * 60 * 60 * 1000;

function lessonMeta(lessonId: string) {
  for (const t of TRACKS) {
    const l = t.lessons.find((x) => x.id === lessonId);
    if (l) return { track: t, lesson: l };
  }
  return null;
}

function planTodayCopy(locale: 'fr' | 'en', lessonTitle: string, href: string) {
  if (locale === 'fr') {
    return {
      subject: `Aujourd'hui : ${lessonTitle}`,
      text:
        `Dix minutes suffisent pour faire la leçon du jour.\n\n` +
        `Aujourd'hui : ${lessonTitle}\n${href}\n\n` +
        `À très vite,\nL'équipe kNOWTrade`,
    };
  }
  return {
    subject: `Today: ${lessonTitle}`,
    text:
      `Ten minutes are enough for today's lesson.\n\n` +
      `Today: ${lessonTitle}\n${href}\n\n` +
      `Speak soon,\nThe kNOWTrade team`,
  };
}

function streakAtRiskCopy(locale: 'fr' | 'en', href: string) {
  if (locale === 'fr') {
    return {
      subject: 'Votre streak kNOWTrade est en danger',
      text:
        `Vous n'avez pas pratiqué depuis presque 24 h. Une leçon de 10 min suffit à préserver votre série.\n\n` +
        `Reprendre maintenant : ${href}`,
    };
  }
  return {
    subject: 'Your kNOWTrade streak is at risk',
    text:
      `You haven't practised in nearly 24 hours. A 10-minute lesson keeps the streak alive.\n\n` +
      `Resume now: ${href}`,
  };
}

export async function GET(req: Request) {
  if (!authorise(req)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, reason: 'db_not_configured' });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, reason: 'resend_not_configured' });
  }

  const users = await listUsersForDailyNotifications();
  let planTodayCount = 0;
  let streakRiskCount = 0;
  let skippedCount = 0;

  for (const u of users) {
    // ── plan_today: only once per ~24h
    const lastPlan = await lastNotificationAt(u.email, 'plan_today');
    if (!lastPlan || Date.now() - lastPlan > NEARLY_ONE_DAY) {
      const plan = await getUserPlan(u.email);
      if (plan.length > 0) {
        // pick day 1 (or first unscheduled entry — simple heuristic)
        const today = plan[0];
        const meta = lessonMeta(today.lesson_id);
        if (meta) {
          const href = `${SITE_URL}/fr/learn/${meta.track.slug}/${meta.lesson.slug}`;
          const c = planTodayCopy('fr', meta.lesson.title.fr, href);
          await sendEmailLogged({ from: FROM, to: u.email, subject: c.subject, text: c.text }, 'cron/notifications');
          await recordNotification(u.email, 'plan_today');
          planTodayCount += 1;
          continue;
        }
      }
    }

    // ── streak_at_risk: cron decides without checking real streak (kept
    // simple here). The send is rate-limited per user to 1 every 20h.
    const lastRisk = await lastNotificationAt(u.email, 'streak_at_risk');
    if (!lastRisk || Date.now() - lastRisk > NEARLY_ONE_DAY) {
      const href = `${SITE_URL}/fr/learn`;
      const c = streakAtRiskCopy('fr', href);
      // Only send this branch on Sundays to avoid spamming; refine later.
      if (new Date().getDay() === 0) {
        await sendEmailLogged({ from: FROM, to: u.email, subject: c.subject, text: c.text }, 'cron/notifications');
        await recordNotification(u.email, 'streak_at_risk');
        streakRiskCount += 1;
        continue;
      }
    }

    skippedCount += 1;
  }

  return NextResponse.json({
    ok: true,
    total: users.length,
    sent: { plan_today: planTodayCount, streak_at_risk: streakRiskCount },
    skipped: skippedCount,
  });
}
