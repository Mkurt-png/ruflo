// La Lettre du dimanche — bilan hebdomadaire purement éditorial,
// calculé localement à partir de la progression. Aucune dépendance
// serveur : l'utilisateur peut la consulter à tout moment, mais le
// format est calé sur la fenêtre "lundi 00:00 UTC → dimanche 23:59 UTC".

export type LetterSection = {
  id: 'cette-semaine' | 'ce-qui-revient' | 'la-semaine-qui-vient';
  title: { fr: string; en: string };
  lines: { fr: string; en: string }[];
};

export type LetterContext = {
  /** Lessons completed map (id → timestamp ms). */
  completed: Record<string, number>;
  /** Mistakes map. */
  mistakes: Record<string, { loggedAt: number; reviewedAt?: number }>;
  /** Current consecutive-day streak. */
  streakDays: number;
  /** kNOWTrade Cote. */
  cote: number;
  /** Delta from yesterday's Cote. */
  coteDelta: number;
  /** Optional candidate lesson for the week ahead. */
  upNext?: { trackSlug: string; lessonSlug: string; title: { fr: string; en: string } };
  /** Date the letter is dated. */
  now?: number;
};

const DAY = 86_400_000;
const WEEK = 7 * DAY;

function startOfWeek(ts: number): number {
  const d = new Date(ts);
  d.setUTCHours(0, 0, 0, 0);
  // ISO week: Monday = 1
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  return d.getTime() - diff * DAY;
}

export function composeLetter(ctx: LetterContext): {
  date: string;
  sections: LetterSection[];
  empty: boolean;
} {
  const now = ctx.now ?? Date.now();
  const weekStart = startOfWeek(now);
  const lastWeekStart = weekStart - WEEK;

  const completedThisWeek = Object.entries(ctx.completed).filter(
    ([, ts]) => ts >= weekStart && ts < weekStart + WEEK,
  );
  const completedLastWeek = Object.entries(ctx.completed).filter(
    ([, ts]) => ts >= lastWeekStart && ts < weekStart,
  );

  const newMistakesThisWeek = Object.values(ctx.mistakes).filter(
    (m) => m.loggedAt >= weekStart && m.loggedAt < weekStart + WEEK,
  );
  const reviewedThisWeek = Object.values(ctx.mistakes).filter(
    (m) => m.reviewedAt && m.reviewedAt >= weekStart && m.reviewedAt < weekStart + WEEK,
  );

  const dueOrStale = Object.values(ctx.mistakes).filter(
    (m) => !m.reviewedAt && now - m.loggedAt > 7 * DAY,
  );

  const sections: LetterSection[] = [];

  // 01 — Cette semaine
  const thisWeekLines: { fr: string; en: string }[] = [];
  if (completedThisWeek.length > 0) {
    thisWeekLines.push({
      fr: `Vous avez terminé ${completedThisWeek.length} leçon${completedThisWeek.length > 1 ? 's' : ''}. La semaine d’avant : ${completedLastWeek.length}.`,
      en: `You finished ${completedThisWeek.length} lesson${completedThisWeek.length > 1 ? 's' : ''}. The week before: ${completedLastWeek.length}.`,
    });
  } else {
    thisWeekLines.push({
      fr: `Aucune leçon cette semaine. C’est arrivé à tout le monde. Ce qui compte, c’est que la prochaine reprenne.`,
      en: `No lessons this week. It happens to everyone. What matters is that the next one resumes.`,
    });
  }
  if (ctx.streakDays > 0) {
    thisWeekLines.push({
      fr: `Votre streak tient à ${ctx.streakDays} jour${ctx.streakDays > 1 ? 's' : ''}. Le calendrier garde la trace.`,
      en: `Your streak holds at ${ctx.streakDays} day${ctx.streakDays > 1 ? 's' : ''}. The calendar keeps the record.`,
    });
  }
  if (newMistakesThisWeek.length > 0) {
    thisWeekLines.push({
      fr: `${newMistakesThisWeek.length} erreur${newMistakesThisWeek.length > 1 ? 's' : ''} consignée${newMistakesThisWeek.length > 1 ? 's' : ''} cette semaine. Aucune erreur n’est perdue tant qu’elle est écrite.`,
      en: `${newMistakesThisWeek.length} mistake${newMistakesThisWeek.length > 1 ? 's' : ''} logged this week. No mistake is lost as long as it is written down.`,
    });
  }
  thisWeekLines.push({
    fr: `Votre cote au moment d’écrire ces lignes : ${ctx.cote.toFixed(1)} (${ctx.coteDelta >= 0 ? '+' : ''}${ctx.coteDelta.toFixed(1)} sur 24 h).`,
    en: `Your quote at the time of writing: ${ctx.cote.toFixed(1)} (${ctx.coteDelta >= 0 ? '+' : ''}${ctx.coteDelta.toFixed(1)} over 24 h).`,
  });
  sections.push({
    id: 'cette-semaine',
    title: { fr: 'Cette semaine', en: 'This week' },
    lines: thisWeekLines,
  });

  // 02 — Ce qui revient
  const recurringLines: { fr: string; en: string }[] = [];
  if (dueOrStale.length > 0) {
    recurringLines.push({
      fr: `${dueOrStale.length} erreur${dueOrStale.length > 1 ? 's' : ''} attend${dueOrStale.length > 1 ? 'ent' : ''} d’être relue${dueOrStale.length > 1 ? 's' : ''}. La révision est moins glorieuse que le neuf, et elle paie plus.`,
      en: `${dueOrStale.length} mistake${dueOrStale.length > 1 ? 's' : ''} await${dueOrStale.length > 1 ? '' : 's'} review. Review is less glorious than novelty, and it pays more.`,
    });
  } else if (reviewedThisWeek.length > 0) {
    recurringLines.push({
      fr: `Vous avez relu ${reviewedThisWeek.length} ancienne${reviewedThisWeek.length > 1 ? 's' : ''} erreur${reviewedThisWeek.length > 1 ? 's' : ''} cette semaine. C’est le travail le plus discret du métier.`,
      en: `You reviewed ${reviewedThisWeek.length} old mistake${reviewedThisWeek.length > 1 ? 's' : ''} this week. The quietest work of the craft.`,
    });
  } else {
    recurringLines.push({
      fr: `Rien à reprendre pour l’instant. Profitez-en pour avancer — la révision reviendra d’elle-même.`,
      en: `Nothing to revisit yet. Use the calm to move forward — review will return on its own.`,
    });
  }
  sections.push({
    id: 'ce-qui-revient',
    title: { fr: 'Ce qui revient', en: 'What returns' },
    lines: recurringLines,
  });

  // 03 — La semaine qui vient
  const aheadLines: { fr: string; en: string }[] = [];
  if (ctx.upNext) {
    aheadLines.push({
      fr: `Prochaine leçon suggérée : « ${ctx.upNext.title.fr} ». Dix minutes suffisent.`,
      en: `Next suggested lesson: "${ctx.upNext.title.en}". Ten minutes is enough.`,
    });
  }
  aheadLines.push({
    fr: `Une bonne semaine est une semaine où la séance la plus difficile a été ouverte malgré l’envie de l’éviter.`,
    en: `A good week is one where the hardest session was opened despite the urge to skip it.`,
  });
  sections.push({
    id: 'la-semaine-qui-vient',
    title: { fr: 'La semaine qui vient', en: 'The week ahead' },
    lines: aheadLines,
  });

  return {
    date: new Date(now).toISOString().slice(0, 10),
    sections,
    empty:
      completedThisWeek.length === 0 &&
      completedLastWeek.length === 0 &&
      newMistakesThisWeek.length === 0 &&
      ctx.streakDays === 0,
  };
}
