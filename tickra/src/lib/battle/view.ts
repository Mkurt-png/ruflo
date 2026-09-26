// What a battle participant is allowed to see. One function, used by the
// page's first render AND the API, so the two can no longer disagree.
//
// They did disagree. The API stripped `correct` and `rationale` while a battle
// was active; the page built its own object from the raw row and handed the
// full answer key to the browser in the server-rendered payload — readable in
// the page source before question one. Three further leaks lived in both:
//
//   - both players' email addresses, sent to the opponent (a stranger, when a
//     battle link is shared) and re-broadcast on a public realtime channel;
//   - the opponent's answer to the CURRENT question, visible before you had
//     answered it;
//   - the live score, whose change the moment the opponent answered told you
//     whether they were right — together with their answer, that is the key.
//
// The rule now: a question is revealed to a viewer — its answer, its
// explanation, the opponent's pick, its effect on the score — only once that
// viewer has answered it. Answers are locked on first submit (submitAnswer
// refuses a second), so seeing the key afterwards changes nothing. When the
// battle is finished everything is revealed.

import type { Battle } from '@/lib/db/battle-queries';

export type ViewerRole = 'host' | 'guest';

type Question = Battle['questions'][number];
type HiddenQuestion = Omit<Question, 'correct' | 'rationale'>;

export type BattleView = {
  id: string;
  viewerRole: ViewerRole;
  hasGuest: boolean;
  status: Battle['status'];
  currentIndex: number;
  questions: (Question | HiddenQuestion)[];
  hostAnswers: (number | null)[];
  guestAnswers: (number | null)[];
  hostTimes: (number | null)[];
  guestTimes: (number | null)[];
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  scores: { host: number; guest: number };
};

/**
 * Stand-in for an opponent answer the viewer may not see yet. Non-null, so
 * "the opponent has answered" still shows; never a valid option index, so it
 * says nothing about which one.
 */
export const HIDDEN_ANSWER = -1;

const answered = (a: number | null | undefined) => a !== null && a !== undefined;

function scoreOver(battle: Battle, revealed: (i: number) => boolean) {
  let host = 0;
  let guest = 0;
  battle.questions.forEach((q, i) => {
    if (!revealed(i)) return;
    const hostOk = battle.host_answers[i] === q.correct;
    const guestOk = battle.guest_answers[i] === q.correct;
    if (hostOk) host += 1;
    if (guestOk) guest += 1;
    if (hostOk && guestOk) {
      const hT = battle.host_times[i] ?? Infinity;
      const gT = battle.guest_times[i] ?? Infinity;
      if (hT < gT) host += 0.1;
      else if (gT < hT) guest += 0.1;
    }
  });
  return { host: Math.round(host * 10) / 10, guest: Math.round(guest * 10) / 10 };
}

/** The participant's role, or null when `email` is not in this battle. */
export function roleOf(battle: Battle, email: string): ViewerRole | null {
  if (battle.host_email === email) return 'host';
  if (battle.guest_email === email) return 'guest';
  return null;
}

export function battleView(battle: Battle, role: ViewerRole): BattleView {
  const finished = battle.status === 'finished';
  const own = role === 'host' ? battle.host_answers : battle.guest_answers;
  const revealed = (i: number) => finished || answered(own[i]);

  const maskOpponent = (list: (number | null)[], isOpponent: boolean) =>
    isOpponent
      ? list.map((a, i) => (revealed(i) || !answered(a) ? a : HIDDEN_ANSWER))
      : list;
  const maskTimes = (list: (number | null)[], isOpponent: boolean) =>
    isOpponent ? list.map((t, i) => (revealed(i) ? t : null)) : list;

  return {
    id: battle.id,
    viewerRole: role,
    hasGuest: battle.guest_email !== null,
    status: battle.status,
    currentIndex: battle.current_index,
    questions: battle.questions.map((q, i) => {
      if (revealed(i)) return q;
      const { correct: _c, rationale: _r, ...rest } = q;
      return rest;
    }),
    hostAnswers: maskOpponent(battle.host_answers, role === 'guest'),
    guestAnswers: maskOpponent(battle.guest_answers, role === 'host'),
    hostTimes: maskTimes(battle.host_times, role === 'guest'),
    guestTimes: maskTimes(battle.guest_times, role === 'host'),
    createdAt: battle.created_at,
    startedAt: battle.started_at,
    finishedAt: battle.finished_at,
    scores: scoreOver(battle, revealed),
  };
}

/** For someone who is not a participant: whether it exists, nothing more. */
export function outsiderView(battle: Battle) {
  return { id: battle.id, status: battle.status };
}
