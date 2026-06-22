// TICKRA-PHASE-3: candlestick-pattern trainer data + helpers.
// Each pattern is a tiny synthetic OHLC sequence plus its name and meaning.
// Pure and deterministic so the trainer can be built and unit-tested without
// any chart library — the UI renders candles from these four numbers each.

export type Candle = { o: number; h: number; l: number; c: number };

export type CandlePattern = {
  id: string;
  name: { fr: string; en: string };
  bias: 'bullish' | 'bearish' | 'neutral';
  candles: Candle[];
  meaning: { fr: string; en: string };
};

// Helper to keep OHLC internally consistent while authoring.
function k(o: number, h: number, l: number, c: number): Candle {
  return { o, h, l, c };
}

export const CANDLE_PATTERNS: CandlePattern[] = [
  {
    id: 'doji',
    name: { fr: 'Doji', en: 'Doji' },
    bias: 'neutral',
    candles: [k(100, 104, 96, 100.2)],
    meaning: {
      fr: 'Ouverture ≈ clôture : indécision. Le marché hésite, souvent un signe de pause ou de retournement potentiel.',
      en: 'Open ≈ close: indecision. The market hesitates — often a pause or a potential reversal signal.',
    },
  },
  {
    id: 'hammer',
    name: { fr: 'Marteau', en: 'Hammer' },
    bias: 'bullish',
    candles: [k(101, 102, 92, 101.5)],
    meaning: {
      fr: 'Longue ombre basse, petit corps en haut : les vendeurs ont poussé puis ont été rejetés. Signal haussier après une baisse.',
      en: 'Long lower wick, small body on top: sellers pushed then got rejected. Bullish after a downmove.',
    },
  },
  {
    id: 'shooting-star',
    name: { fr: 'Étoile filante', en: 'Shooting star' },
    bias: 'bearish',
    candles: [k(101, 110, 100.5, 101.2)],
    meaning: {
      fr: 'Longue ombre haute, petit corps en bas : les acheteurs ont échoué à tenir les sommets. Signal baissier après une hausse.',
      en: 'Long upper wick, small body at the bottom: buyers failed to hold the highs. Bearish after an upmove.',
    },
  },
  {
    id: 'marubozu',
    name: { fr: 'Marubozu', en: 'Marubozu' },
    bias: 'bullish',
    candles: [k(95, 110, 95, 110)],
    meaning: {
      fr: 'Grand corps sans ombres : un camp domine du début à la fin. Forte conviction directionnelle.',
      en: 'Large body, no wicks: one side dominates open to close. Strong directional conviction.',
    },
  },
  {
    id: 'bullish-engulfing',
    name: { fr: 'Avalement haussier', en: 'Bullish engulfing' },
    bias: 'bullish',
    candles: [k(105, 106, 99, 100), k(99, 110, 98.5, 108)],
    meaning: {
      fr: 'Une grande bougie verte engloutit la rouge précédente : bascule de l’offre vers la demande.',
      en: 'A large green candle engulfs the prior red one: supply flips to demand.',
    },
  },
  {
    id: 'bearish-engulfing',
    name: { fr: 'Avalement baissier', en: 'Bearish engulfing' },
    bias: 'bearish',
    candles: [k(100, 107, 99, 106), k(107, 108, 96, 97)],
    meaning: {
      fr: 'Une grande bougie rouge engloutit la verte précédente : bascule de la demande vers l’offre.',
      en: 'A large red candle engulfs the prior green one: demand flips to supply.',
    },
  },
  {
    id: 'morning-star',
    name: { fr: 'Étoile du matin', en: 'Morning star' },
    bias: 'bullish',
    candles: [k(108, 109, 100, 101), k(100, 101, 98, 99.5), k(100, 110, 99.5, 109)],
    meaning: {
      fr: 'Rouge, petite indécision, puis verte : retournement haussier en trois temps après une baisse.',
      en: 'Red, small indecision, then green: a three-step bullish reversal after a decline.',
    },
  },
  {
    id: 'evening-star',
    name: { fr: 'Étoile du soir', en: 'Evening star' },
    bias: 'bearish',
    candles: [k(100, 110, 99, 109), k(109, 111, 108, 109.5), k(109, 110, 99, 100)],
    meaning: {
      fr: 'Verte, petite indécision, puis rouge : retournement baissier en trois temps après une hausse.',
      en: 'Green, small indecision, then red: a three-step bearish reversal after a rally.',
    },
  },
];

/** A trainer question: one pattern to show + shuffled answer options. */
export type PatternQuestion = {
  pattern: CandlePattern;
  options: string[]; // localised names, includes the correct one
  correctIndex: number;
};

// Mulberry32 again — a seedable PRNG keeps question generation testable.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Build a question for `pattern` with `distractors` wrong options. */
export function buildQuestion(
  pattern: CandlePattern,
  locale: 'fr' | 'en',
  seed: number,
  distractors = 3,
): PatternQuestion {
  const rng = mulberry32(seed);
  const others = CANDLE_PATTERNS.filter((p) => p.id !== pattern.id);
  const picked = shuffle(others, rng).slice(0, distractors);
  const options = shuffle([pattern, ...picked], rng).map((p) => p.name[locale]);
  return {
    pattern,
    options,
    correctIndex: options.indexOf(pattern.name[locale]),
  };
}

/** Pick a pattern deterministically by seed (for a quiz round). */
export function patternForSeed(seed: number): CandlePattern {
  const rng = mulberry32(seed);
  return CANDLE_PATTERNS[Math.floor(rng() * CANDLE_PATTERNS.length)];
}
