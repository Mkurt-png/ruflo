// La Veillée — every Sunday at 21:00 UTC, a 30-minute reading session
// shared by every connected visitor at the same time. There is no
// video, no chat, no live tracker — only a single sentence per minute
// of the session, all readers receiving the same one at the same time.
//
// The state is pure: we compute the current phase and current line
// from the server clock. Nothing is persisted, nothing is streamed.

export type VeilleePhase = 'before' | 'opening' | 'reading' | 'closing' | 'after';

export type VeilleeState = {
  phase: VeilleePhase;
  /** Index of the current reading line, 0-based. Only meaningful in 'reading'. */
  lineIndex: number;
  /** Total reading lines available. */
  totalLines: number;
  /** Seconds until the next phase boundary. */
  secondsToNext: number;
  /** ISO timestamp of the next Sunday 21:00 UTC. */
  nextSession: string;
  /** ISO timestamp the current session ends (or last ended). */
  endsAt: string;
};

const READING = [
  {
    fr: 'On ouvre. Le bureau est calme, le café tiré, la page blanche.',
    en: 'We open. The desk is quiet, the coffee poured, the page blank.',
  },
  {
    fr: 'Une semaine n’est pas le marché : c’est ce qu’on a écrit du marché.',
    en: 'A week is not the market: it is what you wrote of the market.',
  },
  {
    fr: 'Si vous avez tenu votre stop, dites-le ici en silence. C’est déjà beaucoup.',
    en: 'If you held your stop, say so here in silence. That is already a lot.',
  },
  {
    fr: 'Si vous l’avez bougé, dites-le aussi. C’est pour ça qu’il existe une Lettre du dimanche.',
    en: 'If you moved it, say that too. That is why there is a Sunday Letter.',
  },
  {
    fr: 'Le carnet n’a pas besoin de votre meilleur trade. Il a besoin du trade qu’on n’a pas eu envie d’écrire.',
    en: 'The register does not need your best trade. It needs the one you did not want to write.',
  },
  {
    fr: 'Une bonne semaine est une semaine où on a refermé l’écran à l’heure prévue.',
    en: 'A good week is one where you closed the screen at the planned hour.',
  },
  {
    fr: 'Le streak est une ligne, pas une médaille.',
    en: 'The streak is a line, not a medal.',
  },
  {
    fr: 'On ne rattrape pas une perte. On reprend la lecture.',
    en: 'You do not catch up a loss. You resume the reading.',
  },
  {
    fr: 'Si quelqu’un vous a montré sa courbe d’equity cette semaine, soyez doux. Le métier vient plus tard.',
    en: 'If someone showed you their equity curve this week, be kind. The craft comes later.',
  },
  {
    fr: 'Quand vous lisez ceci, d’autres lisent la même phrase. Ce n’est pas un hasard ; c’est une heure choisie.',
    en: 'As you read this, others read the same sentence. Not by chance; by chosen hour.',
  },
  {
    fr: 'L’écriture précède l’ordre. C’est la règle, et la seule.',
    en: 'Writing precedes the order. That is the rule, the only one.',
  },
  {
    fr: 'Demain ouvre. Une leçon, dix minutes, c’est assez.',
    en: 'Tomorrow opens. One lesson, ten minutes, is enough.',
  },
  {
    fr: 'Vous pouvez fermer cette page maintenant. La Veillée vous attendra dimanche.',
    en: 'You may close this page now. La Veillée will wait for you on Sunday.',
  },
];

const READING_MINUTES = READING.length;
const OPENING_MINUTES = 1;
const CLOSING_MINUTES = 1;
const SESSION_MINUTES = OPENING_MINUTES + READING_MINUTES + CLOSING_MINUTES;
const START_UTC_HOUR = 21; // 21:00 UTC Sunday

function nextSundayAt21(now: Date): Date {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), START_UTC_HOUR, 0, 0, 0),
  );
  // Days to add until day-of-week is Sunday (0). If today is Sunday but the
  // session has already ended, advance one week.
  const day = d.getUTCDay();
  const daysAhead = (7 - day) % 7;
  d.setUTCDate(d.getUTCDate() + daysAhead);
  if (d.getTime() + SESSION_MINUTES * 60_000 < now.getTime()) {
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return d;
}

export function readVeillee(now: Date = new Date()): VeilleeState {
  const next = nextSundayAt21(now);
  const sessionStart = next.getTime();
  const endsAt = sessionStart + SESSION_MINUTES * 60_000;

  // If we're not on Sunday within session window, we're either 'before' the
  // next one or 'after' the previous one. We model both with the same phase
  // labels relative to the upcoming session.
  if (now.getTime() < sessionStart) {
    // Could still be 'after' last Sunday's session if it ended within last
    // few hours — but we keep it simple: anything before next session is
    // 'before'. The reader sees the countdown either way.
    return {
      phase: 'before',
      lineIndex: 0,
      totalLines: READING_MINUTES,
      secondsToNext: Math.floor((sessionStart - now.getTime()) / 1000),
      nextSession: new Date(sessionStart).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
    };
  }

  const elapsed = Math.floor((now.getTime() - sessionStart) / 60_000);
  if (elapsed < OPENING_MINUTES) {
    return {
      phase: 'opening',
      lineIndex: 0,
      totalLines: READING_MINUTES,
      secondsToNext: Math.floor(
        (sessionStart + OPENING_MINUTES * 60_000 - now.getTime()) / 1000,
      ),
      nextSession: new Date(sessionStart).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
    };
  }

  if (elapsed < OPENING_MINUTES + READING_MINUTES) {
    const lineIndex = elapsed - OPENING_MINUTES;
    return {
      phase: 'reading',
      lineIndex,
      totalLines: READING_MINUTES,
      secondsToNext: Math.floor(
        (sessionStart + (OPENING_MINUTES + lineIndex + 1) * 60_000 - now.getTime()) / 1000,
      ),
      nextSession: new Date(sessionStart).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
    };
  }

  if (elapsed < SESSION_MINUTES) {
    return {
      phase: 'closing',
      lineIndex: READING_MINUTES - 1,
      totalLines: READING_MINUTES,
      secondsToNext: Math.floor((endsAt - now.getTime()) / 1000),
      nextSession: new Date(sessionStart).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
    };
  }

  // After: report the next session (one week later).
  const nextWeek = new Date(sessionStart + 7 * 86_400_000);
  return {
    phase: 'after',
    lineIndex: READING_MINUTES - 1,
    totalLines: READING_MINUTES,
    secondsToNext: Math.floor((nextWeek.getTime() - now.getTime()) / 1000),
    nextSession: nextWeek.toISOString(),
    endsAt: new Date(endsAt).toISOString(),
  };
}

export function readingLine(index: number): (typeof READING)[number] | null {
  if (index < 0 || index >= READING.length) return null;
  return READING[index];
}
