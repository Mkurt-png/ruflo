'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';

// Mirrors the public shape returned by /api/battle/[id].
type BattleQuestion = {
  trackId: string;
  lessonId: string;
  q: { fr: string; en: string };
  options: { fr: string[]; en: string[] };
  correct: number;
  rationale: { fr: string; en: string };
};

type BattleState = {
  id: string;
  hostEmail: string;
  guestEmail: string | null;
  status: 'waiting' | 'active' | 'finished';
  currentIndex: number;
  questions: BattleQuestion[];
  hostAnswers: (number | null)[];
  guestAnswers: (number | null)[];
  hostTimes: (number | null)[];
  guestTimes: (number | null)[];
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  scores: { host: number; guest: number };
};

type Props = {
  locale: Locale;
  viewerEmail: string;
  initial: BattleState;
};

const QUESTION_MS = 20_000;

const copy = {
  fr: {
    waiting: 'En attente du challenger…',
    inviteHint: 'Partagez le lien de cette page pour inviter un autre Pro.',
    you: 'Vous',
    opponent: 'Adversaire',
    host: 'Hôte',
    guest: 'Challenger',
    questionOf: (a: number, b: number) => `Question ${a} sur ${b}`,
    timeLeft: 'Temps restant',
    submit: 'Valider',
    submitted: 'Réponse envoyée',
    waitingNext: 'En attente de l’adversaire…',
    correct: 'Bonne réponse',
    wrong: 'Mauvaise réponse',
    rationale: 'Pourquoi :',
    winner: 'Victoire',
    loser: 'Défaite',
    tie: 'Égalité',
    finalScore: 'Score final',
    rematch: 'Nouvelle battle',
    realtimeOff: 'Mode rafraîchissement (Realtime non configuré).',
  },
  en: {
    waiting: 'Waiting for challenger…',
    inviteHint: 'Share the link of this page to invite another Pro.',
    you: 'You',
    opponent: 'Opponent',
    host: 'Host',
    guest: 'Challenger',
    questionOf: (a: number, b: number) => `Question ${a} of ${b}`,
    timeLeft: 'Time left',
    submit: 'Submit',
    submitted: 'Answer sent',
    waitingNext: 'Waiting for opponent…',
    correct: 'Correct',
    wrong: 'Wrong',
    rationale: 'Why:',
    winner: 'Victory',
    loser: 'Defeat',
    tie: 'Tie',
    finalScore: 'Final score',
    rematch: 'New battle',
    realtimeOff: 'Polling mode (Realtime not configured).',
  },
} as const;

// Lazy-load the public Supabase client only if anon env vars are present.
// When unavailable we fall back to polling /api/battle/[id] every 2s.
async function getRealtimeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const mod = await import('@supabase/supabase-js');
    return mod.createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    return null;
  }
}

export function BattleRoom({ locale, viewerEmail, initial }: Props) {
  const t = copy[locale];
  const router = useRouter();
  const [state, setStateRaw] = useState<BattleState>(initial);
  const [pendingAnswer, setPendingAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_MS);
  const [realtimeOk, setRealtimeOk] = useState(false);
  // Keep statusRef in sync with state on every set.
  const setState = useCallback((next: BattleState | ((prev: BattleState) => BattleState)) => {
    setStateRaw((prev) => {
      const out = typeof next === 'function' ? (next as (p: BattleState) => BattleState)(prev) : next;
      statusRef.current = out.status;
      return out;
    });
  }, []);
  const questionStartRef = useRef<number>(Date.now());
  const lastIndexRef = useRef<number>(initial.currentIndex);
  // TICKRA-FIX: ref kept in sync with state.status so the poll interval
  // sees current status instead of a stale closure.
  const statusRef = useRef<BattleState['status']>(initial.status);

  const isHost = state.hostEmail === viewerEmail;
  const youKey = isHost ? 'hostAnswers' : 'guestAnswers';
  const oppKey = isHost ? 'guestAnswers' : 'hostAnswers';
  const yourScore = isHost ? state.scores.host : state.scores.guest;
  const oppScore = isHost ? state.scores.guest : state.scores.host;

  const currentQ = state.questions[state.currentIndex];

  // Reset per-question UI when the server advances current_index.
  useEffect(() => {
    if (lastIndexRef.current !== state.currentIndex) {
      lastIndexRef.current = state.currentIndex;
      setPendingAnswer(null);
      setSubmitted(false);
      questionStartRef.current = Date.now();
      setTimeLeft(QUESTION_MS);
    }
  }, [state.currentIndex]);

  // If the viewer has already answered the current index (e.g. on refresh),
  // reflect that immediately.
  useEffect(() => {
    const own = state[youKey][state.currentIndex];
    if (own !== null && own !== undefined) {
      setSubmitted(true);
      setPendingAnswer(typeof own === 'number' ? own : null);
    }
  }, [state, youKey]);

  // Pull latest state from the server.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/battle/${initial.id}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.battle) setState(data.battle as BattleState);
    } catch {
      /* noop */
    }
  }, [initial.id]);

  // Realtime subscription (with polling fallback).
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    (async () => {
      const client = await getRealtimeClient();
      if (cancelled) return;
      if (client) {
        setRealtimeOk(true);
        const channel = client.channel(`battle-${initial.id}`, {
          config: { broadcast: { self: false } },
        });
        channel.on('broadcast', { event: 'answer' }, () => {
          void refresh();
        });
        channel.on('broadcast', { event: 'state' }, () => {
          void refresh();
        });
        channel.subscribe();
        cleanup = () => {
          try {
            client.removeChannel(channel);
          } catch {
            /* noop */
          }
        };
      } else {
        setRealtimeOk(false);
      }
      // TICKRA-FIX: read status through a ref to avoid the stale closure
      // bug where the poll kept ticking forever after `finished`.
      pollTimer = setInterval(() => {
        if (statusRef.current !== 'finished') void refresh();
      }, 2000);
    })();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
      if (pollTimer) clearInterval(pollTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id, refresh]);

  // Countdown timer for the current question.
  useEffect(() => {
    if (state.status !== 'active') return;
    if (submitted) return;
    const tick = () => {
      const elapsed = Date.now() - questionStartRef.current;
      const left = Math.max(0, QUESTION_MS - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        // Auto-submit best-guess (current pendingAnswer, or -1 for none).
        void submitAnswer(pendingAnswer ?? -1);
      }
    };
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.currentIndex, submitted, pendingAnswer]);

  const submitAnswer = useCallback(
    async (answer: number) => {
      if (submitted || state.status !== 'active') return;
      setSubmitted(true);
      const elapsed = Date.now() - questionStartRef.current;
      // TICKRA-FIX: -1 is a valid sentinel meaning "no answer" (timeout).
      // Was being coerced to 0 ("option A"), accidentally correct ~25% of
      // the time. Now we pass -1 through; the server accepts it and the
      // scoring treats it as a wrong answer with no speed bonus.
      const safeAnswer = answer === -1
        ? -1
        : Number.isInteger(answer) && answer >= 0
        ? answer
        : -1;
      try {
        const res = await fetch(`/api/battle/${state.id}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action: 'answer',
            index: state.currentIndex,
            answer: safeAnswer,
            timeMs: elapsed,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.battle) setState(data.battle as BattleState);
        }
        // Broadcast a tick so the opponent UI refreshes without waiting for poll.
        const client = await getRealtimeClient();
        if (client) {
          const ch = client.channel(`battle-${state.id}`);
          ch.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              ch.send({
                type: 'broadcast',
                event: 'answer',
                payload: { index: state.currentIndex, by: viewerEmail },
              });
              setTimeout(() => {
                try {
                  client.removeChannel(ch);
                } catch {
                  /* noop */
                }
              }, 250);
            }
          });
        }
      } catch {
        /* noop */
      }
    },
    [state, submitted, viewerEmail],
  );

  // Waiting room (host before guest joins).
  if (state.status === 'waiting') {
    const inviteUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/${locale}/battle/${state.id}`
        : `/${locale}/battle/${state.id}`;
    return (
      <div className="max-w-2xl rounded-2xl border border-line bg-surface p-8">
        <h2 className="font-display text-2xl font-medium text-ink">{t.waiting}</h2>
        <p className="mt-3 text-muted">{t.inviteHint}</p>
        <div className="mt-6 flex items-center gap-2">
          <input
            readOnly
            aria-label={locale === 'fr' ? 'Lien d’invitation' : 'Invite link'}
            value={inviteUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full flex-1 truncate rounded-md border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink"
          />
          {/* TICKRA-FIX(UX): copy state feedback like BattleJoin. */}
          <CopyButton text={inviteUrl} locale={locale} />
        </div>
      </div>
    );
  }

  // Finished — winner screen.
  if (state.status === 'finished') {
    const verdict =
      yourScore > oppScore ? t.winner : yourScore < oppScore ? t.loser : t.tie;
    const verdictColour =
      yourScore > oppScore
        ? 'text-up'
        : yourScore < oppScore
          ? 'text-down'
          : 'text-muted';
    return (
      <div className="max-w-2xl rounded-2xl border border-line bg-surface p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
          {t.finalScore}
        </p>
        <h2 className={`mt-3 font-display text-display-md font-medium ${verdictColour}`}>
          {verdict}
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <ScoreCard label={t.you} value={yourScore} highlight />
          <ScoreCard label={t.opponent} value={oppScore} />
        </div>
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/battle`)}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-canvas hover:opacity-90"
          >
            {t.rematch}
          </button>
        </div>
      </div>
    );
  }

  // Active question.
  const total = state.questions.length;
  const opponentAnswered =
    state[oppKey][state.currentIndex] !== null &&
    state[oppKey][state.currentIndex] !== undefined;
  const ownAnswer = state[youKey][state.currentIndex];
  const showRationale = submitted && ownAnswer !== null && ownAnswer !== undefined;
  const isCorrect = showRationale && ownAnswer === currentQ.correct;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
          {t.questionOf(state.currentIndex + 1, total)}
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
          {t.timeLeft}: {Math.ceil(timeLeft / 1000)}s
        </p>
      </div>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full bg-brand transition-[width] duration-200"
          style={{ width: `${(timeLeft / QUESTION_MS) * 100}%` }}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <ScoreCard label={t.you} value={yourScore} highlight />
        <ScoreCard
          label={t.opponent}
          value={oppScore}
          sub={opponentAnswered ? t.submitted : t.waitingNext}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-surface p-8">
        <h3 className="font-display text-xl font-medium text-ink">
          {currentQ.q[locale]}
        </h3>
        <div className="mt-6 space-y-3">
          {currentQ.options[locale].map((opt, i) => {
            const selected = pendingAnswer === i;
            const isThisCorrect = showRationale && i === currentQ.correct;
            const isThisChosenWrong =
              showRationale && i === ownAnswer && i !== currentQ.correct;
            const base =
              'flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition';
            const stateCls = isThisCorrect
              ? 'border-up bg-up/10 text-ink'
              : isThisChosenWrong
                ? 'border-down bg-down/10 text-ink'
                : selected
                  ? 'border-ink bg-canvas text-ink'
                  : 'border-line bg-canvas text-ink hover:border-ink';
            return (
              <button
                key={i}
                type="button"
                disabled={submitted}
                onClick={() => setPendingAnswer(i)}
                className={`${base} ${stateCls} disabled:cursor-not-allowed`}
              >
                <span>{opt}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
                  {String.fromCharCode(65 + i)}
                </span>
              </button>
            );
          })}
        </div>

        {!submitted ? (
          <button
            type="button"
            disabled={pendingAnswer === null}
            onClick={() => submitAnswer(pendingAnswer ?? 0)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-canvas hover:opacity-90 disabled:opacity-50"
          >
            {t.submit}
          </button>
        ) : (
          <div className="mt-6 space-y-3">
            <p
              className={`font-mono text-[11px] uppercase tracking-[0.2em] ${
                isCorrect ? 'text-up' : 'text-down'
              }`}
            >
              {isCorrect ? t.correct : t.wrong}
            </p>
            <p className="text-sm text-muted">
              <span className="font-mono uppercase tracking-[0.15em] text-subtle">
                {t.rationale}
              </span>{' '}
              {currentQ.rationale[locale]}
            </p>
            {!opponentAnswered ? (
              <p className="text-xs text-subtle">{t.waitingNext}</p>
            ) : null}
          </div>
        )}
      </div>

      {!realtimeOk ? (
        <p className="mt-6 text-[11px] text-subtle">{t.realtimeOff}</p>
      ) : null}
    </div>
  );
}

function ScoreCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? 'border-ink bg-canvas' : 'border-line bg-surface'
      }`}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-medium text-ink">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

// TICKRA-FIX(UX): copy button with 1.5s "Copied" feedback, mirrors BattleJoin.
function CopyButton({ text, locale }: { text: string; locale: Locale }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-md border border-line bg-canvas px-3 py-2 text-xs font-medium text-ink hover:bg-surface"
    >
      {copied ? (locale === 'fr' ? 'Copié' : 'Copied') : locale === 'fr' ? 'Copier' : 'Copy'}
    </button>
  );
}

export default BattleRoom;
