// Curriculum data model.
// 15 tracks · 240+ lessons. Each lesson is addressable by `{trackSlug}/{lessonSlug}`.
// Titles are bilingual; content lookup is done in `lesson-content.ts` (only seeded
// lessons have full bodies — the rest render a structured placeholder with the
// same shape so the runtime never breaks).
//
// Inspired by the progressive structure of BabyPips' School of Pipsology
// (Preschool → Graduation): start at the broadest market basics, then drill
// down into candles, structure, risk, patterns, advanced strategies, and
// finally live-market deployment.

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
  // ─── Foundations ─────────────────────────────────────────────────────────
  track('basics', 'forex-basics', 'foundations',
    t('Marchés & forex — les bases', 'Markets & forex — the basics'),
    t('Le vocabulaire et les mécaniques avant de toucher un graphique. 14 leçons.', 'The vocabulary and mechanics before you touch a chart. 14 lessons.'),
    [
      t('Qu’est‑ce que le forex ?', 'What is forex?'),
      t('Pourquoi trader le forex ?', 'Why trade forex?'),
      t('Paires de devises (majors)', 'Currency pairs (majors)'),
      t('Paires mineures et exotiques', 'Minors and exotics'),
      t('Pip, pipette, point', 'Pip, pipette, point'),
      t('Lot, mini lot, micro lot', 'Lot, mini lot, micro lot'),
      t('Levier et marge', 'Leverage and margin'),
      t('Bid, ask et spread', 'Bid, ask and spread'),
      t('Long vs short', 'Long vs short'),
      t('Calcul du P&L', 'Computing P&L'),
      t('Devise de base vs cotée', 'Base vs quote currency'),
      t('Participants du marché', 'Market participants'),
      t('Exercice : 5 P&L à calculer', 'Drill: compute 5 P&Ls'),
      t('Point de contrôle bases', 'Basics checkpoint'),
    ],
  ),
  track('brokers', 'brokers-platforms', 'foundations',
    t('Brokers & plateformes', 'Brokers & platforms'),
    t('Choisir un broker régulé et configurer ses outils. 10 leçons.', 'Pick a regulated broker and set up your tools. 10 lessons.'),
    [
      t('Choisir un broker régulé', 'Choosing a regulated broker'),
      t('Types de comptes', 'Account types'),
      t('Méthodes de financement', 'Funding methods'),
      t('MetaTrader 4 / 5', 'MetaTrader 4 / 5'),
      t('TradingView : prise en main', 'TradingView basics'),
      t('Types d’ordres', 'Order types'),
      t('Slippage et latence', 'Slippage and latency'),
      t('Frais cachés (swap, commissions)', 'Hidden fees (swap, commissions)'),
      t('Démo vs réel — l’état d’esprit', 'Demo vs live mindset'),
      t('Point de contrôle brokers', 'Brokers checkpoint'),
    ],
  ),
  track('candles', 'japanese-candles', 'foundations',
    t('Bougies japonaises', 'Japanese candles'),
    t('Lire ce qu’une bougie raconte. Reconnaître les figures de base. 18 leçons.', 'Read what a candle tells. Recognise the basic patterns. 18 lessons.'),
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
      t('Piercing line & dark cloud cover', 'Piercing line & dark cloud cover'),
      t('Tweezer tops & bottoms', 'Tweezer tops & bottoms'),
      t('Harami haussier et baissier', 'Bullish & bearish harami'),
      t('Three inside up / down', 'Three inside up / down'),
      t('Three outside up / down', 'Three outside up / down'),
      t('Toupies (spinning tops)', 'Spinning tops'),
      t('Bougies dans le contexte', 'Candles in context'),
      t('Point de contrôle bougies', 'Candles checkpoint'),
    ],
  ),
  track('structure', 'market-structure', 'foundations',
    t('Structure de marché', 'Market structure'),
    t('Tendance, range, niveaux. Le squelette de toute analyse. 18 leçons.', 'Trend, range, levels. The skeleton of every analysis. 18 lessons.'),
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
      t('Wyckoff (intro)', 'Wyckoff (intro)'),
      t('Phases d’accumulation', 'Accumulation phases'),
      t('Phases de distribution', 'Distribution phases'),
      t('Smart Money Concepts (intro)', 'Smart Money Concepts (intro)'),
      t('Exercice : 5 graphiques', 'Drill: 5 charts'),
      t('Point de contrôle structure', 'Structure checkpoint'),
    ],
  ),
  track('risk', 'risk-management', 'foundations',
    t('Gestion du risque', 'Risk management'),
    t('Le module qui sépare ceux qui restent de ceux qui partent. 16 leçons.', 'The module that separates those who stay from those who quit. 16 lessons.'),
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
      t('Corrélation entre paires', 'Pair correlations'),
      t('Couverture (hedging) — bases', 'Hedging basics'),
      t('Critère de Kelly', 'Kelly criterion'),
      t('Budget de risque hebdo', 'Weekly risk budget'),
      t('Mathématiques du recovery', 'Drawdown recovery math'),
      t('Exercice : simuler 100 trades', 'Drill: simulate 100 trades'),
      t('Point de contrôle risque', 'Risk checkpoint'),
    ],
  ),

  // ─── Intermediate ────────────────────────────────────────────────────────
  track('sr', 'support-resistance', 'intermediate',
    t('Supports & résistances', 'Support & resistance'),
    t('Les niveaux qui comptent et ceux qui mentent. 14 leçons.', 'The levels that matter and the ones that lie. 14 lessons.'),
    [
      t('Définir un niveau', 'Defining a level'),
      t('Force d’un niveau', 'Strength of a level'),
      t('Inversion support → résistance', 'Support → resistance flip'),
      t('Zones d’offre et de demande', 'Supply and demand zones'),
      t('Order blocks (intro)', 'Order blocks (intro)'),
      t('Confluence', 'Confluence'),
      t('Liquidité aux extrêmes', 'Liquidity at extremes'),
      t('Stop hunts', 'Stop hunts'),
      t('Fibonacci : retracement', 'Fibonacci retracement'),
      t('Fibonacci : extensions', 'Fibonacci extensions'),
      t('Pivots Camarilla', 'Camarilla pivots'),
      t('Liquidity grabs', 'Liquidity grabs'),
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
    t('Les figures qui valent encore quelque chose, classiques et harmoniques. 18 leçons.', 'The patterns that still mean something — classic and harmonic. 18 lessons.'),
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
      t('Gartley', 'Gartley'),
      t('Papillon (butterfly)', 'Butterfly'),
      t('Chauve‑souris (bat)', 'Bat'),
      t('Crabe', 'Crab'),
      t('Trois entraînements (three drives)', 'Three drives'),
      t('Exercice : 5 figures à identifier', 'Drill: identify 5 patterns'),
      t('Point de contrôle figures', 'Patterns checkpoint'),
    ],
  ),
  track('fundamentals', 'fundamental-analysis', 'intermediate',
    t('Analyse fondamentale', 'Fundamental analysis'),
    t('Ce qui bouge un prix avant que le graphique ne le sache. 16 leçons.', 'What moves price before the chart catches up. 16 lessons.'),
    [
      t('Macro vs micro', 'Macro vs micro'),
      t('Banques centrales (FED, BCE)', 'Central banks (FED, ECB)'),
      t('Taux d’intérêt et forex', 'Interest rates and forex'),
      t('Inflation et IPC', 'Inflation and CPI'),
      t('Emploi : NFP', 'Employment: NFP'),
      t('PIB et PMI', 'GDP and PMI'),
      t('Balance commerciale', 'Trade balance'),
      t('Matières premières et devises', 'Commodities and currencies'),
      t('Géopolitique et risque', 'Geopolitics and risk'),
      t('Calendrier économique', 'Economic calendar'),
      t('Événements à fort impact', 'High‑impact events'),
      t('Carry trade : fondamentaux', 'Carry trade fundamentals'),
      t('Risk‑on vs risk‑off', 'Risk‑on vs risk‑off'),
      t('Lire un communiqué BC', 'Reading a central‑bank statement'),
      t('Exercice : décrypter une semaine', 'Drill: parse a calendar week'),
      t('Point de contrôle fondamentaux', 'Fundamentals checkpoint'),
    ],
  ),
  track('sessions', 'sessions-instruments', 'intermediate',
    t('Sessions & instruments', 'Sessions & instruments'),
    t('Quand trader, et quoi trader. 12 leçons.', 'When to trade, and what to trade. 12 lessons.'),
    [
      t('Sessions asiatique, Londres, NY', 'Asian, London, NY sessions'),
      t('Recouvrements de sessions', 'Session overlaps'),
      t('Meilleures paires par session', 'Best pairs per session'),
      t('Vendredi/dimanche : gaps', 'Friday close, Sunday open'),
      t('Liquidité en jours fériés', 'Holiday liquidity'),
      t('Or (XAU/USD)', 'Gold (XAU/USD)'),
      t('Indices (S&P, NAS100)', 'Indices (S&P, NAS100)'),
      t('Pétrole', 'Oil'),
      t('Crypto vs forex', 'Crypto vs forex'),
      t('Obligations (intro)', 'Bonds (intro)'),
      t('Exercice : classer 5 instruments', 'Drill: classify 5 instruments'),
      t('Point de contrôle sessions', 'Sessions checkpoint'),
    ],
  ),

  // ─── Advanced ────────────────────────────────────────────────────────────
  track('trend', 'trend-strategies', 'advanced',
    t('Stratégies de tendance', 'Trend strategies'),
    t('Entrer dans le sens du marché, sans courir derrière. 16 leçons.', 'Enter with the market, without chasing. 16 lessons.'),
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
      t('MACD', 'MACD'),
      t('Force d’une tendance : ADX', 'Trend strength: ADX'),
      t('Heikin Ashi', 'Heikin Ashi'),
      t('Ichimoku — intro', 'Ichimoku — intro'),
      t('Exercice : 3 setups sur SPY', 'Drill: 3 SPY setups'),
      t('Point de contrôle tendance', 'Trend checkpoint'),
    ],
  ),
  track('range', 'range-strategies', 'advanced',
    t('Stratégies de range', 'Range strategies'),
    t('Acheter le bas, vendre le haut, ou rien du tout. 14 leçons.', 'Buy the low, sell the high, or do nothing. 14 lessons.'),
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
      t('Oscillateur stochastique', 'Stochastic oscillator'),
      t('Canaux de Keltner', 'Keltner channels'),
      t('Quand le mean reversion échoue', 'When mean reversion fails'),
      t('Exercice : range sur GBP/USD', 'Drill: GBP/USD range'),
      t('Point de contrôle range', 'Range checkpoint'),
    ],
  ),
  track('vol', 'volatility-regimes', 'advanced',
    t('Régimes de volatilité', 'Volatility regimes'),
    t('Adapter la stratégie au régime. Pas l’inverse. 14 leçons.', 'Adapt your strategy to the regime. Not the reverse. 14 lessons.'),
    [
      t('Mesurer la volatilité', 'Measuring volatility'),
      t('VIX et indices', 'VIX and indices'),
      t('ATR comme baromètre', 'ATR as a barometer'),
      t('Régime calme', 'Calm regime'),
      t('Régime nerveux', 'Nervous regime'),
      t('Crise de liquidité', 'Liquidity crisis'),
      t('Sizing en fonction de la vol', 'Sizing by volatility'),
      t('Stops dynamiques', 'Dynamic stops'),
      t('Vol implicite vs réalisée', 'Implied vs realized vol'),
      t('Cycles de volatilité', 'Volatility cycles'),
      t('Transitions risk‑on / risk‑off', 'Risk‑on / risk‑off transitions'),
      t('Stop chase en haute vol', 'Stop chase under high vol'),
      t('Exercice : classer 10 séances', 'Drill: classify 10 sessions'),
      t('Point de contrôle volatilité', 'Volatility checkpoint'),
    ],
  ),

  // ─── Mastery ─────────────────────────────────────────────────────────────
  track('psy', 'psychology-journal', 'mastery',
    t('Psychologie & journal', 'Psychology & journal'),
    t('Le travail invisible qui décide tout. 16 leçons.', 'The invisible work that decides everything. 16 lessons.'),
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
      t('Charge cognitive et décisions', 'Cognitive load and decisions'),
      t('Détecter le tilt', 'Detecting tilt'),
      t('Limites de perte journalières', 'Daily loss limits'),
      t('Visualisation et répétition', 'Visualization and rehearsal'),
      t('Exercice : 5 entrées de journal', 'Drill: 5 journal entries'),
      t('Point de contrôle psy', 'Psychology checkpoint'),
    ],
  ),
  track('live', 'live-markets', 'mastery',
    t('Marchés réels', 'Live markets'),
    t('Passer des exercices au marché. Avec un parachute. 14 leçons.', 'From drills to the market. With a parachute. 14 lessons.'),
    [
      t('Choisir un courtier (rappel)', 'Choosing a broker (refresher)'),
      t('Démo vs réel', 'Demo vs live'),
      t('Petits montants d’abord', 'Small size first'),
      t('Tradez ce que vous savez', 'Trade what you know'),
      t('Journal réel', 'Real journal'),
      t('Revue hebdomadaire', 'Weekly review'),
      t('Plateau et patience', 'Plateau and patience'),
      t('Quand monter en taille', 'When to scale up'),
      t('Fiscalité — vue d’ensemble', 'Taxes — overview'),
      t('Santé mentale et pauses', 'Mental health and breaks'),
      t('Scaler son capital', 'Scaling capital'),
      t('Savoir s’arrêter', 'Knowing when to quit'),
      t('Exercice : plan d’un mois', 'Drill: one‑month plan'),
      t('Diplôme kNOWTrade', 'kNOWTrade diploma'),
    ],
  ),
];

// Sanity log only — no hard count to keep the curriculum easy to extend.
const TOTAL_LESSONS = TRACKS.reduce((n, t) => n + t.lessons.length, 0);

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
