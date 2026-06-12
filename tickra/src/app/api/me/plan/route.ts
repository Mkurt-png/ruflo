import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, getUserPlan, isDbConfigured, setUserPlan } from '@/lib/db/queries';
import { generatePlan } from '@/lib/curriculum/plan-generator';

// Always read live cookies + DB.
export const dynamic = 'force-dynamic';

// TICKRA-PHASE-1.4: GET returns the user's plan, generating it on the fly if
// missing. POST { regenerate: true } forces a fresh generation based on the
// latest placement_track.

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ plan: [], reason: 'not_authenticated' });
  if (!isDbConfigured()) return NextResponse.json({ plan: [], reason: 'db_not_configured' });

  let plan = await getUserPlan(session.email);
  if (plan.length === 0) {
    const user = await getUser(session.email);
    const generated = generatePlan(user?.placement_track ?? null, 14);
    if (generated.length > 0) {
      await setUserPlan(
        session.email,
        generated.map((g) => ({ day_index: g.day, lesson_id: g.lessonId })),
      );
      plan = await getUserPlan(session.email);
    }
  }
  return NextResponse.json({ plan });
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: 'db_not_configured' }, { status: 501 });

  const body = (await req.json().catch(() => null)) as { regenerate?: boolean } | null;
  if (!body?.regenerate) {
    return NextResponse.json({ error: 'pass { regenerate: true } to regenerate' }, { status: 400 });
  }

  const user = await getUser(session.email);
  const generated = generatePlan(user?.placement_track ?? null, 14);
  await setUserPlan(
    session.email,
    generated.map((g) => ({ day_index: g.day, lesson_id: g.lessonId })),
  );
  const plan = await getUserPlan(session.email);
  return NextResponse.json({ plan });
}
