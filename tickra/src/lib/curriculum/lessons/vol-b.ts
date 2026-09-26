// Régimes de volatilité — leçons 6 à 10 (Pro). Server-only: paid copy,
// imported only through lesson-content.ts (see no-paid-content-in-bundle.test.ts).

import type { LessonContent } from '../lesson-content';

export const VOL_B: Record<string, LessonContent> = {
  'vol-06': {
    intro: {
      fr: [
        'Une crise de liquidité n’est pas juste un marché très volatil : c’est un marché où il devient difficile de vendre sans faire chuter le prix. Les acheteurs disparaissent du carnet d’ordres, les spreads s’écartent, et les prix sautent d’un niveau à l’autre sans s’arrêter entre les deux.',
        'Dans ces moments, presque tout est vendu en même temps : les corrélations entre actifs montent vers 1, parce que les participants vendent ce qu’ils peuvent pour obtenir du cash ou couvrir des appels de marge. En mars 2020, même l’or a baissé plusieurs séances de suite avant de repartir. Les diversifications qui semblaient solides cessent de protéger.',
        'Pour un trader particulier, les conséquences sont concrètes : les stops sont exécutés bien au-delà de leur niveau, le courtier peut relever les exigences de marge ou clôturer des positions d’office, et les gaps du week-end deviennent énormes. La seule vraie protection se prend avant : un levier modéré, une taille qui supporte un glissement important, et une part du compte qui n’est jamais engagée.',
      ],
      en: [
        'A liquidity crisis is not just a very volatile market: it is a market where selling without pushing price down becomes hard. Buyers vanish from the order book, spreads widen, and prices jump from one level to the next without stopping in between.',
        'In those moments almost everything is sold at once: correlations between assets rise towards 1, because participants sell what they can to raise cash or meet margin calls. In March 2020 even gold fell for several sessions before recovering. Diversification that looked solid stops protecting.',
        'For a retail trader the consequences are concrete: stops fill well beyond their level, the broker may raise margin requirements or close positions automatically, and weekend gaps become huge. The only real protection is taken beforehand: moderate leverage, a size that can absorb heavy slippage, and a share of the account that is never committed.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Crise de liquidité : votre stop est à 50 pips, mais le prix saute de 180 pips entre deux cotations. Quelle perte subissez-vous probablement ?',
        en: 'Liquidity crisis: your stop is 50 pips away, but price jumps 180 pips between two quotes. What loss do you probably take?',
      },
      options: {
        fr: ['Proche de 180 pips : le stop devient un ordre au marché', 'Exactement 50 pips', 'Aucune, le courtier garantit le stop'],
        en: ['Close to 180 pips: the stop becomes a market order', 'Exactly 50 pips', 'None, the broker guarantees the stop'],
      },
      correct: 0,
      rationale: {
        fr: 'Un stop classique déclenche un ordre au marché au premier prix disponible. S’il n’y a aucun prix entre 50 et 180 pips, l’exécution se fait vers 180. Seuls les stops explicitement « garantis », souvent payants, protègent de ce glissement.',
        en: 'A standard stop triggers a market order at the first available price. If there is no price between 50 and 180 pips, the fill comes near 180. Only explicitly “guaranteed” stops, often at a cost, protect against that slippage.',
      },
    },
    quiz: [
      {
        q: { fr: 'En crise de liquidité, les corrélations :', en: 'In a liquidity crisis, correlations:' },
        options: {
          fr: ['Montent vers 1 : tout baisse ensemble', 'Disparaissent', 'Deviennent négatives'],
          en: ['Rise towards 1: everything falls together', 'Disappear', 'Turn negative'],
        },
        correct: 0,
        rationale: {
          fr: 'Le besoin de cash l’emporte sur l’analyse : on vend ce qui peut se vendre.',
          en: 'The need for cash overrides analysis: people sell whatever can be sold.',
        },
      },
      {
        q: { fr: 'Un stop classique garantit :', en: 'A standard stop guarantees:' },
        options: {
          fr: ['Le déclenchement, pas le prix d’exécution', 'Le prix exact', 'L’absence de perte'],
          en: ['The trigger, not the fill price', 'The exact price', 'No loss'],
        },
        correct: 0,
        rationale: {
          fr: 'Il devient un ordre au marché. Quand la liquidité disparaît, le prix obtenu peut être très éloigné.',
          en: 'It becomes a market order. When liquidity vanishes, the price obtained can be far away.',
        },
      },
      {
        q: { fr: 'Meilleure protection contre une crise de liquidité :', en: 'Best protection against a liquidity crisis:' },
        options: {
          fr: ['Levier modéré décidé à l’avance', 'Réagir vite pendant la crise', 'Diversifier sur des actifs corrélés'],
          en: ['Moderate leverage decided in advance', 'Reacting fast during the crisis', 'Diversifying across correlated assets'],
        },
        correct: 0,
        rationale: {
          fr: 'Pendant la crise, les options se ferment. Ce qui protège a été décidé avant.',
          en: 'During the crisis, options close. What protects you was decided before.',
        },
      },
    ],
  },

  'vol-07': {
    chart: { symbol: 'FX:EURUSD', interval: 'D' },
    intro: {
      fr: [
        'Dimensionner selon la volatilité, c’est garder le risque constant quand le marché change de tempérament. La formule : taille = risque en $ / (distance du stop × valeur d’un point). Si le stop est exprimé en ATR, la taille baisse automatiquement quand la volatilité monte, et remonte quand elle baisse.',
        'Le même principe s’applique entre marchés. Si vous tradez un actif deux fois plus volatil qu’un autre, la même taille de position revient à doubler votre risque. Dimensionner en volatilité égalise l’impact de chaque trade sur votre compte, quel que soit l’actif.',
        'Attention au sens inverse : en régime très calme, la formule peut suggérer des tailles importantes. Fixez un plafond de levier indépendant de la formule. Le calme est précisément le moment où la volatilité peut revenir d’un coup, et la taille calculée hier sera trop grosse demain.',
      ],
      en: [
        'Sizing by volatility means keeping risk constant when the market changes temper. The formula: size = dollar risk / (stop distance × value per point). If the stop is expressed in ATR, size falls automatically when volatility rises and grows again when it falls.',
        'The same principle applies across markets. If you trade an asset twice as volatile as another, the same position size doubles your risk. Volatility sizing equalises each trade’s impact on your account, whatever the asset.',
        'Beware the reverse direction: in a very calm regime, the formula can suggest large sizes. Set a leverage cap independent of the formula. Calm is precisely when volatility can return all at once, and the size computed yesterday will be too big tomorrow.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Compte 20 000 $, risque 1 %. Stop à 2 ATR, ATR = 80 pips, valeur du pip = 10 $ par lot. Taille ?',
        en: '$20,000 account, 1 % risk. Stop at 2 ATR, ATR = 80 pips, pip value = $10 per lot. Size?',
      },
      options: { fr: ['0,125 lot', '1,25 lot', '0,25 lot'], en: ['0.125 lot', '1.25 lot', '0.25 lot'] },
      correct: 0,
      rationale: {
        fr: 'Risque = 200 $. Stop = 2 × 80 = 160 pips. Taille = 200 / (160 × 10) = 0,125 lot.',
        en: 'Risk = $200. Stop = 2 × 80 = 160 pips. Size = 200 / (160 × 10) = 0.125 lot.',
      },
    },
    quiz: [
      {
        q: { fr: 'Actif B deux fois plus volatil que A, même risque par trade :', en: 'Asset B twice as volatile as A, same risk per trade:' },
        options: {
          fr: ['Taille sur B divisée par deux', 'Même taille', 'Taille sur B doublée'],
          en: ['Half the size on B', 'Same size', 'Double the size on B'],
        },
        correct: 0,
        rationale: {
          fr: 'Stop deux fois plus large → taille deux fois plus petite pour la même perte potentielle.',
          en: 'Stop twice as wide → size half as big for the same potential loss.',
        },
      },
      {
        q: { fr: 'Pourquoi plafonner le levier en régime calme ?', en: 'Why cap leverage in a calm regime?' },
        options: {
          fr: ['La formule suggère alors des tailles trop grosses', 'Le calme est dangereux en soi', 'Les courtiers l’imposent toujours'],
          en: ['The formula then suggests oversized positions', 'Calm is dangerous in itself', 'Brokers always require it'],
        },
        correct: 0,
        rationale: {
          fr: 'La volatilité mesurée hier ne protège pas contre un choc demain. Le plafond couvre ce que la formule ne voit pas.',
          en: 'Volatility measured yesterday does not protect against a shock tomorrow. The cap covers what the formula cannot see.',
        },
      },
      {
        q: { fr: 'Ce que le dimensionnement en volatilité rend constant :', en: 'What volatility sizing keeps constant:' },
        options: {
          fr: ['L’impact de chaque trade sur le compte', 'Le nombre de lots', 'Le gain par trade'],
          en: ['Each trade’s impact on the account', 'The number of lots', 'The gain per trade'],
        },
        correct: 0,
        rationale: {
          fr: 'Chaque trade risque le même pourcentage : aucun marché ne domine votre courbe par accident.',
          en: 'Each trade risks the same percentage: no market dominates your equity curve by accident.',
        },
      },
    ],
  },

  'vol-08': {
    chart: { symbol: 'FX:GBPUSD', interval: '240' },
    intro: {
      fr: [
        'Un stop dynamique s’adapte à la volatilité au lieu de rester à une distance fixe. À l’entrée, on le place à un multiple d’ATR au-delà de la structure ; pendant le trade, on peut le faire suivre le prix à une distance en ATR.',
        'La règle qui ne change pas : un stop dynamique peut se rapprocher, jamais s’éloigner. Si la volatilité augmente pendant le trade, le multiple d’ATR donne une distance plus grande — mais on ne recule pas le stop pour autant. On accepte d’être sorti plus tôt, ou on réduit la position si le risque devient inconfortable.',
        'Recalculez l’ATR sur des bougies clôturées, pas sur la bougie en cours : une seule bougie violente en formation peut gonfler la mesure. Et notez dans votre journal le multiple utilisé (1,5 ? 2 ? 3 ?) : c’est un paramètre de votre plan, qui se juge sur une série de trades.',
      ],
      en: [
        'A dynamic stop adapts to volatility instead of staying at a fixed distance. At entry, you place it a multiple of ATR beyond structure; during the trade, you can have it trail price at an ATR distance.',
        'The rule that never changes: a dynamic stop may move closer, never further away. If volatility rises during the trade, the ATR multiple implies a larger distance — but you still do not move the stop back. You accept being taken out earlier, or you trim the position if the risk becomes uncomfortable.',
        'Recompute ATR on closed candles, not the one in progress: a single violent candle still forming can inflate the measure. And record the multiple you use (1.5? 2? 3?) in your journal: it is a parameter of your plan, judged over a series of trades.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Long GBP/USD, stop à 2 ATR sous le plus haut atteint. L’ATR passe de 40 à 60 pips pendant le trade. Que devient le stop ?',
        en: 'Long GBP/USD, stop at 2 ATR below the highest high. ATR rises from 40 to 60 pips during the trade. What happens to the stop?',
      },
      options: {
        fr: ['Il reste où il est : on ne l’éloigne pas', 'On le recule de 40 pips', 'On le retire'],
        en: ['It stays put: we do not move it away', 'Move it back 40 pips', 'Remove it'],
      },
      correct: 0,
      rationale: {
        fr: 'La formule donnerait 120 pips au lieu de 80, mais reculer le stop augmenterait le risque déjà engagé. Il ne remontera à nouveau que si le prix fait un nouveau plus haut.',
        en: 'The formula would give 120 pips instead of 80, but moving the stop back would increase risk already committed. It will only move up again if price makes a new high.',
      },
    },
    quiz: [
      {
        q: { fr: 'Un stop dynamique peut :', en: 'A dynamic stop may:' },
        options: {
          fr: ['Se rapprocher, jamais s’éloigner', 'S’éloigner si le marché bouge', 'Être retiré en cas de doute'],
          en: ['Move closer, never further', 'Move away if the market moves', 'Be removed when in doubt'],
        },
        correct: 0,
        rationale: {
          fr: 'C’est la règle du trailing stop appliquée à la volatilité.',
          en: 'It is the trailing-stop rule applied to volatility.',
        },
      },
      {
        q: { fr: 'Sur quelles bougies calculer l’ATR ?', en: 'Which candles should ATR be computed on?' },
        options: {
          fr: ['Des bougies clôturées', 'La bougie en cours uniquement', 'Peu importe'],
          en: ['Closed candles', 'The current candle only', 'It does not matter'],
        },
        correct: 0,
        rationale: {
          fr: 'Une bougie en formation peut exagérer la volatilité et fausser le calcul du stop.',
          en: 'A forming candle can exaggerate volatility and distort the stop calculation.',
        },
      },
      {
        q: { fr: 'Le multiple d’ATR du stop est :', en: 'The stop’s ATR multiple is:' },
        options: {
          fr: ['Un paramètre du plan, jugé sur une série', 'À changer à chaque trade', 'Toujours 1'],
          en: ['A plan parameter, judged over a series', 'Changed every trade', 'Always 1'],
        },
        correct: 0,
        rationale: {
          fr: 'Le changer au gré des trades rend impossible toute évaluation de la méthode.',
          en: 'Changing it trade by trade makes the method impossible to evaluate.',
        },
      },
    ],
  },

  'vol-09': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'La volatilité réalisée se mesure après coup, à partir des variations effectives du prix. La volatilité implicite se déduit du prix des options : c’est l’estimation du marché pour la période à venir, augmentée d’une prime pour le risque.',
        'Sur les indices actions, l’implicite est en moyenne supérieure à la réalisée : les acheteurs de protection paient une prime, un peu comme une assurance. Cet écart est appelé prime de risque de variance. Il explique pourquoi vendre de la volatilité rapporte souvent de petits montants réguliers — et pourquoi cette stratégie subit de lourdes pertes lors des chocs.',
        'Lecture utile pour le trader : quand la volatilité réalisée dépasse nettement l’implicite, le marché est surpris — les mouvements sont plus grands que ce qui était anticipé et payé. Quand l’implicite monte fortement sans que le prix ait encore beaucoup bougé, le marché achète de la protection : il redoute quelque chose.',
      ],
      en: [
        'Realised volatility is measured after the fact, from actual price changes. Implied volatility is derived from option prices: it is the market’s estimate for the period ahead, plus a premium for risk.',
        'On equity indices, implied is on average higher than realised: protection buyers pay a premium, a bit like insurance. That gap is called the variance risk premium. It explains why selling volatility often earns small, steady amounts — and why that strategy suffers heavy losses in shocks.',
        'A useful reading for traders: when realised volatility clearly exceeds implied, the market is surprised — moves are larger than what was anticipated and paid for. When implied rises sharply before price has moved much, the market is buying protection: it fears something.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Volatilité implicite du S&P 500 : 14 %. Volatilité réalisée sur 20 jours : 22 %. Lecture ?',
        en: 'S&P 500 implied volatility: 14 %. 20-day realised volatility: 22 %. Reading?',
      },
      options: {
        fr: ['Le marché est surpris par des mouvements plus larges que prévu', 'Tout est normal', 'Le marché est très calme'],
        en: ['The market is surprised by larger moves than expected', 'All normal', 'The market is very calm'],
      },
      correct: 0,
      rationale: {
        fr: 'L’inverse de la situation habituelle : la réalité dépasse l’anticipation. Ce décalage précède souvent une remontée de l’implicite.',
        en: 'The reverse of the usual situation: reality exceeds the forecast. This gap often precedes a rise in implied volatility.',
      },
    },
    quiz: [
      {
        q: { fr: 'La volatilité implicite se déduit :', en: 'Implied volatility is derived from:' },
        options: { fr: ['Du prix des options', 'Du volume des actions', 'Des moyennes mobiles'], en: ['Option prices', 'Stock volume', 'Moving averages'] },
        correct: 0,
        rationale: {
          fr: 'Plus les options sont chères, plus le marché anticipe (et craint) des mouvements importants.',
          en: 'The more expensive options are, the more the market anticipates (and fears) large moves.',
        },
      },
      {
        q: { fr: 'En moyenne, sur les indices actions :', en: 'On average, on equity indices:' },
        options: {
          fr: ['L’implicite dépasse la réalisée', 'La réalisée dépasse l’implicite', 'Elles sont toujours égales'],
          en: ['Implied exceeds realised', 'Realised exceeds implied', 'They are always equal'],
        },
        correct: 0,
        rationale: {
          fr: 'C’est la prime de risque de variance : le prix de l’assurance contre les chocs.',
          en: 'That is the variance risk premium: the price of insurance against shocks.',
        },
      },
      {
        q: { fr: 'Pourquoi vendre de la volatilité est risqué :', en: 'Why selling volatility is risky:' },
        options: {
          fr: ['Petits gains réguliers, pertes lourdes lors des chocs', 'Aucun gain possible', 'Interdit aux particuliers'],
          en: ['Small steady gains, heavy losses in shocks', 'No possible gain', 'Banned for retail'],
        },
        correct: 0,
        rationale: {
          fr: 'Même asymétrie que le carry trade : on encaisse la prime jusqu’au jour où l’assurance doit payer.',
          en: 'The same asymmetry as the carry trade: you collect the premium until the day the insurance has to pay out.',
        },
      },
    ],
  },

  'vol-10': {
    chart: { symbol: 'AMEX:SPY', interval: 'W' },
    intro: {
      fr: [
        'La volatilité se regroupe : les grandes variations sont souvent suivies de grandes variations, les périodes calmes de périodes calmes. Benoît Mandelbrot l’a observé dès les années 1960 sur les prix du coton ; c’est l’une des régularités les plus solides des marchés.',
        'Elle a aussi une forme typique : elle monte vite et redescend lentement. Un choc fait bondir la volatilité en quelques jours ; le retour au calme prend des semaines ou des mois. Et sur longue période, elle tend à revenir vers sa moyenne : un VIX à 60 ne reste pas à 60, un VIX à 11 ne reste pas à 11 indéfiniment.',
        'Conséquences pratiques : la volatilité d’hier est une bonne estimation de celle de demain, donc le dimensionnement en ATR fonctionne. Après un pic, la volatilité reste élevée un moment — ne revenez pas à pleine taille dès la première séance calme. Et après une longue accalmie, ne supposez pas qu’elle durera.',
      ],
      en: [
        'Volatility clusters: large moves are often followed by large moves, calm periods by calm periods. Benoît Mandelbrot observed it in the 1960s on cotton prices; it is one of the most robust regularities in markets.',
        'It also has a typical shape: it rises fast and falls slowly. A shock sends volatility jumping within days; the return to calm takes weeks or months. And over the long run it tends to revert towards its average: a VIX at 60 does not stay at 60, a VIX at 11 does not stay at 11 forever.',
        'Practical consequences: yesterday’s volatility is a good estimate of tomorrow’s, so ATR sizing works. After a spike, volatility stays elevated for a while — do not return to full size on the first calm session. And after a long lull, do not assume it will last.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Il y a deux semaines, l’ATR a triplé sur un choc. Depuis, trois séances calmes. Taille de position ?',
        en: 'Two weeks ago ATR tripled on a shock. Since then, three calm sessions. Position size?',
      },
      options: {
        fr: ['Remonter progressivement, en suivant l’ATR', 'Revenir immédiatement à la taille d’avant le choc', 'Tripler pour rattraper'],
        en: ['Scale back up gradually, following ATR', 'Return straight to pre-shock size', 'Triple it to catch up'],
      },
      correct: 0,
      rationale: {
        fr: 'La volatilité redescend lentement et les répliques sont fréquentes. Laisser l’ATR guider la taille évite de revenir trop tôt.',
        en: 'Volatility comes down slowly and aftershocks are common. Letting ATR guide size avoids returning too early.',
      },
    },
    quiz: [
      {
        q: { fr: 'La volatilité « se regroupe » signifie :', en: 'Volatility “clusters” means:' },
        options: {
          fr: ['Grandes variations suivies de grandes variations', 'Elle est constante', 'Elle change au hasard chaque jour'],
          en: ['Large moves followed by large moves', 'It is constant', 'It changes randomly each day'],
        },
        correct: 0,
        rationale: {
          fr: 'C’est ce qui rend la volatilité récente utile pour estimer la volatilité à venir.',
          en: 'That is what makes recent volatility useful for estimating volatility ahead.',
        },
      },
      {
        q: { fr: 'Forme typique d’un cycle de volatilité :', en: 'Typical shape of a volatility cycle:' },
        options: {
          fr: ['Montée rapide, descente lente', 'Montée lente, descente rapide', 'Symétrique'],
          en: ['Fast rise, slow decline', 'Slow rise, fast decline', 'Symmetrical'],
        },
        correct: 0,
        rationale: {
          fr: 'La peur arrive d’un coup ; la confiance revient progressivement.',
          en: 'Fear arrives all at once; confidence returns gradually.',
        },
      },
      {
        q: { fr: 'Après une longue période très calme :', en: 'After a long, very calm period:' },
        options: {
          fr: ['Ne pas supposer que le calme durera', 'Augmenter le levier au maximum', 'Supprimer les stops'],
          en: ['Do not assume calm will last', 'Max out leverage', 'Remove stops'],
        },
        correct: 0,
        rationale: {
          fr: 'Le retour vers la moyenne joue dans les deux sens : un calme extrême finit par se dissiper.',
          en: 'Reversion to the mean works both ways: extreme calm eventually fades.',
        },
      },
    ],
  },
};
