// Typed query helpers for the Battle mode (1v1 Pro quizzes).
// All access funnels through the service-role client; RLS blocks anon/auth.

import { getDb } from './supabase';

// Shape of a quiz question persisted inside a battle. Frozen at create-time
// so both players see the exact same set even if seed content changes later.
export type BattleQuestion = {
  trackId: string;
  lessonId: string;
  q: { fr: string; en: string };
  options: { fr: string[]; en: string[] };
  correct: number;
  rationale: { fr: string; en: string };
};

export type BattleStatus = 'waiting' | 'active' | 'finished';

export type Battle = {
  id: string;
  host_email: string;
  guest_email: string | null;
  status: BattleStatus;
  questions: BattleQuestion[];
  current_index: number;
  host_answers: (number | null)[];
  guest_answers: (number | null)[];
  host_times: (number | null)[];
  guest_times: (number | null)[];
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type Side = 'host' | 'guest';

const TABLE = 'tickra_battles';

export async function createBattle(
  hostEmail: string,
  questions: BattleQuestion[],
): Promise<Battle | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db
    .from(TABLE)
    .insert({
      host_email: hostEmail,
      status: 'waiting',
      questions,
      current_index: 0,
      host_answers: [],
      guest_answers: [],
      host_times: [],
      guest_times: [],
    })
    .select('*')
    .single();
  if (error || !data) return null;
  return data as Battle;
}

export async function getBattle(id: string): Promise<Battle | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return data as Battle;
}

export async function joinBattle(id: string, guestEmail: string): Promise<Battle | null> {
  const db = await getDb();
  if (!db) return null;
  const current = await getBattle(id);
  if (!current) return null;
  if (current.host_email === guestEmail) return current; // host re-opening
  if (current.guest_email && current.guest_email !== guestEmail) return null;
  if (current.status !== 'waiting') return current;

  const { data, error } = await db
    .from(TABLE)
    .update({
      guest_email: guestEmail,
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) return null;
  return data as Battle;
}

// Records an answer for one side at a specific question index. Once both
// players have answered the same index, the server advances current_index.
// When the last question is answered, the battle is auto-finished.
export async function submitAnswer(
  id: string,
  side: Side,
  index: number,
  answer: number,
  timeMs: number,
): Promise<Battle | null> {
  const db = await getDb();
  if (!db) return null;
  const battle = await getBattle(id);
  if (!battle) return null;
  if (battle.status === 'finished') return battle;
  if (index !== battle.current_index) return battle;

  const total = battle.questions.length;
  const answersKey = side === 'host' ? 'host_answers' : 'guest_answers';
  const timesKey = side === 'host' ? 'host_times' : 'guest_times';

  const answers = [...(battle[answersKey] ?? [])];
  const times = [...(battle[timesKey] ?? [])];
  // Pad up to index in case the side skipped earlier ticks
  while (answers.length <= index) answers.push(null);
  while (times.length <= index) times.push(null);
  if (answers[index] !== null && answers[index] !== undefined) return battle; // already answered
  answers[index] = answer;
  times[index] = timeMs;

  const otherAnswersKey = side === 'host' ? 'guest_answers' : 'host_answers';
  const otherAnswers = battle[otherAnswersKey] ?? [];
  const bothAnswered =
    otherAnswers[index] !== null && otherAnswers[index] !== undefined;

  const patch: Record<string, unknown> = {
    [answersKey]: answers,
    [timesKey]: times,
  };

  let nextIndex = battle.current_index;
  let nextStatus: BattleStatus = battle.status;
  let finishedAt: string | null = null;

  if (bothAnswered) {
    if (index + 1 >= total) {
      nextStatus = 'finished';
      finishedAt = new Date().toISOString();
    } else {
      nextIndex = index + 1;
    }
  }

  patch.current_index = nextIndex;
  patch.status = nextStatus;
  if (finishedAt) patch.finished_at = finishedAt;

  const { data, error } = await db
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) return null;
  return data as Battle;
}

export async function finishBattle(id: string): Promise<Battle | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db
    .from(TABLE)
    .update({ status: 'finished', finished_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) return null;
  return data as Battle;
}

// Score helper: 1 point per correct + 0.1 bonus for the faster correct
// answer at each question. Returns { host, guest }.
export function computeScores(battle: Battle): { host: number; guest: number } {
  let host = 0;
  let guest = 0;
  for (let i = 0; i < battle.questions.length; i += 1) {
    const correct = battle.questions[i].correct;
    const hostAns = battle.host_answers[i];
    const guestAns = battle.guest_answers[i];
    const hostOk = hostAns === correct;
    const guestOk = guestAns === correct;
    if (hostOk) host += 1;
    if (guestOk) guest += 1;
    if (hostOk && guestOk) {
      const hT = battle.host_times[i] ?? Infinity;
      const gT = battle.guest_times[i] ?? Infinity;
      if (hT < gT) host += 0.1;
      else if (gT < hT) guest += 0.1;
    }
  }
  return { host: Math.round(host * 10) / 10, guest: Math.round(guest * 10) / 10 };
}
