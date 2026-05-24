// Lesson runtime content.
// For each lesson the runtime expects: intro paragraphs, a drill prompt, and
// a quiz (3 single-choice questions with rationales). Seeded lessons have hand-
// written copy; everything else is filled with a structured, locale-aware
// placeholder so the lesson runtime never breaks.

import type { LessonMeta, TrackMeta } from './data';

export type LessonContent = {
  intro: { fr: string[]; en: string[] };
  drill: {
    prompt: { fr: string; en: string };
    correct: number;
    options: { fr: string[]; en: string[] };
    rationale: { fr: string; en: string };
  };
  quiz: ReadonlyArray<{
    q: { fr: string; en: string };
    options: { fr: string[]; en: string[] };
    correct: number;
    rationale: { fr: string; en: string };
  }>;
};

type Seed = Record<string, LessonContent>;

// ─── Seeded content (Bougies japonaises, first lessons) ────────────────────

const seeded: Seed = {
  'candles-01': {
    intro: {
      fr: [
        'Une bougie japonaise condense quatre informations sur une période donnée : l’ouverture, le plus haut, le plus bas, la clôture.',
        'Le corps est le rectangle entre l’ouverture et la clôture. Les ombres sont les fines lignes qui dépassent — elles vont du corps jusqu’aux extrêmes.',
        'La couleur n’est qu’une dérivée : verte si la clôture est au‑dessus de l’ouverture, rouge sinon. Ce qui compte, c’est la position relative des quatre points.',
      ],
      en: [
        'A Japanese candle condenses four data points over a given period: open, high, low, close.',
        'The body is the rectangle between open and close. The wicks are the thin lines that stick out — they run from the body to the extremes.',
        'Colour is just a derivative: green if close is above open, red otherwise. What matters is the relative position of the four points.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Une bougie ouvre à 1.0820, monte à 1.0855, descend à 1.0810, clôture à 1.0848. Quel est son corps ?',
        en: 'A candle opens at 1.0820, hits 1.0855, drops to 1.0810, closes at 1.0848. What is its body?',
      },
      options: {
        fr: ['1.0820 → 1.0848 (haussier)', '1.0855 → 1.0810 (baissier)', '1.0810 → 1.0855 (haussier)'],
        en: ['1.0820 → 1.0848 (bullish)', '1.0855 → 1.0810 (bearish)', '1.0810 → 1.0855 (bullish)'],
      },
      correct: 0,
      rationale: {
        fr: 'Le corps va toujours de l’ouverture à la clôture. Ici 1.0820 → 1.0848. Les 1.0855 et 1.0810 forment les ombres.',
        en: 'The body always runs from open to close. Here 1.0820 → 1.0848. The 1.0855 and 1.0810 are the wicks.',
      },
    },
    quiz: [
      {
        q: { fr: 'Que représente la couleur d’une bougie ?', en: 'What does the colour of a candle represent?' },
        options: {
          fr: ['Le volume échangé', 'Le sens de clôture par rapport à l’ouverture', 'La taille du mouvement'],
          en: ['Volume traded', 'Direction of close vs open', 'Move size'],
        },
        correct: 1,
        rationale: {
          fr: 'Vert = clôture au‑dessus de l’ouverture. Rouge = inverse. La couleur ne dit rien de la force.',
          en: 'Green = close above open. Red = the other way around. Colour says nothing about strength.',
        },
      },
      {
        q: { fr: 'Que sont les ombres d’une bougie ?', en: 'What are the wicks of a candle?' },
        options: {
          fr: ['Les niveaux où le prix a été rejeté', 'L’épaisseur du carnet d’ordres', 'Le delta du jour'],
          en: ['The levels where price was rejected', 'Order book thickness', 'The day’s delta'],
        },
        correct: 0,
        rationale: {
          fr: 'Une longue ombre signale un rejet : le prix y est allé, puis a été repoussé avant la clôture.',
          en: 'A long wick signals rejection: price went there, then was pushed back before close.',
        },
      },
      {
        q: { fr: 'Pourquoi le timeframe d’une bougie est‑il crucial ?', en: 'Why does the timeframe of a candle matter?' },
        options: {
          fr: ['Une 1H et une 1J racontent deux histoires différentes', 'Le timeframe ne change rien', 'Plus c’est long, plus c’est précis'],
          en: ['A 1H and a 1D tell two different stories', 'Timeframe changes nothing', 'Longer = more precise'],
        },
        correct: 0,
        rationale: {
          fr: 'Une marubozu sur 1H peut être un simple bruit sur 1J. Lisez toujours la bougie dans son cadre.',
          en: 'A marubozu on 1H may be just noise on 1D. Always read the candle in its frame.',
        },
      },
    ],
  },
  'candles-04': {
    intro: {
      fr: [
        'Une marubozu est une bougie quasiment sans ombres. Le corps remplit (presque) toute l’amplitude haut‑bas de la séance.',
        'C’est un signal de contrôle complet d’un côté du marché. Pas un signal d’entrée — un signal d’information.',
        'Le contexte décide : marubozu au sommet d’une tendance mature ≠ marubozu au bas d’une consolidation après baisse.',
      ],
      en: [
        'A marubozu is a candle with virtually no wicks. The body fills (almost) the full high‑low range of the session.',
        'It signals total control by one side. Not an entry signal — an information signal.',
        'Context decides: marubozu at the top of a mature trend ≠ marubozu at the bottom of a post‑downtrend consolidation.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Une bougie sur EUR/USD H1 : Open 1.0700, Haut 1.0758, Bas 1.0698, Close 1.0755. Est‑ce une marubozu ?',
        en: 'A candle on EUR/USD H1: Open 1.0700, High 1.0758, Low 1.0698, Close 1.0755. Is this a marubozu?',
      },
      options: {
        fr: ['Oui — corps quasi égal à l’amplitude', 'Non — les ombres sont trop longues', 'Peut‑être — il manque le volume'],
        en: ['Yes — body nearly equals the range', 'No — the wicks are too long', 'Maybe — volume is missing'],
      },
      correct: 0,
      rationale: {
        fr: 'Corps = 55 pips. Amplitude = 60 pips. Ratio > 90 %. C’est une marubozu haussière nette.',
        en: 'Body = 55 pips. Range = 60 pips. Ratio > 90%. It’s a clean bullish marubozu.',
      },
    },
    quiz: [
      {
        q: { fr: 'Une marubozu seule est‑elle un signal d’entrée ?', en: 'Is a lone marubozu an entry signal?' },
        options: {
          fr: ['Oui, immédiate', 'Non, c’est une information de momentum', 'Oui si volume confirmé'],
          en: ['Yes, immediately', 'No, it is a momentum cue', 'Yes if volume confirms'],
        },
        correct: 1,
        rationale: { fr: 'C’est une information, pas un signal. Tickra n’entraîne jamais d’entrée sur une seule bougie.', en: 'It is information, not a signal. Tickra never drills entries off a single candle.' },
      },
      {
        q: { fr: 'Marubozu en haut d’une tendance haussière mature, ça veut dire :', en: 'Marubozu at the top of a mature uptrend means:' },
        options: {
          fr: ['Continuation garantie', 'Climax possible — épuisement à surveiller', 'Aucune information'],
          en: ['Guaranteed continuation', 'Possible climax — watch for exhaustion', 'No information'],
        },
        correct: 1,
        rationale: { fr: 'Une longue tendance + une marubozu peut signaler un climax buying. À recouper avec le volume.', en: 'A long trend + a marubozu can signal climax buying. Cross‑check with volume.' },
      },
      {
        q: { fr: 'Quel ratio corps/amplitude définit une marubozu chez Tickra ?', en: 'What body/range ratio defines a marubozu at Tickra?' },
        options: { fr: ['> 50 %', '> 80 %', '100 % exact'], en: ['> 50%', '> 80%', 'Exactly 100%'] },
        correct: 1,
        rationale: { fr: 'En dessous de 80 % vous avez juste une grande bougie, pas une marubozu.', en: 'Below 80% you have a large candle, not a marubozu.' },
      },
    ],
  },
  'risk-04': {
    intro: {
      fr: [
        'Espérance = (taux gagnant × gain moyen) − (taux perdant × perte moyenne). Un trader rentable peut perdre la majorité de ses trades.',
        'Ce qui compte n’est pas le taux de réussite, c’est l’asymétrie entre ce que vous gagnez quand vous avez raison et ce que vous perdez quand vous avez tort.',
        'Cette équation déplace tout le travail : on ne cherche pas à avoir raison, on cherche des setups dont la promesse mathématique est positive.',
      ],
      en: [
        'Expectancy = (win rate × avg win) − (loss rate × avg loss). A profitable trader can lose the majority of their trades.',
        'What matters is not hit rate, it is the asymmetry between what you win when right and what you lose when wrong.',
        'This equation shifts the whole job: you are not chasing being right, you are chasing setups whose mathematical promise is positive.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Vous gagnez 45 % de vos trades. Quand vous gagnez, vous faites +2 R. Quand vous perdez, vous perdez −1 R. Êtes‑vous rentable ?',
        en: 'You win 45% of trades. When you win, you make +2 R. When you lose, you lose −1 R. Are you profitable?',
      },
      options: {
        fr: ['Oui — espérance +0.35 R / trade', 'Non — votre taux est sous 50 %', 'Indéterminé sans le volume'],
        en: ['Yes — expectancy +0.35 R / trade', 'No — your hit rate is below 50%', 'Undetermined without volume'],
      },
      correct: 0,
      rationale: {
        fr: '(0.45 × 2) − (0.55 × 1) = 0.90 − 0.55 = +0.35 R par trade. Hit rate < 50 % et pourtant rentable.',
        en: '(0.45 × 2) − (0.55 × 1) = 0.90 − 0.55 = +0.35 R per trade. Hit rate < 50% and still profitable.',
      },
    },
    quiz: [
      {
        q: { fr: 'Le taux de réussite seul suffit‑il à dire si un trader est rentable ?', en: 'Is hit rate alone enough to tell if a trader is profitable?' },
        options: { fr: ['Oui', 'Non, sans le R:R c’est trompeur', 'Oui au‑dessus de 60 %'], en: ['Yes', 'No, without R:R it is misleading', 'Yes above 60%'] },
        correct: 1,
        rationale: { fr: 'Sans la taille des gains et des pertes, le taux ne dit rien.', en: 'Without the size of wins and losses, hit rate says nothing.' },
      },
      {
        q: { fr: 'Quel est le seuil minimum d’espérance pour considérer un système ?', en: 'What is the minimum expectancy to consider a system?' },
        options: { fr: ['> 0 strictement', '> +0.2 R par trade', '> +1 R par trade'], en: ['> 0 strictly', '> +0.2 R per trade', '> +1 R per trade'] },
        correct: 1,
        rationale: { fr: 'Sous +0.2 R, les coûts (spread, slippage, taxes) mangent l’avantage. Au‑delà on commence à travailler.', en: 'Below +0.2 R, costs (spread, slippage, taxes) eat the edge. Above, you start to work.' },
      },
      {
        q: { fr: 'Avant d’entrer en trade, la question utile est :', en: 'Before entering a trade, the useful question is:' },
        options: { fr: ['« Ai‑je raison ? »', '« Combien je risque vs combien je peux gagner ? »', '« Le marché est‑il haussier ? »'], en: ['"Am I right?"', '"How much do I risk vs how much can I make?"', '"Is the market bullish?"'] },
        correct: 1,
        rationale: { fr: 'La seule question qui survit dans le temps : l’asymétrie du trade.', en: 'The only question that survives over time: trade asymmetry.' },
      },
    ],
  },
};

// ─── Placeholder generator ─────────────────────────────────────────────────

function placeholder(track: TrackMeta, lesson: LessonMeta): LessonContent {
  const title = lesson.title;
  return {
    intro: {
      fr: [
        `Cette leçon couvre : ${title.fr}.`,
        `Elle s’inscrit dans la piste « ${track.title.fr} » et s’appuie sur les leçons précédentes.`,
        'Le contenu complet sera dévoilé séance après séance : Tickra ne déverse pas tout d’un coup, vous progressez bloc par bloc.',
      ],
      en: [
        `This lesson covers: ${title.en}.`,
        `It belongs to the "${track.title.en}" track and builds on the previous lessons.`,
        'Full content is unlocked session after session: Tickra does not dump everything at once, you progress block by block.',
      ],
    },
    drill: {
      prompt: {
        fr: `Sur l’aperçu de la leçon « ${title.fr} », quelle affirmation est la plus prudente ?`,
        en: `On the preview for "${title.en}", which statement is the most prudent?`,
      },
      options: {
        fr: [
          'Je vais lire l’exposé puis pratiquer sur trois cas avant de juger.',
          'J’applique immédiatement sur un compte réel.',
          'Je passe la leçon, je connais déjà le sujet.',
        ],
        en: [
          'I will read the brief then practise three cases before judging.',
          'I will apply it immediately on a live account.',
          'I will skip — I already know this topic.',
        ],
      },
      correct: 0,
      rationale: {
        fr: 'La méthode Tickra : exposé → exercice → revue. Sauter une étape ne fait pas gagner du temps.',
        en: 'The Tickra method: brief → drill → review. Skipping a step does not save time.',
      },
    },
    quiz: [
      {
        q: { fr: 'Tickra enseigne d’abord :', en: 'Tickra teaches first:' },
        options: { fr: ['La méthode', 'Les signaux', 'Les indicateurs secrets'], en: ['The method', 'Signals', 'Secret indicators'] },
        correct: 0,
        rationale: { fr: 'La méthode, toujours. Le reste se transmet ensuite.', en: 'The method, always. The rest follows.' },
      },
      {
        q: { fr: 'Une leçon Tickra dure :', en: 'A Tickra lesson runs:' },
        options: { fr: ['Environ 10 minutes', 'Une heure minimum', 'Aucune durée fixe'], en: ['About 10 minutes', 'At least one hour', 'No fixed length'] },
        correct: 0,
        rationale: { fr: 'Dix minutes. Court, dense, refaisable.', en: 'Ten minutes. Short, dense, repeatable.' },
      },
      {
        q: { fr: 'Le point de contrôle d’une piste sert à :', en: 'A track checkpoint exists to:' },
        options: { fr: ['Valider l’ensemble de la piste', 'Punir les retards', 'Comparer avec d’autres apprenants'], en: ['Validate the whole track', 'Punish lateness', 'Compare with other learners'] },
        correct: 0,
        rationale: { fr: 'Un point de contrôle peut être manqué — et repassé. C’est un test, pas une sanction.', en: 'A checkpoint can be failed — and retaken. It is a test, not a punishment.' },
      },
    ],
  };
}

export function getLessonContent(track: TrackMeta, lesson: LessonMeta): LessonContent {
  return seeded[lesson.id] ?? placeholder(track, lesson);
}

export function isSeeded(lessonId: string): boolean {
  return Object.prototype.hasOwnProperty.call(seeded, lessonId);
}
