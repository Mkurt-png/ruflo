// Stratégies de range — leçons 6 à 10 (Pro). Server-only: paid copy,
// imported only through lesson-content.ts (see no-paid-content-in-bundle.test.ts).

import type { LessonContent } from '../lesson-content';

export const RANGE_B: Record<string, LessonContent> = {
  'range-06': {
    chart: { symbol: 'FX:GBPUSD', interval: '240' },
    intro: {
      fr: [
        'Tout range finit par casser. La cassure transforme la situation : le trader de range doit sortir, le trader de tendance peut entrer. Les mêmes critères que pour une cassure de résistance s’appliquent — clôture franche hors de la zone, bougie plus ample que la moyenne, volume en hausse si l’actif en publie.',
        'Objectif mesuré classique : la hauteur du range, reportée depuis la borne cassée. Un range de 100 pips cassé par le haut vise environ 100 pips au-dessus de la borne haute. C’est un ordre de grandeur, pas une promesse : utilisez-le pour vérifier qu’un trade a un R:R suffisant.',
        'Le stop se place à l’intérieur du range, typiquement vers le milieu : si le prix réintègre franchement la zone, la cassure a échoué. Et si vous étiez en position de range contre la cassure, la seule question est de savoir si votre stop a été exécuté — pas de le déplacer.',
      ],
      en: [
        'Every range eventually breaks. The breakout changes everything: the range trader must exit, the trend trader may enter. The same criteria as for a resistance breakout apply — a clean close outside the zone, a candle larger than average, rising volume if the asset reports it.',
        'The classic measured target: the range height, projected from the broken boundary. A 100-pip range broken to the upside targets roughly 100 pips above the top. It is an order of magnitude, not a promise: use it to check that a trade has enough R:R.',
        'The stop goes inside the range, typically near the middle: if price clearly re-enters the zone, the breakout failed. And if you were holding a range trade against the breakout, the only question is whether your stop was filled — not whether to move it.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Range 1.2500–1.2600 cassé par le haut avec une clôture à 1.2615. Objectif mesuré ?',
        en: 'Range 1.2500–1.2600 broken to the upside with a close at 1.2615. Measured target?',
      },
      options: { fr: ['≈ 1.2700', '≈ 1.2615', '≈ 1.3000'], en: ['≈ 1.2700', '≈ 1.2615', '≈ 1.3000'] },
      correct: 0,
      rationale: {
        fr: 'Hauteur : 1.2600 − 1.2500 = 100 pips. Reportée depuis la borne haute : 1.2600 + 0.0100 = 1.2700.',
        en: 'Height: 1.2600 − 1.2500 = 100 pips. Projected from the top boundary: 1.2600 + 0.0100 = 1.2700.',
      },
    },
    quiz: [
      {
        q: { fr: 'L’objectif mesuré d’une sortie de range est :', en: 'A range breakout’s measured target is:' },
        options: {
          fr: ['Un ordre de grandeur pour évaluer le R:R', 'Un niveau garanti', 'Toujours le double du range'],
          en: ['An order of magnitude to assess R:R', 'A guaranteed level', 'Always twice the range'],
        },
        correct: 0,
        rationale: {
          fr: 'Le marché ne connaît pas vos mesures. Elles servent à décider si le trade vaut le risque.',
          en: 'The market does not know your measurements. They help decide whether the trade is worth the risk.',
        },
      },
      {
        q: { fr: 'Stop logique après une cassure haussière :', en: 'Logical stop after an upside breakout:' },
        options: {
          fr: ['À l’intérieur du range, vers le milieu', 'Au plus haut de la bougie de cassure', 'Sous le bas du range, toujours'],
          en: ['Inside the range, near the middle', 'At the breakout candle’s high', 'Below the range bottom, always'],
        },
        correct: 0,
        rationale: {
          fr: 'Une réintégration franche du range invalide la cassure. Sous le bas du range, le stop serait souvent démesuré.',
          en: 'A clear re-entry into the range invalidates the breakout. Below the range bottom, the stop would often be oversized.',
        },
      },
      {
        q: { fr: 'Vous étiez vendeur au plafond, le range casse vers le haut :', en: 'You were short at the ceiling and the range breaks up:' },
        options: {
          fr: ['Votre stop vous sort, c’est prévu', 'Vous élargissez le stop', 'Vous vendez davantage'],
          en: ['Your stop takes you out, as planned', 'You widen the stop', 'You sell more'],
        },
        correct: 0,
        rationale: {
          fr: 'Cette perte fait partie du coût normal du trading de range. L’élargir ou moyenner transforme une perte prévue en catastrophe.',
          en: 'That loss is part of the normal cost of range trading. Widening or averaging turns a planned loss into a disaster.',
        },
      },
    ],
  },

  'range-07': {
    chart: { symbol: 'FX:EURUSD', interval: '60' },
    intro: {
      fr: [
        'Une fausse sortie (fakeout) : le prix dépasse une borne, déclenche les stops placés juste derrière et les ordres d’achat sur cassure, puis revient dans le range. Les bornes évidentes concentrent les ordres ; ces ordres sont une liquidité que le marché va souvent chercher.',
        'Signature typique : une mèche au-delà de la borne, et une clôture qui revient à l’intérieur. Plus la réintégration est rapide et nette, plus la fausse sortie est franche. Beaucoup de traders de range l’utilisent comme entrée : une fausse sortie par le bas devient un signal d’achat, avec pour objectif le milieu puis la borne opposée.',
        'Deux protections contre les fausses sorties : attendre la clôture pour valider une cassure, et placer ses stops au-delà de la zone de la borne plutôt que juste derrière le dernier plus bas visible. Un stop placé là où tout le monde le place est un stop que le marché trouvera.',
      ],
      en: [
        'A fakeout: price pushes past a boundary, triggers the stops just behind it and the breakout buy orders, then returns into the range. Obvious boundaries concentrate orders; those orders are liquidity the market often goes looking for.',
        'Typical signature: a wick beyond the boundary, and a close back inside. The faster and cleaner the return, the clearer the fakeout. Many range traders use it as an entry: a fakeout below the range becomes a buy signal, targeting the middle then the opposite boundary.',
        'Two protections against fakeouts: wait for the close to validate a breakout, and place your stops beyond the boundary zone rather than just behind the last visible low. A stop placed where everyone places it is a stop the market will find.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Range 1.0800–1.0900. Une bougie descend à 1.0782 puis clôture à 1.0815. Quel scénario ?',
        en: 'Range 1.0800–1.0900. A candle drops to 1.0782 then closes at 1.0815. Which scenario?',
      },
      options: {
        fr: ['Fausse sortie par le bas : biais haussier vers le milieu', 'Cassure baissière confirmée', 'Rien d’intéressant'],
        en: ['Fakeout to the downside: bullish bias towards the middle', 'Confirmed bearish breakout', 'Nothing of interest'],
      },
      correct: 0,
      rationale: {
        fr: 'Mèche sous la borne, clôture au-dessus : les vendeurs n’ont pas tenu le terrain gagné. Un achat avec stop sous 1.0782 vise 1.0850.',
        en: 'Wick below the boundary, close above it: sellers could not hold the ground they took. A buy with a stop under 1.0782 targets 1.0850.',
      },
    },
    quiz: [
      {
        q: { fr: 'Pourquoi les bornes évidentes attirent-elles les fausses sorties ?', en: 'Why do obvious boundaries attract fakeouts?' },
        options: {
          fr: ['Elles concentrent stops et ordres de cassure', 'Par hasard', 'À cause des indicateurs'],
          en: ['They concentrate stops and breakout orders', 'By chance', 'Because of indicators'],
        },
        correct: 0,
        rationale: {
          fr: 'Une accumulation d’ordres est une réserve de liquidité : de gros intervenants s’en servent pour exécuter leurs positions.',
          en: 'A cluster of orders is a pool of liquidity: large players use it to fill their positions.',
        },
      },
      {
        q: { fr: 'La signature d’une fausse sortie :', en: 'A fakeout’s signature:' },
        options: {
          fr: ['Mèche au-delà, clôture à l’intérieur', 'Clôture franche au-delà', 'Gap au-delà'],
          en: ['Wick beyond, close inside', 'Clean close beyond', 'Gap beyond'],
        },
        correct: 0,
        rationale: {
          fr: 'La clôture tranche : au-delà, c’est peut-être une cassure ; à l’intérieur, le mouvement a été rejeté.',
          en: 'The close decides: beyond, it may be a breakout; inside, the move was rejected.',
        },
      },
      {
        q: { fr: 'Où éviter de placer son stop ?', en: 'Where should you avoid placing a stop?' },
        options: {
          fr: ['Juste derrière le plus bas évident', 'Au-delà de la zone de borne', 'Selon un multiple d’ATR'],
          en: ['Just behind the obvious low', 'Beyond the boundary zone', 'At a multiple of ATR'],
        },
        correct: 0,
        rationale: {
          fr: 'C’est l’endroit où les stops s’empilent. Un peu plus loin, et dimensionné en conséquence, vaut mieux.',
          en: 'That is where stops pile up. A little further, with size adjusted to match, is better.',
        },
      },
    ],
  },

  'range-08': {
    intro: {
      fr: [
        'Le trading de range a un risque spécifique : vous vous placez toujours contre le mouvement en cours. Tant que le range tient, c’est un avantage ; le jour où il casse, c’est vous qui êtes du mauvais côté, souvent au moment où la volatilité accélère.',
        'Règles de protection : ne jamais élargir un stop, ne jamais « moyenner à la baisse » une position perdante sur une borne cédée, réduire la taille quand une annonce majeure approche, et limiter le nombre d’essais sur la même borne. Chaque test consomme une partie des ordres qui la défendent : au quatrième ou cinquième test, la borne est rarement plus solide qu’au premier.',
        'Surveillez aussi les signes d’un range qui s’épuise : des rebonds de plus en plus faibles depuis une borne, des creux qui remontent vers le haut du range (triangle), un resserrement des bandes de Bollinger. Ce ne sont pas des signaux d’entrée — ce sont des raisons de réduire la voilure.',
      ],
      en: [
        'Range trading carries a specific risk: you always position against the current move. While the range holds, that is an edge; the day it breaks, you are on the wrong side, often just as volatility picks up.',
        'Protection rules: never widen a stop, never average down a losing position on a boundary that has given way, reduce size ahead of a major release, and limit the number of attempts on the same boundary. Each test consumes part of the orders defending it: by the fourth or fifth test, a boundary is rarely stronger than on the first.',
        'Watch for signs of a tiring range too: weaker and weaker bounces off a boundary, lows rising towards the top of the range (a triangle), Bollinger Bands tightening. These are not entry signals — they are reasons to trim exposure.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Vous êtes acheteur en bas de range. Le prix clôture 20 pips sous la borne, votre stop est 10 pips plus bas. Tentation : ajouter pour « améliorer le prix moyen ». Décision ?',
        en: 'You are long at the range bottom. Price closes 20 pips below the boundary; your stop is 10 pips lower. Temptation: add to “improve the average price”. Decision?',
      },
      options: {
        fr: ['Aucun ajout : le stop reste où il est', 'Ajouter la même taille', 'Déplacer le stop 50 pips plus bas'],
        en: ['No adding: the stop stays where it is', 'Add the same size', 'Move the stop 50 pips lower'],
      },
      correct: 0,
      rationale: {
        fr: 'Une clôture sous la borne est précisément le scénario d’échec. Ajouter ou reculer le stop augmente le risque au moment où l’idée devient fausse.',
        en: 'A close below the boundary is exactly the failure scenario. Adding or moving the stop back increases risk just as the idea becomes wrong.',
      },
    },
    quiz: [
      {
        q: { fr: 'Le risque propre au trading de range :', en: 'The risk specific to range trading:' },
        options: {
          fr: ['Être contre le mouvement quand la cassure arrive', 'Manquer de trades', 'Payer trop peu de spread'],
          en: ['Being against the move when the breakout comes', 'Missing trades', 'Paying too little spread'],
        },
        correct: 0,
        rationale: {
          fr: 'Chaque trade de range parie contre l’extension du mouvement. Le stop est le seul rempart le jour où l’extension a lieu.',
          en: 'Every range trade bets against the move extending. The stop is the only defence the day it does extend.',
        },
      },
      {
        q: { fr: 'Cinquième test de la même borne :', en: 'Fifth test of the same boundary:' },
        options: {
          fr: ['Borne souvent plus fragile, prudence', 'Borne garantie', 'Signal pour tripler la taille'],
          en: ['Boundary often weaker, be careful', 'Guaranteed boundary', 'Signal to triple size'],
        },
        correct: 0,
        rationale: {
          fr: 'Les ordres qui défendaient le niveau ont été en partie consommés par les tests précédents. C’est une heuristique, pas une loi — mais elle justifie de réduire la taille.',
          en: 'The orders defending the level were partly consumed by earlier tests. It is a heuristic, not a law — but it justifies reducing size.',
        },
      },
      {
        q: { fr: 'Annonce majeure dans une heure, vous êtes en range :', en: 'Major release in an hour, you are in a range trade:' },
        options: {
          fr: ['Réduire ou clôturer selon le plan', 'Augmenter la position', 'Retirer le stop'],
          en: ['Reduce or close per the plan', 'Increase the position', 'Remove the stop'],
        },
        correct: 0,
        rationale: {
          fr: 'Les annonces cassent souvent les ranges, et les stops peuvent être exécutés avec du glissement.',
          en: 'Releases often break ranges, and stops can fill with slippage.',
        },
      },
    ],
  },

  'range-09': {
    chart: { symbol: 'FX:USDJPY', interval: 'D' },
    intro: {
      fr: [
        'Le carry trade consiste à emprunter une devise à taux bas pour détenir une devise à taux plus élevé, et à encaisser l’écart. En pratique, chez un courtier forex, cet écart apparaît sous forme de swap (ou rollover) crédité ou débité chaque nuit où la position reste ouverte — généralement triplé un jour de la semaine, souvent le mercredi, pour couvrir le week-end.',
        'Pourquoi cette leçon est dans la piste range : le carry rapporte surtout quand le marché est calme et ne bouge pas beaucoup. Le gain quotidien est petit et régulier ; le risque est rare mais brutal. Si la devise à taux élevé chute, la perte de change peut effacer des mois de swaps en quelques jours.',
        'Les dénouements de carry sont violents parce que tout le monde sort en même temps : lors de la crise de 2008, et de nouveau début août 2024 quand le yen s’est brusquement apprécié et que l’indice Nikkei a perdu plus de 12 % en une séance. Taille modeste, stop réel et surveillance du sentiment de risque sont indispensables. Les montants de swap varient selon le courtier : vérifiez-les avant tout calcul.',
      ],
      en: [
        'The carry trade means borrowing a low-rate currency to hold a higher-rate one and pocketing the difference. In practice, at a forex broker, that difference appears as a swap (or rollover) credited or debited each night the position stays open — usually tripled on one weekday, often Wednesday, to cover the weekend.',
        'Why this lesson sits in the range track: carry pays mostly when the market is calm and does not move much. The daily gain is small and steady; the risk is rare but brutal. If the high-rate currency drops, the exchange-rate loss can wipe out months of swaps in a few days.',
        'Carry unwinds are violent because everyone exits at once: in the 2008 crisis, and again in early August 2024 when the yen suddenly strengthened and the Nikkei index lost more than 12 % in a single session. Modest size, a real stop and attention to risk sentiment are essential. Swap amounts vary by broker: check them before any calculation.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Une position carry rapporte 5 $ de swap par nuit. Une baisse de 100 pips de la paire coûte 1 000 $ sur cette taille. Combien de nuits de swap efface une telle baisse ?',
        en: 'A carry position earns $5 of swap per night. A 100-pip drop in the pair costs $1,000 at this size. How many nights of swap does such a drop erase?',
      },
      options: { fr: ['200 nuits', '20 nuits', '2 nuits'], en: ['200 nights', '20 nights', '2 nights'] },
      correct: 0,
      rationale: {
        fr: '1 000 / 5 = 200 nuits, soit plus de six mois de portage. C’est toute l’asymétrie du carry : des petits gains lents, des pertes rapides.',
        en: '1,000 / 5 = 200 nights, over six months of carry. That is carry’s whole asymmetry: slow small gains, fast losses.',
      },
    },
    quiz: [
      {
        q: { fr: 'Le gain d’un carry trade vient principalement :', en: 'A carry trade’s gain comes mainly from:' },
        options: {
          fr: ['De l’écart de taux, via le swap', 'De la volatilité', 'Des commissions'],
          en: ['The rate differential, via the swap', 'Volatility', 'Commissions'],
        },
        correct: 0,
        rationale: {
          fr: 'Le carry vit d’un écart de taux encaissé jour après jour, tant que le change ne se retourne pas.',
          en: 'Carry lives off a rate gap collected day after day, as long as the exchange rate does not turn.',
        },
      },
      {
        q: { fr: 'Contexte le plus dangereux pour un carry :', en: 'Most dangerous context for carry:' },
        options: {
          fr: ['Aversion au risque soudaine (risk-off)', 'Marché calme', 'Jour férié'],
          en: ['Sudden risk aversion (risk-off)', 'Calm market', 'Public holiday'],
        },
        correct: 0,
        rationale: {
          fr: 'En risk-off, les devises de financement (yen, franc suisse) remontent et tout le monde ferme ses positions en même temps.',
          en: 'In risk-off, funding currencies (yen, Swiss franc) rise and everyone closes positions at once.',
        },
      },
      {
        q: { fr: 'Avant de calculer un carry, il faut :', en: 'Before computing a carry, you must:' },
        options: {
          fr: ['Vérifier les swaps réels de son courtier', 'Supposer les taux officiels', 'Ignorer les frais'],
          en: ['Check your broker’s actual swaps', 'Assume official rates', 'Ignore costs'],
        },
        correct: 0,
        rationale: {
          fr: 'Le courtier ajoute sa marge : le swap reçu est souvent bien inférieur à l’écart de taux théorique, et peut même être négatif.',
          en: 'The broker adds its margin: the swap received is often well below the theoretical rate gap, and can even be negative.',
        },
      },
    ],
  },

  'range-10': {
    chart: { symbol: 'FX:EURUSD', interval: '60' },
    intro: {
      fr: [
        'L’oscillateur stochastique (George Lane, années 1950) situe la clôture dans la fourchette récente. %K = (clôture − plus bas des 14 périodes) / (plus haut des 14 − plus bas des 14) × 100. %D est la moyenne sur 3 périodes de %K, qui sert de ligne de signal.',
        'Lecture : au-dessus de 80, la clôture est proche du haut de la fourchette ; sous 20, proche du bas. En range, un croisement de %K au-dessus de %D sous 20, au moment où le prix touche la borne basse, est une confirmation fréquemment utilisée pour un achat.',
        'Même avertissement que pour le RSI : en tendance, le stochastique reste collé à ses extrêmes. Il est plus réactif que le RSI, donc plus bavard : il donne plus de signaux, y compris plus de faux. Ne l’utilisez que sur les bornes d’un range déjà identifié, jamais au milieu.',
      ],
      en: [
        'The stochastic oscillator (George Lane, 1950s) locates the close within the recent range. %K = (close − lowest low of 14 periods) / (highest high of 14 − lowest low of 14) × 100. %D is the 3-period average of %K and serves as the signal line.',
        'Reading: above 80, the close is near the top of the range; below 20, near the bottom. In a range, %K crossing above %D below 20, just as price touches the lower boundary, is a commonly used confirmation for a buy.',
        'Same warning as for RSI: in a trend, the stochastic sticks to its extremes. It is more reactive than RSI, so noisier: it gives more signals, including more false ones. Only use it at the boundaries of an already identified range, never in the middle.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Plus bas 14 périodes = 1.1000, plus haut = 1.1100, clôture = 1.1080. Que vaut %K ?',
        en: '14-period low = 1.1000, high = 1.1100, close = 1.1080. What is %K?',
      },
      options: { fr: ['80', '20', '50'], en: ['80', '20', '50'] },
      correct: 0,
      rationale: {
        fr: '(1.1080 − 1.1000) / (1.1100 − 1.1000) × 100 = 0.0080 / 0.0100 × 100 = 80. La clôture est dans le cinquième supérieur de la fourchette.',
        en: '(1.1080 − 1.1000) / (1.1100 − 1.1000) × 100 = 0.0080 / 0.0100 × 100 = 80. The close is in the top fifth of the range.',
      },
    },
    quiz: [
      {
        q: { fr: 'Le stochastique mesure :', en: 'The stochastic measures:' },
        options: {
          fr: ['La position de la clôture dans la fourchette récente', 'Le volume', 'La tendance de fond'],
          en: ['Where the close sits in the recent range', 'Volume', 'The underlying trend'],
        },
        correct: 0,
        rationale: {
          fr: '0 = clôture au plus bas des 14 périodes, 100 = au plus haut.',
          en: '0 = close at the 14-period low, 100 = at the high.',
        },
      },
      {
        q: { fr: 'Comparé au RSI, le stochastique est :', en: 'Compared with RSI, the stochastic is:' },
        options: {
          fr: ['Plus réactif, donc plus de faux signaux', 'Plus lent', 'Identique'],
          en: ['More reactive, hence more false signals', 'Slower', 'Identical'],
        },
        correct: 0,
        rationale: {
          fr: 'Il réagit à chaque clôture relative à la fourchette ; le RSI lisse les hausses et baisses moyennes.',
          en: 'It reacts to every close relative to the range; RSI smooths average gains and losses.',
        },
      },
      {
        q: { fr: 'Où utiliser le stochastique ?', en: 'Where should you use the stochastic?' },
        options: {
          fr: ['Aux bornes d’un range identifié', 'Au milieu d’un range', 'Contre une tendance forte'],
          en: ['At the boundaries of an identified range', 'In the middle of a range', 'Against a strong trend'],
        },
        correct: 0,
        rationale: {
          fr: 'Le contexte d’abord, l’oscillateur ensuite. Hors des bornes, ses signaux n’ont pas de point d’appui.',
          en: 'Context first, oscillator second. Away from the boundaries, its signals have nothing to lean on.',
        },
      },
    ],
  },
};
