// Curriculum data model.
// 11 tracks · 127 lessons. Each lesson is addressable by `{trackSlug}/{lessonSlug}`.
// Titles are bilingual; content lookup is done in `lesson-content.ts` (only seeded
// lessons have full bodies — the rest render a structured placeholder with the
// same shape so the runtime never breaks).

export type Level = 'foundations' | 'intermediate' | 'advanced' | 'mastery';

export type LocalisedString = { fr: string; en: string };

export type LessonMeta = {
  id: string;          // global stable id, e.g. "candles-01"
  slug: string;        // url segment, e.g. "01-anatomy"
  index: number;       // 1-based index within track
  title: LocalisedString;
};

export type TrackMeta = {
  id: string;
  slug: string;
  level: Level;
  title: LocalisedString;
  summary: LocalisedString;
  lessons: LessonMeta[];
};

const t = (fr: string, en: string): LocalisedString => ({ fr, en });

function track(
  id: string,
  slug: string,
  level: Level,
  title: LocalisedString,
  summary: LocalisedString,
  lessonTitles: LocalisedString[],
): TrackMeta {
  return {
    id,
    slug,
    level,
    title,
    summary,
    lessons: lessonTitles.map((title, i) => ({
      id: `${id}-${String(i + 1).padStart(2, '0')}`,
      slug: `${String(i + 1).padStart(2, '0')}-${slugify(title.en)}`,
      index: i + 1,
      title,
    })),
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export const TRACKS: TrackMeta[] = [
  track('candles', 'japanese-candles', 'foundations',
    t('Bougies japonaises', 'Japanese candles'),
    t('Lire ce qu’une bougie raconte. Reconnaître les figures de base. 12 leçons.', 'Read what a candle tells. Recognise the basic patterns. 12 lessons.'),
    [
      t('Anatomie d’une bougie', 'Anatomy of a candle'),
      t('Corps, ombres, ratio', 'Body, wicks, ratio'),
      t('Bougies pleines vs creuses', 'Filled vs hollow candles'),
      t('La marubozu', 'The marubozu'),
      t('Le doji', 'The doji'),
      t('Marteaux et pendus', 'Hammers and hanging men'),
      t('Étoiles du matin et du soir', 'Morning and evening stars'),
      t('Englobantes haussières', 'Bullish engulfing'),
      t('Englobantes baissières', 'Bearish engulfing'),
      t('Trois soldats, trois corbeaux', 'Three soldiers, three crows'),
      t('Bougies dans le contexte', 'Candles in context'),
      t('Point de contrôle bougies', 'Candles checkpoint'),
    ],
  ),
  track('structure', 'market-structure', 'foundations',
    t('Structure de marché', 'Market structure'),
    t('Tendance, range, niveaux. Le squelette de toute analyse. 14 leçons.', 'Trend, range, levels. The skeleton of every analysis. 14 lessons.'),
    [
      t('Définir une tendance', 'Defining a trend'),
      t('Hauts et bas successifs', 'Higher highs, lower lows'),
      t('Range et consolidation', 'Range and consolidation'),
      t('Cassures de structure', 'Structure breaks'),
      t('Pivot points', 'Pivot points'),
      t('Niveaux psychologiques', 'Psychological levels'),
      t('Multi‑timeframe', 'Multi‑timeframe'),
      t('Tendance dans la tendance', 'Trend within trend'),
      t('Fausses cassures', 'False breakouts'),
      t('Retournements vs continuations', 'Reversals vs continuations'),
      t('Lire un graphique propre', 'Reading a clean chart'),
      t('Marquer un graphique', 'Marking up a chart'),
      t('Exercice : 5 graphiques', 'Drill: 5 charts'),
      t('Point de contrôle structure', 'Structure checkpoint'),
    ],
  ),
  track('risk', 'risk-management', 'foundations',
    t('Gestion du risque', 'Risk management'),
    t('Le module qui sépare ceux qui restent de ceux qui partent. 11 leçons.', 'The module that separates those who stay from those who quit. 11 lessons.'),
    [
      t('La règle des 1 %', 'The 1% rule'),
      t('Taille de position', 'Position sizing'),
      t('Placement du stop', 'Stop placement'),
      t('Espérance mathématique', 'Mathematical expectancy'),
      t('Ratio risque/rendement', 'Risk/reward ratio'),
      t('Risque de ruine', 'Risk of ruin'),
      t('Drawdown psychologique', 'Psychological drawdown'),
      t('Stops mobiles', 'Trailing stops'),
      t('Pyramider une position', 'Pyramiding into a position'),
      t('Exercice : simuler 100 trades', 'Drill: simulate 100 trades'),
      t('Point de contrôle risque', 'Risk checkpoint'),
    ],
  ),
  track('sr', 'support-resistance', 'intermediate',
    t('Supports & résistances', 'Support & resistance'),
    t('Les niveaux qui comptent et ceux qui mentent. 10 leçons.', 'The levels that matter and the ones that lie. 10 lessons.'),
    [
      t('Définir un niveau', 'Defining a level'),
      t('Force d’un niveau', 'Strength of a level'),
      t('Inversion support → résistance', 'Support → resistance flip'),
      t('Zones d’offre et de demande', 'Supply and demand zones'),
      t('Order blocks (intro)', 'Order blocks (intro)'),
      t('Confluence', 'Confluence'),
      t('Liquidité aux extrêmes', 'Liquidity at extremes'),
      t('Stop hunts', 'Stop hunts'),
      t('Exercice : tracer 5 niveaux', 'Drill: draw 5 levels'),
      t('Point de contrôle S&R', 'S&R checkpoint'),
    ],
  ),
  track('volume', 'volume-order-flow', 'intermediate',
    t('Volumes & order flow', 'Volume & order flow'),
    t('Voir qui pousse, qui défend, qui capitule. 12 leçons.', 'See who pushes, who defends, who capitulates. 12 lessons.'),
    [
      t('Volume : pourquoi', 'Volume: why it matters'),
      t('Lire un profil de volume', 'Reading a volume profile'),
      t('Point of Control (POC)', 'Point of Control (POC)'),
      t('Value Area High / Low', 'Value Area High / Low'),
      t('Climax volume', 'Volume climax'),
      t('Divergences prix‑volume', 'Price‑volume divergences'),
      t('Carnet d’ordres (intro)', 'Order book (intro)'),
      t('Spoofing et icebergs', 'Spoofing and icebergs'),
      t('VWAP', 'VWAP'),
      t('Time and Sales', 'Time and Sales'),
      t('Exercice : profile EUR/USD', 'Drill: EUR/USD profile'),
      t('Point de contrôle volume', 'Volume checkpoint'),
    ],
  ),
  track('patterns', 'chart-patterns', 'intermediate',
    t('Figures chartistes', 'Chart patterns'),
    t('Les figures qui valent encore quelque chose. 13 leçons.', 'The patterns that still mean something. 13 lessons.'),
    [
      t('Triangles symétriques', 'Symmetrical triangles'),
      t('Triangles ascendants', 'Ascending triangles'),
      t('Triangles descendants', 'Descending triangles'),
      t('Tête‑épaules', 'Head and shoulders'),
      t('Tête‑épaules inversée', 'Inverse head and shoulders'),
      t('Drapeaux haussiers', 'Bull flags'),
      t('Drapeaux baissiers', 'Bear flags'),
      t('Wedges (biseaux)', 'Wedges'),
      t('Doubles tops/bottoms', 'Double tops/bottoms'),
      t('Coupes & anses', 'Cups and handles'),
      t('Quand une figure échoue', 'When a pattern fails'),
      t('Exercice : 5 figures à identifier', 'Drill: identify 5 patterns'),
      t('Point de contrôle figures', 'Patterns checkpoint'),
    ],
  ),
  track('trend', 'trend-strategies', 'advanced',
    t('Stratégies de tendance', 'Trend strategies'),
    t('Entrer dans le sens du marché, sans courir derrière. 12 leçons.', 'Enter with the market, without chasing. 12 lessons.'),
    [
      t('Moyennes mobiles', 'Moving averages'),
      t('Pullback sur moyenne', 'Pullback to MA'),
      t('Cross 20/50', '20/50 cross'),
      t('Breakout sur résistance', 'Resistance breakout'),
      t('Retest et entrée', 'Retest and entry'),
      t('Trailing stop sur tendance', 'Trailing stop on trend'),
      t('ATR pour le stop', 'ATR for stop'),
      t('Sortir une tendance', 'Exiting a trend'),
      t('Tendance vs régime', 'Trend vs regime'),
      t('Quand ne pas trader', 'When not to trade'),
      t('Exercice : 3 setups sur SPY', 'Drill: 3 SPY setups'),
      t('Point de contrôle tendance', 'Trend checkpoint'),
    ],
  ),
  track('range', 'range-strategies', 'advanced',
    t('Stratégies de range', 'Range strategies'),
    t('Acheter le bas, vendre le haut, ou rien du tout. 11 leçons.', 'Buy the low, sell the high, or do nothing. 11 lessons.'),
    [
      t('Repérer un range', 'Spotting a range'),
      t('Range vs tendance', 'Range vs trend'),
      t('Mean reversion', 'Mean reversion'),
      t('RSI extrêmes', 'RSI extremes'),
      t('Bandes de Bollinger', 'Bollinger bands'),
      t('Sortie de range : breakout', 'Range exit: breakout'),
      t('Fausses sorties', 'Fakeouts'),
      t('Risque accru', 'Heightened risk'),
      t('Carry trade (intro)', 'Carry trade (intro)'),
      t('Exercice : range sur GBP/USD', 'Drill: GBP/USD range'),
      t('Point de contrôle range', 'Range checkpoint'),
    ],
  ),
  track('vol', 'volatility-regimes', 'advanced',
    t('Régimes de volatilité', 'Volatility regimes'),
    t('Adapter la stratégie au régime. Pas l’inverse. 10 leçons.', 'Adapt your strategy to the regime. Not the reverse. 10 lessons.'),
    [
      t('Mesurer la volatilité', 'Measuring volatility'),
      t('VIX et indices', 'VIX and indices'),
      t('ATR comme baromètre', 'ATR as a barometer'),
      t('Régime calme', 'Calm regime'),
      t('Régime nerveux', 'Nervous regime'),
      t('Crise de liquidité', 'Liquidity crisis'),
      t('Sizing en fonction de la vol', 'Sizing by volatility'),
      t('Stops dynamiques', 'Dynamic stops'),
      t('Exercice : classer 10 séances', 'Drill: classify 10 sessions'),
      t('Point de contrôle volatilité', 'Volatility checkpoint'),
    ],
  ),
  track('psy', 'psychology-journal', 'mastery',
    t('Psychologie & journal', 'Psychology & journal'),
    t('Le travail invisible qui décide tout. 12 leçons.', 'The invisible work that decides everything. 12 lessons.'),
    [
      t('Le journal de trade', 'The trade journal'),
      t('Pré‑mortem d’un trade', 'Pre‑mortem of a trade'),
      t('Post‑mortem d’un trade', 'Post‑mortem of a trade'),
      t('Biais : FOMO', 'Bias: FOMO'),
      t('Biais : revenge trading', 'Bias: revenge trading'),
      t('Biais : ancrage', 'Bias: anchoring'),
      t('Sortie prématurée', 'Premature exit'),
      t('Tenir le winner', 'Holding the winner'),
      t('Routines pré‑séance', 'Pre‑session routines'),
      t('Sommeil et décisions', 'Sleep and decisions'),
      t('Exercice : 5 entrées de journal', 'Drill: 5 journal entries'),
      t('Point de contrôle psy', 'Psychology checkpoint'),
    ],
  ),
  track('live', 'live-markets', 'mastery',
    t('Marchés réels', 'Live markets'),
    t('Passer des exercices au marché. Avec un parachute. 10 leçons.', 'From drills to the market. With a parachute. 10 lessons.'),
    [
      t('Choisir un courtier', 'Choosing a broker'),
      t('Démo vs réel', 'Demo vs live'),
      t('Petits montants d’abord', 'Small size first'),
      t('Tradez ce que vous savez', 'Trade what you know'),
      t('Journal réel', 'Real journal'),
      t('Revue hebdomadaire', 'Weekly review'),
      t('Plateau et patience', 'Plateau and patience'),
      t('Quand monter en taille', 'When to scale up'),
      t('Exercice : plan d’un mois', 'Drill: one‑month plan'),
      t('Diplôme Tickra', 'Tickra diploma'),
    ],
  ),
];

// Sanity guard — lock in 127 lessons.
const TOTAL_LESSONS = TRACKS.reduce((n, t) => n + t.lessons.length, 0);
if (TOTAL_LESSONS !== 127) {
  // Surfaces at import time during build if anyone alters lesson counts.
  // eslint-disable-next-line no-console
  console.warn(`[curriculum] expected 127 lessons, got ${TOTAL_LESSONS}`);
}

export function getTrack(slug: string): TrackMeta | undefined {
  return TRACKS.find((t) => t.slug === slug);
}

export function getLesson(
  trackSlug: string,
  lessonSlug: string,
): { track: TrackMeta; lesson: LessonMeta } | undefined {
  const track = getTrack(trackSlug);
  if (!track) return undefined;
  const lesson = track.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) return undefined;
  return { track, lesson };
}

export function getNeighbours(
  trackSlug: string,
  lessonSlug: string,
): {
  prev: { trackSlug: string; lesson: LessonMeta } | null;
  next: { trackSlug: string; lesson: LessonMeta } | null;
} {
  const ti = TRACKS.findIndex((t) => t.slug === trackSlug);
  if (ti < 0) return { prev: null, next: null };
  const track = TRACKS[ti];
  const li = track.lessons.findIndex((l) => l.slug === lessonSlug);
  if (li < 0) return { prev: null, next: null };

  let prev: { trackSlug: string; lesson: LessonMeta } | null = null;
  let next: { trackSlug: string; lesson: LessonMeta } | null = null;

  if (li > 0) prev = { trackSlug, lesson: track.lessons[li - 1] };
  else if (ti > 0) {
    const prevTrack = TRACKS[ti - 1];
    prev = { trackSlug: prevTrack.slug, lesson: prevTrack.lessons[prevTrack.lessons.length - 1] };
  }

  if (li < track.lessons.length - 1) next = { trackSlug, lesson: track.lessons[li + 1] };
  else if (ti < TRACKS.length - 1) {
    const nextTrack = TRACKS[ti + 1];
    next = { trackSlug: nextTrack.slug, lesson: nextTrack.lessons[0] };
  }

  return { prev, next };
}

export function totalLessons(): number {
  return TOTAL_LESSONS;
}

export function lessonGlobalIndex(trackSlug: string, lessonSlug: string): number {
  let n = 0;
  for (const t of TRACKS) {
    if (t.slug === trackSlug) {
      const i = t.lessons.findIndex((l) => l.slug === lessonSlug);
      return i < 0 ? -1 : n + i + 1;
    }
    n += t.lessons.length;
  }
  return -1;
}
