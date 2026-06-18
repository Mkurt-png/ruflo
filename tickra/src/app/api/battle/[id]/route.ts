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

const QUESTION_MAX_MS = 25_000; // 20s window + 5s clock-skew clamp

// two layers of redaction on GET.
//  1. Anonymous callers (no session) get a tiny "exists?" shape only.
//  2. Even host/guest get `questions` with `correct` and `rationale` stripped
//     while the battle is still active. Only after `finished` do we send the
//     full payload (for review). This closes the answer-key leak.
type Battle = NonNullable<Awaited<ReturnType<typeof getBattle>>>;
type Question = Battle['questions'][number];

function stripQuestions(qs: Question[]) {
  return qs.map((q) => {
    const { correct: _correct, rationale: _rationale, ...rest } = q as Question & {
      correct?: number;
      rationale?: unknown;
    };
    return rest;
  });
}

function fullShape(battle: Battle) {
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

function activeShape(battle: Battle) {
  return {
    ...fullShape(battle),
    questions: stripQuestions(battle.questions),
  };
}

function anonymousShape(battle: Battle) {
  return {
    id: battle.id,
    status: battle.status,
    hostEmail: null,
    guestEmail: null,
    currentIndex: 0,
    questions: [] as Question[],
    hostAnswers: [],
    guestAnswers: [],
    hostTimes: [],
    guestTimes: [],
    scores: { host: 0, guest: 0 },
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 503 });
  }
  const battle = await getBattle(params.id);
  if (!battle) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const session = getSession();
  if (!session) {
    // Anonymous → only "exists?"  to allow showing the join landing.
    return NextResponse.json({ battle: anonymousShape(battle) });
  }
  const isParticipant =
    battle.host_email === session.email || battle.guest_email === session.email;
  if (!isParticipant) {
    return NextResponse.json({ battle: anonymousShape(battle) });
  }
  if (battle.status === 'finished') {
    return NextResponse.json({ battle: fullShape(battle) });
  }
  return NextResponse.json({ battle: activeShape(battle) });
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
    return NextResponse.json({ battle: activeShape(battle) });
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
    // clamp timeMs to [0, QUESTION_MAX_MS] so a malicious client
    // can't claim `timeMs: 0` to always win the speed tie-breaker.
    const timeMs = Math.min(
      QUESTION_MAX_MS,
      Math.max(0, Number(body.timeMs ?? 0)),
    );
    if (!Number.isInteger(index) || index < 0 || index >= battle.questions.length) {
      return NextResponse.json({ error: 'invalid_index' }, { status: 400 });
    }
    // reject out-of-range answer indices. A timeout
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
      isHost ? 'host' : 'guest',
      index,
      answer,
      timeMs,
    );
    if (!updated) return NextResponse.json({ error: 'submit_failed' }, { status: 500 });
    return NextResponse.json({
      battle: updated.status === 'finished' ? fullShape(updated) : activeShape(updated),
    });
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
}
