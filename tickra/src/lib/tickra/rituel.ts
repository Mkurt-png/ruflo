// Le Rituel de rentrée — short editorial welcome when the reader
// returns after an absence. Pure local computation: looks at the
// most recent activity timestamp in the progress store, decides
// whether the gap qualifies as a return, and composes 2-3 bilingual
// lines naming the gap, what waits, and the first useful gesture.
//
// Threshold: ≥ 3 days. Below that, the rituel stays silent.
// The banner dismisses itself once acknowledged (scoped to the
// account via scopedKey so each user has their own ritual).

export type RituelContext = {
  /** Lessons completed map (id → timestamp ms). */
  completed: Record<string, number>;
  /** Logged mistakes. */
  mistakes: Record<string, { loggedAt: number; reviewedAt?: number }>;
  /** Current streak in days. */
  streakDays: number;
  /** Now timestamp (ms). Defaults to Date.now(). */
  now?: number;
};

export type RituelLine = { fr: string; en: string };

export type Rituel = {
  daysAway: number;
  /** Last day the reader was active, ISO date. */
  lastActiveDate: string;
  lines: RituelLine[];
};

const DAY = 86_400_000;
const RETURN_THRESHOLD = 3;

function latestActivity(ctx: RituelContext): number {
  const stamps: number[] = [];
  for (const ts of Object.values(ctx.completed)) stamps.push(ts);
  for (const m of Object.values(ctx.mistakes)) {
    stamps.push(m.loggedAt);
    if (m.reviewedAt) stamps.push(m.reviewedAt);
  }
  if (stamps.length === 0) return 0;
  return Math.max(...stamps);
}

export function computeRituel(ctx: RituelContext): Rituel | null {
  const now = ctx.now ?? Date.now();
  const last = latestActivity(ctx);
  if (last === 0) return null;
  const gap = now - last;
  const daysAway = Math.floor(gap / DAY);
  if (daysAway < RETURN_THRESHOLD) return null;

  const dueMistakes = Object.values(ctx.mistakes).filter(
    (m) => !m.reviewedAt && now - m.loggedAt > 7 * DAY,
  ).length;

  const lines: RituelLine[] = [];

  // 01 · Name the gap. Honest, no scolding.
  lines.push(
    daysAway < 7
      ? {
          fr: `Vous revenez après ${daysAway} jours. Le marché n’a pas tenu compte de votre absence — votre carnet non plus.`,
          en: `You return after ${daysAway} days. The market did not notice your absence — neither did your register.`,
        }
      : daysAway < 30
        ? {
            fr: `${daysAway} jours sans ouvrir le carnet. Ce n’est ni grave ni glorieux : c’est un fait. On reprend.`,
            en: `${daysAway} days away from the register. Neither grave nor glorious: it’s a fact. We resume.`,
          }
        : {
            fr: `Près d’un mois — ${daysAway} jours — sans relire une ligne. Le métier attend, patient. Une leçon suffit pour aujourd’hui.`,
            en: `Almost a month — ${daysAway} days — without reading a line. The craft waits, patient. One lesson is enough today.`,
          },
  );

  // 02 · What waits. Mistakes or the streak reset.
  if (dueMistakes > 0) {
    lines.push({
      fr: `${dueMistakes} erreur${dueMistakes > 1 ? 's' : ''} attend${dueMistakes > 1 ? 'ent' : ''} d’être relue${dueMistakes > 1 ? 's' : ''}. C’est le travail le moins glorieux ; c’est celui qui paie.`,
      en: `${dueMistakes} mistake${dueMistakes > 1 ? 's' : ''} await${dueMistakes > 1 ? '' : 's'} review. The least glorious work — the one that pays.`,
    });
  } else if (ctx.streakDays === 0) {
    lines.push({
      fr: `Le streak est à zéro. Un streak, ça se redémarre — pas demain, aujourd’hui.`,
      en: `The streak is at zero. A streak restarts — not tomorrow, today.`,
    });
  }

  // 03 · The first useful gesture.
  lines.push({
    fr: `Ouvrez une leçon. Dix minutes. La séance la plus utile est celle qu’on a failli reporter.`,
    en: `Open one lesson. Ten minutes. The most useful session is the one you almost postponed.`,
  });

  return {
    daysAway,
    lastActiveDate: new Date(last).toISOString().slice(0, 10),
    lines,
  };
}
