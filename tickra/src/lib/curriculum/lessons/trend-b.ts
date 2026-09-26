// Stratégies de tendance — leçons 7 à 11 (Pro). Server-only: paid copy,
// imported only through lesson-content.ts (see no-paid-content-in-bundle.test.ts).

import type { LessonContent } from '../lesson-content';

export const TREND_B: Record<string, LessonContent> = {
  'trend-07': {
    chart: { symbol: 'FX:EURUSD', interval: 'D' },
    intro: {
      fr: [
        'L’ATR (Average True Range, Welles Wilder) mesure l’amplitude moyenne d’une bougie, en tenant compte des gaps. Le « true range » d’une bougie est le plus grand de : plus haut − plus bas, |plus haut − clôture précédente|, |plus bas − clôture précédente|. L’ATR 14 en fait la moyenne sur 14 bougies.',
        'Son usage le plus utile : dimensionner le stop. Un stop à 20 pips sur un marché qui bouge de 90 pips par jour se fera toucher par le simple bruit. Un stop à 1,5 ou 2 ATR du point d’entrée — au-delà de la structure — respire avec le marché.',
        'Le lien avec la taille de position est direct : un stop plus large exige une position plus petite pour garder le même risque en dollars. Stop en ATR + risque fixe en % = une taille qui s’adapte automatiquement à la volatilité.',
      ],
      en: [
        'The ATR (Average True Range, Welles Wilder) measures a candle’s average range, gaps included. A candle’s “true range” is the largest of: high − low, |high − previous close|, |low − previous close|. The 14-period ATR averages it over 14 candles.',
        'Its most useful job: sizing the stop. A 20-pip stop on a market moving 90 pips a day will be hit by noise alone. A stop at 1.5 or 2 ATR from entry — beyond structure — breathes with the market.',
        'The link to position size is direct: a wider stop requires a smaller position to keep the same dollar risk. ATR stop + fixed % risk = a size that adapts to volatility automatically.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Compte de 10 000 $, risque 1 %. ATR daily EUR/USD = 60 pips, stop à 1,5 ATR. Valeur du pip : 10 $ par lot standard. Taille ?',
        en: '$10,000 account, 1 % risk. EUR/USD daily ATR = 60 pips, stop at 1.5 ATR. Pip value: $10 per standard lot. Size?',
      },
      options: { fr: ['≈ 0,11 lot', '1 lot', '0,5 lot'], en: ['≈ 0.11 lot', '1 lot', '0.5 lot'] },
      correct: 0,
      rationale: {
        fr: 'Risque = 100 $. Stop = 1,5 × 60 = 90 pips. Taille = 100 / (90 × 10) ≈ 0,11 lot. À 1 lot, ce stop coûterait 900 $, soit 9 % du compte.',
        en: 'Risk = $100. Stop = 1.5 × 60 = 90 pips. Size = 100 / (90 × 10) ≈ 0.11 lot. At 1 lot that stop would cost $900, 9 % of the account.',
      },
    },
    quiz: [
      {
        q: { fr: 'Le « true range » inclut les gaps car :', en: 'The “true range” includes gaps because:' },
        options: {
          fr: ['Il compare aussi à la clôture précédente', 'Il utilise le volume', 'Il ignore les ouvertures'],
          en: ['It also compares to the previous close', 'It uses volume', 'It ignores opens'],
        },
        correct: 0,
        rationale: {
          fr: 'Si le marché ouvre loin de la clôture d’hier, plus haut − plus bas sous-estime le mouvement réel. Les deux autres termes le captent.',
          en: 'If the market opens far from yesterday’s close, high − low understates the real move. The other two terms capture it.',
        },
      },
      {
        q: { fr: 'L’ATR double. À risque constant, votre taille :', en: 'ATR doubles. At constant risk, your size:' },
        options: { fr: ['Est divisée par deux', 'Double', 'Ne change pas'], en: ['Halves', 'Doubles', 'Stays the same'] },
        correct: 0,
        rationale: {
          fr: 'Stop deux fois plus large → position deux fois plus petite pour la même perte en dollars.',
          en: 'Stop twice as wide → position half the size for the same dollar loss.',
        },
      },
      {
        q: { fr: 'L’ATR indique-t-il la direction du marché ?', en: 'Does ATR show market direction?' },
        options: {
          fr: ['Non, seulement l’amplitude des mouvements', 'Oui, un ATR qui monte est haussier', 'Oui, un ATR qui baisse est baissier'],
          en: ['No, only the size of moves', 'Yes, a rising ATR is bullish', 'Yes, a falling ATR is bearish'],
        },
        correct: 0,
        rationale: {
          fr: 'L’ATR monte aussi bien dans une chute que dans une envolée. C’est un thermomètre, pas une boussole.',
          en: 'ATR rises in a crash as much as in a rally. It is a thermometer, not a compass.',
        },
      },
    ],
  },

  'trend-08': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'Entrer est facile ; sortir d’une tendance est la vraie difficulté. Les tendances ne sonnent pas la fin : elles s’essoufflent. Les signes habituels : des poussées de plus en plus courtes, des pullbacks de plus en plus profonds, un prix qui passe plus de temps sous sa moyenne qu’au-dessus.',
        'Le signal structurel le plus clair est la perte du dernier creux plus haut. Tant qu’il tient, la tendance est intacte, même si le recul est pénible. Quand il casse, la séquence de creux ascendants est rompue — la raison d’être du trade a disparu.',
        'Décidez de la sortie avant d’entrer : trailing stop, cassure de structure, ou objectif mesuré. Pendant le trade, votre cerveau cherchera des raisons de rester (espoir) ou de fuir au premier recul (peur). Une règle écrite à froid vaut mieux que n’importe quelle intuition à chaud.',
      ],
      en: [
        'Entering is easy; exiting a trend is the real difficulty. Trends do not ring a bell at the end: they fade. The usual signs: shorter and shorter pushes, deeper and deeper pullbacks, price spending more time below its average than above.',
        'The clearest structural signal is losing the last higher low. As long as it holds, the trend is intact, even if the pullback hurts. When it breaks, the sequence of rising lows is broken — the trade’s reason to exist is gone.',
        'Decide the exit before you enter: trailing stop, structure break, or measured target. During the trade your brain will look for reasons to stay (hope) or to run at the first dip (fear). A rule written in cold blood beats any intuition in the heat.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Tendance haussière : creux à 90, 96, 101. Le prix recule à 99 puis rebondit. La tendance est-elle cassée ?',
        en: 'Uptrend: lows at 90, 96, 101. Price pulls back to 99 then bounces. Is the trend broken?',
      },
      options: {
        fr: ['Oui : le dernier creux plus haut (101) a été cassé', 'Non : le prix a rebondi', 'Impossible à dire sans indicateur'],
        en: ['Yes: the last higher low (101) was broken', 'No: price bounced', 'Impossible to say without an indicator'],
      },
      correct: 0,
      rationale: {
        fr: 'Passer sous 101 rompt la série de creux ascendants. Le rebond ne répare pas la structure — il peut former un sommet plus bas. Selon votre plan, c’est une sortie.',
        en: 'Going under 101 breaks the rising-lows sequence. The bounce does not repair structure — it may form a lower high. Per your plan, that is an exit.',
      },
    },
    quiz: [
      {
        q: { fr: 'Signe d’essoufflement d’une tendance :', en: 'Sign of a fading trend:' },
        options: {
          fr: ['Poussées plus courtes, replis plus profonds', 'Replis de plus en plus courts', 'Nouveaux plus hauts réguliers'],
          en: ['Shorter pushes, deeper pullbacks', 'Shorter and shorter pullbacks', 'Regular new highs'],
        },
        correct: 0,
        rationale: {
          fr: 'Le rapport de force se rééquilibre : les acheteurs avancent moins, les vendeurs reprennent plus.',
          en: 'The balance of power is evening out: buyers advance less, sellers take back more.',
        },
      },
      {
        q: { fr: 'Quand décider de sa règle de sortie ?', en: 'When should you decide your exit rule?' },
        options: {
          fr: ['Avant d’entrer', 'Quand le trade est en perte', 'Quand le trade est en gros gain'],
          en: ['Before entering', 'When the trade is losing', 'When the trade is well in profit'],
        },
        correct: 0,
        rationale: {
          fr: 'Pendant le trade, l’émotion déforme le jugement. Une règle fixée à froid protège de l’espoir comme de la peur.',
          en: 'During the trade, emotion warps judgement. A rule set in advance protects against hope and fear alike.',
        },
      },
      {
        q: { fr: 'Le prix recule mais tient au-dessus du dernier creux plus haut :', en: 'Price dips but holds above the last higher low:' },
        options: {
          fr: ['La tendance est intacte', 'Il faut sortir par précaution', 'Il faut doubler la position'],
          en: ['The trend is intact', 'Exit to be safe', 'Double the position'],
        },
        correct: 0,
        rationale: {
          fr: 'Un recul qui respecte la structure fait partie de la tendance. Sortir là, c’est laisser la peur remplacer la règle. Doubler, c’est une autre décision, qui demande son propre plan.',
          en: 'A dip that respects structure is part of the trend. Exiting there lets fear replace the rule. Doubling is a separate decision that needs its own plan.',
        },
      },
    ],
  },

  'trend-09': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'Une tendance est une direction. Un régime est un comportement : le marché est-il directionnel ou en range, calme ou nerveux ? Quatre cases — tendance calme, tendance volatile, range calme, range volatile — et aucune stratégie ne gagne dans les quatre.',
        'Les stratégies de tendance gagnent peu souvent mais gros : elles vivent de quelques longs mouvements. En range, elles enchaînent les petites pertes — entrées sur des cassures qui ne vont nulle part, sorties sur des retours au milieu. Ce n’est pas la stratégie qui est cassée : c’est le régime qui ne lui convient pas.',
        'Avant chaque trade, posez la question du régime avec des critères objectifs : pente de la moyenne 50, nombre de croisements récents du prix avec elle, ADX au-dessus ou en dessous de 20-25. Si la réponse est « range », la meilleure stratégie de tendance est de ne rien faire.',
      ],
      en: [
        'A trend is a direction. A regime is a behaviour: is the market directional or ranging, calm or nervous? Four boxes — calm trend, volatile trend, calm range, volatile range — and no strategy wins in all four.',
        'Trend strategies win rarely but big: they live off a few long moves. In a range they string together small losses — entries on breakouts that go nowhere, exits on returns to the middle. The strategy is not broken: the regime does not suit it.',
        'Before each trade, ask the regime question with objective criteria: slope of the 50 average, number of recent price crosses with it, ADX above or below 20-25. If the answer is “range”, the best trend strategy is to do nothing.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Votre stratégie de tendance a perdu 7 trades de suite. La moyenne 50 est plate et le prix l’a croisée 9 fois ce mois-ci. Que faites-vous ?',
        en: 'Your trend strategy lost 7 trades in a row. The 50 average is flat and price crossed it 9 times this month. What do you do?',
      },
      options: {
        fr: ['Je suspends la stratégie jusqu’au retour d’une tendance', 'Je change tous les paramètres', 'Je double la taille pour me refaire'],
        en: ['Pause the strategy until a trend returns', 'Change every parameter', 'Double size to win it back'],
      },
      correct: 0,
      rationale: {
        fr: 'Le diagnostic est un régime de range, pas une stratégie défaillante. Optimiser les paramètres sur ces pertes adapterait la méthode au bruit ; doubler la taille aggraverait des pertes attendues.',
        en: 'The diagnosis is a ranging regime, not a failed strategy. Tuning parameters on these losses would fit the method to noise; doubling size would magnify expected losses.',
      },
    },
    quiz: [
      {
        q: { fr: 'Un régime de marché décrit :', en: 'A market regime describes:' },
        options: {
          fr: ['Le comportement du marché (directionnel/range, calme/volatil)', 'Le prochain prix', 'Le courtier utilisé'],
          en: ['Market behaviour (directional/ranging, calm/volatile)', 'The next price', 'The broker used'],
        },
        correct: 0,
        rationale: {
          fr: 'La direction dit où va le prix ; le régime dit comment il se déplace. Les deux conditionnent le choix de stratégie.',
          en: 'Direction says where price goes; regime says how it moves. Both drive the choice of strategy.',
        },
      },
      {
        q: { fr: 'Profil typique d’une stratégie de tendance :', en: 'Typical profile of a trend strategy:' },
        options: {
          fr: ['Peu de gains, mais gros ; beaucoup de petites pertes', 'Beaucoup de petits gains réguliers', 'Aucune perte en tendance'],
          en: ['Few but large wins; many small losses', 'Many small, steady wins', 'No losses in trends'],
        },
        correct: 0,
        rationale: {
          fr: 'Taux de réussite souvent sous 50 %, compensé par des gains longs. Accepter ce profil est indispensable pour ne pas l’abandonner au mauvais moment.',
          en: 'Hit rate often under 50 %, offset by long wins. Accepting that profile is essential so you do not abandon it at the wrong time.',
        },
      },
      {
        q: { fr: 'Critère objectif de range :', en: 'Objective range criterion:' },
        options: {
          fr: ['Moyenne plate et croisements fréquents du prix', 'Une impression de calme', 'Une bougie rouge'],
          en: ['Flat average and frequent price crosses', 'A feeling of calm', 'A red candle'],
        },
        correct: 0,
        rationale: {
          fr: 'Mesurable, donc répétable. « J’ai l’impression que » ne s’écrit pas dans un plan.',
          en: 'Measurable, therefore repeatable. “I feel that” cannot be written into a plan.',
        },
      },
    ],
  },

  'trend-10': {
    intro: {
      fr: [
        'Ne pas trader est une décision, et souvent la meilleure. Chaque trade coûte : spread, commissions, attention, et un peu de votre discipline. Un trade pris sans avantage n’est pas neutre — son espérance est négative dès qu’on retire les frais.',
        'Les moments classiques pour s’abstenir : dans les minutes autour d’une annonce majeure (emploi américain, décision de banque centrale) si votre plan n’est pas conçu pour elle ; sur un marché sans structure lisible ; aux heures de faible liquidité où les spreads s’élargissent ; après avoir atteint votre limite de perte du jour.',
        'Et les moments où le problème, c’est vous : fatigue, colère après une perte, euphorie après un gain, besoin d’argent rapide. Un pilote ne décolle pas s’il n’est pas en état de voler, même si la météo est parfaite. Notez ces conditions dans votre plan, avec la même force que vos règles d’entrée.',
      ],
      en: [
        'Not trading is a decision, and often the best one. Every trade costs: spread, commissions, attention, and a little of your discipline. A trade taken without an edge is not neutral — its expectancy is negative once costs are removed.',
        'Classic moments to stand aside: the minutes around a major release (US jobs report, central-bank decision) if your plan is not built for it; a market with no readable structure; low-liquidity hours when spreads widen; after reaching your daily loss limit.',
        'And the moments when the problem is you: fatigue, anger after a loss, euphoria after a win, a need for quick money. A pilot does not take off unfit to fly, even in perfect weather. Write these conditions into your plan, with the same force as your entry rules.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Il reste 5 minutes avant la décision de taux de la Fed. Un setup parfait apparaît sur EUR/USD. Votre plan ne couvre pas les annonces.',
        en: 'Five minutes before the Fed rate decision. A perfect setup appears on EUR/USD. Your plan does not cover news releases.',
      },
      options: {
        fr: ['Je m’abstiens : ce contexte sort de mon plan', 'J’entre avec un stop serré', 'J’entre sans stop pour éviter d’être sorti par la volatilité'],
        en: ['Stand aside: this context is outside my plan', 'Enter with a tight stop', 'Enter without a stop to avoid being shaken out'],
      },
      correct: 0,
      rationale: {
        fr: 'À l’annonce, le prix peut sauter plusieurs niveaux d’un coup et les spreads s’écarter : un stop serré peut être exécuté bien plus loin que prévu. Sans stop, le risque devient illimité.',
        en: 'On the release, price can jump several levels at once and spreads widen: a tight stop may fill far beyond where it was set. Without a stop, the risk becomes unlimited.',
      },
    },
    quiz: [
      {
        q: { fr: 'Un trade sans avantage a une espérance :', en: 'A trade with no edge has an expectancy that is:' },
        options: {
          fr: ['Négative, à cause des frais', 'Nulle', 'Positive si on a de la chance'],
          en: ['Negative, because of costs', 'Zero', 'Positive if lucky'],
        },
        correct: 0,
        rationale: {
          fr: 'Sans avantage, gains et pertes s’équilibrent en moyenne — puis spread et commissions font pencher la balance du mauvais côté.',
          en: 'Without an edge, wins and losses balance on average — then spread and commissions tip it the wrong way.',
        },
      },
      {
        q: { fr: 'Pourquoi éviter les heures de faible liquidité ?', en: 'Why avoid low-liquidity hours?' },
        options: {
          fr: ['Spreads plus larges, mouvements erratiques', 'Le marché est fermé', 'Les stops y sont interdits'],
          en: ['Wider spreads, erratic moves', 'The market is closed', 'Stops are forbidden then'],
        },
        correct: 0,
        rationale: {
          fr: 'Moins de participants = carnet d’ordres plus mince. Le coût d’entrée monte et les signaux techniques deviennent moins fiables.',
          en: 'Fewer participants = thinner order book. Entry cost rises and technical signals become less reliable.',
        },
      },
      {
        q: { fr: 'Vous êtes en colère après une perte. La règle :', en: 'You are angry after a loss. The rule:' },
        options: {
          fr: ['Pause, même si un setup apparaît', 'Trader plus gros pour récupérer', 'Changer de marché'],
          en: ['Pause, even if a setup appears', 'Trade bigger to recover', 'Switch markets'],
        },
        correct: 0,
        rationale: {
          fr: 'L’état émotionnel fait partie des conditions du trade. Un bon setup exécuté en colère devient un mauvais trade.',
          en: 'Emotional state is one of the trade’s conditions. A good setup executed in anger becomes a bad trade.',
        },
      },
    ],
  },

  'trend-11': {
    chart: { symbol: 'FX:EURUSD', interval: 'D' },
    intro: {
      fr: [
        'Le MACD (Gerald Appel, fin des années 1970) mesure l’écart entre deux moyennes exponentielles : la ligne MACD = EMA 12 − EMA 26. La ligne de signal est l’EMA 9 de cette ligne, et l’histogramme montre la différence entre les deux.',
        'Lecture de base : MACD au-dessus de zéro = l’EMA 12 est au-dessus de l’EMA 26, le momentum de court terme est haussier. Le croisement MACD/signal indique une accélération ou un ralentissement ; un histogramme qui rétrécit montre que la poussée s’essouffle.',
        'Le MACD est construit sur des moyennes : il est en retard, et en range il croise sans cesse. La divergence — le prix fait un plus haut plus haut, le MACD un plus haut plus bas — signale une perte de momentum, pas un retournement programmé. Elle peut durer longtemps. Utilisez le MACD pour confirmer la force d’une tendance, pas pour la contrer.',
      ],
      en: [
        'The MACD (Gerald Appel, late 1970s) measures the gap between two exponential averages: the MACD line = EMA 12 − EMA 26. The signal line is the 9-period EMA of that line, and the histogram shows the difference between the two.',
        'Basic reading: MACD above zero = the EMA 12 is above the EMA 26, short-term momentum is bullish. The MACD/signal cross shows acceleration or deceleration; a shrinking histogram shows the push is fading.',
        'The MACD is built on averages: it lags, and in a range it crosses constantly. Divergence — price makes a higher high, MACD a lower high — signals lost momentum, not a scheduled reversal. It can persist for a long time. Use the MACD to confirm a trend’s strength, not to fight it.',
      ],
    },
    drill: {
      prompt: {
        fr: 'EMA 12 = 1.0950, EMA 26 = 1.0920. Que vaut la ligne MACD et que dit-elle ?',
        en: 'EMA 12 = 1.0950, EMA 26 = 1.0920. What is the MACD line and what does it say?',
      },
      options: {
        fr: ['+0.0030 : momentum de court terme haussier', '−0.0030 : momentum baissier', '0 : aucune information'],
        en: ['+0.0030: short-term momentum is bullish', '−0.0030: bearish momentum', '0: no information'],
      },
      correct: 0,
      rationale: {
        fr: '1.0950 − 1.0920 = +0.0030. La moyenne rapide est au-dessus de la lente : les clôtures récentes sont plus fortes que celles du mois.',
        en: '1.0950 − 1.0920 = +0.0030. The fast average is above the slow one: recent closes are stronger than the month’s.',
      },
    },
    quiz: [
      {
        q: { fr: 'La ligne de signal du MACD est :', en: 'The MACD signal line is:' },
        options: {
          fr: ['L’EMA 9 de la ligne MACD', 'La SMA 200 du prix', 'Le volume moyen'],
          en: ['The 9-period EMA of the MACD line', 'The 200 SMA of price', 'Average volume'],
        },
        correct: 0,
        rationale: {
          fr: 'Réglage classique 12/26/9. L’histogramme = MACD − signal.',
          en: 'Classic 12/26/9 setting. Histogram = MACD − signal.',
        },
      },
      {
        q: { fr: 'Une divergence baissière du MACD signifie :', en: 'A bearish MACD divergence means:' },
        options: {
          fr: ['Le momentum faiblit, sans garantie de retournement', 'Le prix va chuter demain', 'Il faut vendre immédiatement'],
          en: ['Momentum is fading, with no guaranteed reversal', 'Price will fall tomorrow', 'Sell immediately'],
        },
        correct: 0,
        rationale: {
          fr: 'Une tendance peut produire plusieurs divergences avant de se retourner. C’est une alerte, pas une entrée.',
          en: 'A trend can print several divergences before it turns. It is a warning, not an entry.',
        },
      },
      {
        q: { fr: 'Où le MACD est-il le moins fiable ?', en: 'Where is the MACD least reliable?' },
        options: {
          fr: ['En range', 'En tendance forte', 'Sur les graphiques daily'],
          en: ['In a range', 'In a strong trend', 'On daily charts'],
        },
        correct: 0,
        rationale: {
          fr: 'Moyennes plates et entrelacées → croisements répétés sans suite. Même faiblesse que le croisement 20/50.',
          en: 'Flat, braided averages → repeated crosses that go nowhere. The same weakness as the 20/50 cross.',
        },
      },
    ],
  },
};
