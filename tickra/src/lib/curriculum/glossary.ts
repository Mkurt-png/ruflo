export type GlossaryTag = 'basics' | 'pattern' | 'level' | 'trend' | 'volume' | 'sizing' | 'bias' | 'order' | 'volatility';

export type GlossaryTerm = {
  term: { fr: string; en: string };
  definition: { fr: string; en: string };
  category: 'candles' | 'structure' | 'risk' | 'execution' | 'psychology';
  tags?: GlossaryTag[];
};

export function tagLabel(tag: GlossaryTag, locale: 'fr' | 'en'): string {
  const map: Record<GlossaryTag, { fr: string; en: string }> = {
    basics: { fr: 'Bases', en: 'Basics' },
    pattern: { fr: 'Figure', en: 'Pattern' },
    level: { fr: 'Niveau', en: 'Level' },
    trend: { fr: 'Tendance', en: 'Trend' },
    volume: { fr: 'Volume', en: 'Volume' },
    sizing: { fr: 'Sizing', en: 'Sizing' },
    bias: { fr: 'Biais', en: 'Bias' },
    order: { fr: 'Ordre', en: 'Order' },
    volatility: { fr: 'Volatilité', en: 'Volatility' },
  };
  return map[tag][locale];
}

// Tag inference from existing categories + a small keyword pass. Cheap and
// good enough — explicit tags can be added per-entry later.
function inferTags(term: GlossaryTerm): GlossaryTag[] {
  if (term.tags && term.tags.length) return term.tags;
  const out = new Set<GlossaryTag>();
  if (term.category === 'candles') out.add('pattern');
  if (term.category === 'structure') {
    out.add('level');
    if (/tend|trend|bos|cassure|break/i.test(term.term.en + ' ' + term.term.fr)) out.add('trend');
  }
  if (term.category === 'risk') {
    if (/taille|sizing|stop|1 %|1%/i.test(term.term.en + ' ' + term.term.fr)) out.add('sizing');
  }
  if (term.category === 'execution') {
    out.add('order');
    if (/vwap|volume|order block/i.test(term.term.en + ' ' + term.term.fr)) out.add('volume');
  }
  if (term.category === 'psychology') out.add('bias');
  if (/vol/i.test(term.term.en + ' ' + term.term.fr) && term.category !== 'execution') out.add('volatility');
  // Sensible default
  if (out.size === 0) out.add('basics');
  return Array.from(out);
}

export function tagsFor(term: GlossaryTerm): GlossaryTag[] {
  return inferTags(term);
}

export const GLOSSARY: GlossaryTerm[] = [
  { category: 'candles', term: { fr: 'Bougie japonaise', en: 'Japanese candle' }, definition: { fr: 'Représentation graphique d’une période contenant l’ouverture, le plus haut, le plus bas, et la clôture.', en: 'Graphical representation of a period containing open, high, low, and close.' } },
  { category: 'candles', term: { fr: 'Corps', en: 'Body' }, definition: { fr: 'Rectangle entre l’ouverture et la clôture d’une bougie. Mesure la conviction du côté gagnant.', en: 'Rectangle between open and close of a candle. Measures the winning side’s conviction.' } },
  { category: 'candles', term: { fr: 'Ombre', en: 'Wick' }, definition: { fr: 'Ligne fine au‑dessus ou en dessous du corps. Indique un rejet de niveau.', en: 'Thin line above or below the body. Indicates a level rejection.' } },
  { category: 'candles', term: { fr: 'Marubozu', en: 'Marubozu' }, definition: { fr: 'Bougie sans ombres notables : un côté du marché a contrôlé toute la séance.', en: 'Candle with no notable wicks: one side controlled the whole session.' } },
  { category: 'candles', term: { fr: 'Doji', en: 'Doji' }, definition: { fr: 'Bougie dont l’ouverture et la clôture sont quasi identiques. Indécision pure.', en: 'Candle whose open and close are nearly identical. Pure indecision.' } },
  { category: 'candles', term: { fr: 'Marteau', en: 'Hammer' }, definition: { fr: 'Petit corps en haut, longue ombre basse. Rejet du bas en fin de tendance baissière.', en: 'Small body on top, long lower wick. Low rejection at the end of a downtrend.' } },
  { category: 'candles', term: { fr: 'Englobante', en: 'Engulfing' }, definition: { fr: 'Bougie dont le corps englobe entièrement le corps de la bougie précédente.', en: 'Candle whose body fully engulfs the previous candle’s body.' } },
  { category: 'candles', term: { fr: 'Étoile du matin', en: 'Morning star' }, definition: { fr: 'Figure de retournement haussier en trois bougies à la fin d’une tendance baissière.', en: 'Three‑candle bullish reversal at the end of a downtrend.' } },

  { category: 'structure', term: { fr: 'Tendance', en: 'Trend' }, definition: { fr: 'Séquence de hauts et de bas dans une direction : HH/HL haussier, LL/LH baissier.', en: 'Sequence of highs and lows in one direction: HH/HL up, LL/LH down.' } },
  { category: 'structure', term: { fr: 'Range', en: 'Range' }, definition: { fr: 'Zone d’oscillation entre support et résistance, sans tendance claire.', en: 'Oscillation zone between support and resistance, no clear trend.' } },
  { category: 'structure', term: { fr: 'Support', en: 'Support' }, definition: { fr: 'Niveau où les acheteurs sont historiquement actifs et arrêtent une baisse.', en: 'Level where buyers historically step in and stop a decline.' } },
  { category: 'structure', term: { fr: 'Résistance', en: 'Resistance' }, definition: { fr: 'Niveau où les vendeurs sont historiquement actifs et arrêtent une hausse.', en: 'Level where sellers historically step in and stop a rise.' } },
  { category: 'structure', term: { fr: 'BoS (cassure de structure)', en: 'BoS (break of structure)' }, definition: { fr: 'Dépassement net du dernier point clé de la séquence. Confirme un changement.', en: 'Clean break beyond the last key point of the sequence. Confirms a shift.' } },
  { category: 'structure', term: { fr: 'Pullback', en: 'Pullback' }, definition: { fr: 'Contre‑mouvement temporaire à l’intérieur d’une tendance plus large.', en: 'Temporary counter‑move within a larger trend.' } },
  { category: 'structure', term: { fr: 'Fakeout', en: 'Fakeout' }, definition: { fr: 'Cassure de niveau qui rentre dans sa cage. Chasse à la liquidité, pas signal.', en: 'Level break that returns inside. Liquidity hunt, not a signal.' } },
  { category: 'structure', term: { fr: 'Multi‑timeframe', en: 'Multi‑timeframe' }, definition: { fr: 'Lecture combinée de plusieurs unités de temps pour aligner tendance, timing, entrée.', en: 'Combined read across multiple timeframes to align trend, timing, entry.' } },
  { category: 'structure', term: { fr: 'Niveau psychologique', en: 'Psychological level' }, definition: { fr: 'Chiffre rond (100, 1.10, 10 000) sur lequel beaucoup d’ordres se concentrent.', en: 'Round number (100, 1.10, 10,000) where many orders cluster.' } },

  { category: 'risk', term: { fr: 'Règle des 1 %', en: '1% rule' }, definition: { fr: 'Ne jamais risquer plus de 1 % du capital sur un seul trade.', en: 'Never risk more than 1% of capital on a single trade.' } },
  { category: 'risk', term: { fr: 'Taille de position', en: 'Position size' }, definition: { fr: 'Quantité d’unités calculée à partir du risque accepté et de la distance au stop.', en: 'Unit quantity computed from accepted risk and stop distance.' } },
  { category: 'risk', term: { fr: 'Stop', en: 'Stop' }, definition: { fr: 'Ordre automatique de sortie posé là où le setup devient invalide.', en: 'Automatic exit order placed where the setup becomes invalid.' } },
  { category: 'risk', term: { fr: 'Espérance', en: 'Expectancy' }, definition: { fr: '(Taux gagnant × Gain moyen) − (Taux perdant × Perte moyenne). Le moteur d’un système.', en: '(Win rate × Avg win) − (Loss rate × Avg loss). The engine of a system.' } },
  { category: 'risk', term: { fr: 'R:R (Risque/Rendement)', en: 'R:R (Risk/Reward)' }, definition: { fr: 'Rapport entre la perte potentielle et le gain potentiel d’un trade.', en: 'Ratio between potential loss and potential gain of a trade.' } },
  { category: 'risk', term: { fr: 'Drawdown', en: 'Drawdown' }, definition: { fr: 'Baisse temporaire du capital depuis son dernier sommet.', en: 'Temporary decline of capital from its last peak.' } },
  { category: 'risk', term: { fr: 'Risque de ruine', en: 'Risk of ruin' }, definition: { fr: 'Probabilité de descendre à zéro sous des paramètres donnés.', en: 'Probability of going to zero under given parameters.' } },
  { category: 'risk', term: { fr: 'Pyramidage', en: 'Pyramiding' }, definition: { fr: 'Ajouter à une position gagnante par étapes, jamais à une perdante.', en: 'Adding to a winning position in steps, never to a losing one.' } },
  { category: 'risk', term: { fr: 'Trailing stop', en: 'Trailing stop' }, definition: { fr: 'Stop qui suit le prix dans le sens favorable et ne recule jamais.', en: 'Stop that follows price in the favourable direction and never moves back.' } },

  { category: 'execution', term: { fr: 'Spread', en: 'Spread' }, definition: { fr: 'Écart entre le prix d’achat (ask) et le prix de vente (bid).', en: 'Gap between ask and bid prices.' } },
  { category: 'execution', term: { fr: 'Slippage', en: 'Slippage' }, definition: { fr: 'Écart entre le prix attendu d’un ordre et le prix réellement exécuté.', en: 'Gap between expected order price and actually executed price.' } },
  { category: 'execution', term: { fr: 'Levier', en: 'Leverage' }, definition: { fr: 'Multiplicateur de position. Amplifie gains et pertes à parts égales.', en: 'Position multiplier. Amplifies gains and losses equally.' } },
  { category: 'execution', term: { fr: 'Marge', en: 'Margin' }, definition: { fr: 'Garantie immobilisée par le courtier pour maintenir une position levier.', en: 'Collateral held by the broker to maintain a leveraged position.' } },
  { category: 'execution', term: { fr: 'Pip', en: 'Pip' }, definition: { fr: 'Plus petite variation de prix d’une paire FX (en général 0.0001).', en: 'Smallest price change of an FX pair (usually 0.0001).' } },
  { category: 'execution', term: { fr: 'Lot', en: 'Lot' }, definition: { fr: 'Unité de taille FX. 1 lot standard = 100 000 unités de la base.', en: 'FX size unit. 1 standard lot = 100,000 base units.' } },
  { category: 'execution', term: { fr: 'Order block', en: 'Order block' }, definition: { fr: 'Zone où une institution a placé ses ordres. Soutien futur potentiel.', en: 'Zone where an institution placed orders. Potential future support.' } },
  { category: 'execution', term: { fr: 'VWAP', en: 'VWAP' }, definition: { fr: 'Volume Weighted Average Price : prix moyen pondéré par le volume sur la séance.', en: 'Volume Weighted Average Price: volume‑weighted average price over the session.' } },

  { category: 'psychology', term: { fr: 'FOMO', en: 'FOMO' }, definition: { fr: 'Peur de manquer le mouvement. Pousse à entrer après que la majorité a déjà bougé.', en: 'Fear of missing out. Pushes you to enter after most of the move is gone.' } },
  { category: 'psychology', term: { fr: 'Revenge trading', en: 'Revenge trading' }, definition: { fr: 'Reprendre position après une perte pour « se refaire ». Détruit l’espérance.', en: 'Re‑entering after a loss to "make it back". Destroys expectancy.' } },
  { category: 'psychology', term: { fr: 'Ancrage', en: 'Anchoring' }, definition: { fr: 'Biais qui colle votre décision à un prix passé arbitraire (achat, plus haut, etc.).', en: 'Bias that anchors your decision to an arbitrary past price (entry, high, etc.).' } },
  { category: 'psychology', term: { fr: 'Tilt', en: 'Tilt' }, definition: { fr: 'État émotionnel où la qualité des décisions chute. À reconnaître, à arrêter.', en: 'Emotional state where decision quality drops. Recognise it, stop.' } },
  { category: 'psychology', term: { fr: 'Journal de trade', en: 'Trade journal' }, definition: { fr: 'Carnet de bord : entrées, raisons, sorties, R obtenu, leçon. Construit votre statistique.', en: 'Logbook: entries, reasons, exits, R earned, lesson. Builds your statistics.' } },
  { category: 'psychology', term: { fr: 'Pré‑mortem', en: 'Pre‑mortem' }, definition: { fr: 'Avant d’ouvrir un trade : décrire comment il va échouer et accepter ce scénario.', en: 'Before opening a trade: describe how it will fail and accept the scenario.' } },
];

export function categoryLabel(cat: GlossaryTerm['category'], locale: 'fr' | 'en'): string {
  const map: Record<GlossaryTerm['category'], { fr: string; en: string }> = {
    candles: { fr: 'Bougies', en: 'Candles' },
    structure: { fr: 'Structure', en: 'Structure' },
    risk: { fr: 'Risque', en: 'Risk' },
    execution: { fr: 'Exécution', en: 'Execution' },
    psychology: { fr: 'Psychologie', en: 'Psychology' },
  };
  return map[cat][locale];
}
