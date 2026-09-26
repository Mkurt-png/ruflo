import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import { getBattle, joinBattle, submitAnswer } from '@/lib/db/battle-queries';
import { resolveEffectivePlan } from '@/lib/auth/plan-expiry';
import { battleView, outsiderView, roleOf } from '@/lib/battle/view';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

const QUESTION_MAX_MS = 25_000; // 20s window + 5s clock-skew clamp

// What each caller sees is decided in one place — `@/lib/battle/view` — which
// the page's first render uses too. Outsiders learn that the battle exists and
// its status; participants see a question's answer only once they have
// answered it themselves; nobody is ever sent an email address.

export async function GET(_req: NextRequest, { params }: Params) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 503 });
  }
  const battle = await getBattle(params.id);
  if (!battle) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const session = await getSession();
  const role = session ? roleOf(battle, session.email) : null;
  if (!role) return NextResponse.json({ battle: outsiderView(battle) });
  return NextResponse.json({ battle: battleView(battle, role) });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 503 });
  }

  let body: { action?: string; index?: number; answer?: number; timeMs?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const action = body.action;

  if (action === 'join') {
    const user = await getUser(session.email);
    // The effective plan, not the stored column: a lapsed subscription whose
    // row still says 'pro' must not open a Pro feature.
    const plan = resolveEffectivePlan(user);
    if (!user || (plan !== 'pro' && plan !== 'lifetime')) {
      return NextResponse.json({ error: 'pro_required' }, { status: 403 });
    }
    const battle = await joinBattle(params.id, session.email);
    const role = battle ? roleOf(battle, session.email) : null;
    if (!battle || !role) return NextResponse.json({ error: 'join_failed' }, { status: 400 });
    return NextResponse.json({ battle: battleView(battle, role) });
  }

  if (action === 'answer') {
    const battle = await getBattle(params.id);
    if (!battle) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const role = roleOf(battle, session.email);
    if (!role) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    if (battle.status !== 'active') {
      return NextResponse.json({ error: 'not_active' }, { status: 400 });
    }
    const index = Number(body.index);
    const answer = Number(body.answer);
    // Only used until migration 024 is applied: the database now measures the
    // answer time itself, and a browser-reported time is ignored. Clamped for
    // the fallback so `timeMs: 0` cannot be claimed there either.
    const timeMs = Math.min(
      QUESTION_MAX_MS,
      Math.max(0, Number(body.timeMs ?? 0)),
    );
    if (!Number.isInteger(index) || index < 0 || index >= battle.questions.length) {
      return NextResponse.json({ error: 'invalid_index' }, { status: 400 });
    }
    // TICKRA-FIX(security): reject out-of-range answer indices. A timeout
    // sentinel `-1` is accepted and recorded as "no answer".
    const isSentinel = answer === -1;
    const question = battle.questions[index];
    // options is { fr, en }; either array length is fine for bounds.
    const optionCount =
      question && typeof question === 'object' && 'options' in question
        ? Math.max(
            Array.isArray((question as { options?: { fr?: unknown[] } }).options?.fr)
              ? (question as { options: { fr: unknown[] } }).options.fr.length
              : 0,
            Array.isArray((question as { options?: { en?: unknown[] } }).options?.en)
              ? (question as { options: { en: unknown[] } }).options.en.length
              : 0,
          )
        : 0;
    if (!isSentinel && (!Number.isInteger(answer) || answer < 0 || answer >= optionCount)) {
      return NextResponse.json({ error: 'invalid_answer' }, { status: 400 });
    }
    const updated = await submitAnswer(
      params.id,
      role,
      index,
      answer,
      timeMs,
    );
    if (!updated) return NextResponse.json({ error: 'submit_failed' }, { status: 500 });
    return NextResponse.json({ battle: battleView(updated, role) });
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
}
