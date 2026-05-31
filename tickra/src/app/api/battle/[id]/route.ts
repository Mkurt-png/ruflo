import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import {
  computeScores,
  getBattle,
  joinBattle,
  submitAnswer,
} from '@/lib/db/battle-queries';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

function publicShape(battle: Awaited<ReturnType<typeof getBattle>>) {
  if (!battle) return null;
  return {
    id: battle.id,
    hostEmail: battle.host_email,
    guestEmail: battle.guest_email,
    status: battle.status,
    currentIndex: battle.current_index,
    questions: battle.questions,
    hostAnswers: battle.host_answers,
    guestAnswers: battle.guest_answers,
    hostTimes: battle.host_times,
    guestTimes: battle.guest_times,
    createdAt: battle.created_at,
    startedAt: battle.started_at,
    finishedAt: battle.finished_at,
    scores: computeScores(battle),
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 503 });
  }
  const battle = await getBattle(params.id);
  if (!battle) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ battle: publicShape(battle) });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = getSession();
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
    if (!user || (user.plan !== 'pro' && user.plan !== 'lifetime')) {
      return NextResponse.json({ error: 'pro_required' }, { status: 403 });
    }
    const battle = await joinBattle(params.id, session.email);
    if (!battle) return NextResponse.json({ error: 'join_failed' }, { status: 400 });
    return NextResponse.json({ battle: publicShape(battle) });
  }

  if (action === 'answer') {
    const battle = await getBattle(params.id);
    if (!battle) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const isHost = battle.host_email === session.email;
    const isGuest = battle.guest_email === session.email;
    if (!isHost && !isGuest) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    if (battle.status !== 'active') {
      return NextResponse.json({ error: 'not_active' }, { status: 400 });
    }
    const index = Number(body.index);
    const answer = Number(body.answer);
    const timeMs = Math.max(0, Number(body.timeMs ?? 0));
    if (!Number.isInteger(index) || index < 0) {
      return NextResponse.json({ error: 'invalid_index' }, { status: 400 });
    }
    if (!Number.isInteger(answer) || answer < 0) {
      return NextResponse.json({ error: 'invalid_answer' }, { status: 400 });
    }
    const updated = await submitAnswer(
      params.id,
      isHost ? 'host' : 'guest',
      index,
      answer,
      timeMs,
    );
    if (!updated) return NextResponse.json({ error: 'submit_failed' }, { status: 500 });
    return NextResponse.json({ battle: publicShape(updated) });
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
}
