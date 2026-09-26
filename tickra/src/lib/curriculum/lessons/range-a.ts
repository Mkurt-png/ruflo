// Stratégies de range — leçons 1 à 5 (Pro). Server-only: paid copy,
// imported only through lesson-content.ts (see no-paid-content-in-bundle.test.ts).

import type { LessonContent } from '../lesson-content';

export const RANGE_A: Record<string, LessonContent> = {
  'range-01': {
    chart: { symbol: 'FX:EURUSD', interval: '60' },
    intro: {
      fr: [
        'Un range est une période où le prix oscille entre deux zones horizontales sans parvenir à en sortir : les acheteurs défendent le bas, les vendeurs le haut, et aucun camp ne l’emporte.',
        'Pour parler de range, il faut des preuves : au moins deux rebonds sur le bas et deux rejets sur le haut, une moyenne mobile qui s’aplatit, et des bougies qui se chevauchent au lieu de s’empiler dans un sens. Un seul aller-retour n’est pas un range — c’est peut-être juste une pause dans une tendance.',
        'Tracez des zones, pas des lignes. Le haut d’un range est rarement touché au pip près ; c’est une bande de quelques pips (ou de quelques dixièmes d’ATR) où les ventes apparaissent. Repérez aussi le milieu : c’est le premier objectif naturel d’un trade de range, et une zone où ne rien initier.',
      ],
      en: [
        'A range is a period in which price oscillates between two horizontal zones without managing to leave: buyers defend the bottom, sellers the top, and neither side wins.',
        'To call it a range you need evidence: at least two bounces off the bottom and two rejections at the top, a moving average going flat, and candles that overlap instead of stacking in one direction. A single round trip is not a range — it may just be a pause in a trend.',
        'Draw zones, not lines. The top of a range is rarely hit to the pip; it is a band a few pips wide (or a few tenths of an ATR) where selling appears. Mark the middle too: it is the first natural target of a range trade, and a zone in which to initiate nothing.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Le prix a rebondi deux fois vers 1.0800 et a été rejeté une fois vers 1.0900. Peut-on parler de range ?',
        en: 'Price bounced twice near 1.0800 and was rejected once near 1.0900. Is it a range?',
      },
      options: {
        fr: ['Pas encore : le haut n’a été testé qu’une fois', 'Oui, clairement', 'Non, c’est une tendance baissière'],
        en: ['Not yet: the top was tested only once', 'Yes, clearly', 'No, it is a downtrend'],
      },
      correct: 0,
      rationale: {
        fr: 'Deux tests en bas, un seul en haut : le plafond n’est pas encore prouvé. Un deuxième rejet vers 1.0900 confirmerait les deux bornes.',
        en: 'Two tests at the bottom, only one at the top: the ceiling is not proven yet. A second rejection near 1.0900 would confirm both boundaries.',
      },
    },
    quiz: [
      {
        q: { fr: 'Un indice objectif de range :', en: 'An objective sign of a range:' },
        options: {
          fr: ['Moyenne mobile plate, bougies qui se chevauchent', 'Une forte bougie verte', 'Un gros volume sur une seule séance'],
          en: ['Flat moving average, overlapping candles', 'One strong green candle', 'Big volume on one session'],
        },
        correct: 0,
        rationale: {
          fr: 'Chevauchement = pas de progression. Moyenne plate = pas de direction de fond.',
          en: 'Overlap = no progress. Flat average = no underlying direction.',
        },
      },
      {
        q: { fr: 'Pourquoi tracer des zones plutôt que des lignes ?', en: 'Why draw zones rather than lines?' },
        options: {
          fr: ['Les bornes sont rarement touchées au pip près', 'Pour faire plus joli', 'Parce que les lignes sont interdites'],
          en: ['Boundaries are rarely hit to the pip', 'To look nicer', 'Because lines are forbidden'],
        },
        correct: 0,
        rationale: {
          fr: 'Les ordres se répartissent autour d’un niveau, pas sur un point exact. Une zone évite de conclure trop vite à une cassure.',
          en: 'Orders spread around a level, not on one exact point. A zone avoids calling a breakout too early.',
        },
      },
      {
        q: { fr: 'Le milieu du range est :', en: 'The middle of the range is:' },
        options: {
          fr: ['Un objectif, pas une zone d’entrée', 'La meilleure zone d’entrée', 'Sans importance'],
          en: ['A target, not an entry zone', 'The best entry zone', 'Irrelevant'],
        },
        correct: 0,
        rationale: {
          fr: 'Au milieu, le stop logique est loin et l’objectif proche : le R:R est mauvais dans les deux sens.',
          en: 'In the middle, the logical stop is far and the target near: R:R is poor either way.',
        },
      },
    ],
  },

  'range-02': {
    chart: { symbol: 'FX:GBPUSD', interval: '240' },
    intro: {
      fr: [
        'Range et tendance demandent des réflexes opposés. En tendance, on achète la force et on laisse courir. En range, on vend la force près du haut, on achète la faiblesse près du bas, et on encaisse vite. Appliquer un réflexe dans le mauvais régime, c’est payer deux fois.',
        'Les marchés alternent entre ces deux états, et ils passent souvent plus de temps à consolider qu’à tendre. Les transitions sont le moment le plus dangereux : un range finit par une cassure, une tendance finit souvent par un range.',
        'Test simple sur le graphique de travail : le prix a-t-il fait un nouveau plus haut ou un nouveau plus bas significatif au cours des 20 dernières bougies ? Si non, et si la moyenne 50 est plate, traitez le marché comme un range jusqu’à preuve du contraire.',
      ],
      en: [
        'Range and trend demand opposite reflexes. In a trend, you buy strength and let it run. In a range, you sell strength near the top, buy weakness near the bottom, and take profits quickly. Applying a reflex in the wrong regime means paying twice.',
        'Markets alternate between these two states, and they often spend more time consolidating than trending. The transitions are the most dangerous moment: a range ends in a breakout, a trend often ends in a range.',
        'A simple test on your working chart: has price made a significant new high or new low in the last 20 candles? If not, and the 50 average is flat, treat the market as a range until proven otherwise.',
      ],
    },
    drill: {
      prompt: {
        fr: 'GBP/USD touche le haut d’un range établi avec une grosse bougie verte. Réflexe de range ?',
        en: 'GBP/USD hits the top of an established range with a big green candle. Range reflex?',
      },
      options: {
        fr: ['Chercher une vente si un rejet apparaît', 'Acheter la force', 'Acheter et retirer le stop'],
        en: ['Look for a sell if a rejection appears', 'Buy the strength', 'Buy and remove the stop'],
      },
      correct: 0,
      rationale: {
        fr: 'En range, la force au plafond est une opportunité de vente — à condition d’avoir la preuve du rejet. Sans rejet, on attend : c’est peut-être la cassure.',
        en: 'In a range, strength at the ceiling is a selling opportunity — provided you get proof of rejection. Without it, wait: it may be the breakout.',
      },
    },
    quiz: [
      {
        q: { fr: 'Réflexe de tendance appliqué en range :', en: 'Trend reflex applied in a range:' },
        options: {
          fr: ['Acheter en haut, vendre en bas : pertes répétées', 'Gains faciles', 'Aucun effet'],
          en: ['Buying tops, selling bottoms: repeated losses', 'Easy gains', 'No effect'],
        },
        correct: 0,
        rationale: {
          fr: 'Acheter les cassures d’un range qui tient revient à acheter chaque sommet.',
          en: 'Buying breakouts from a range that holds means buying every top.',
        },
      },
      {
        q: { fr: 'Moment le plus risqué :', en: 'Most dangerous moment:' },
        options: {
          fr: ['La transition entre régimes', 'Le milieu d’une tendance nette', 'Le week-end'],
          en: ['The transition between regimes', 'The middle of a clean trend', 'The weekend'],
        },
        correct: 0,
        rationale: {
          fr: 'Les deux familles de stratégies s’y trompent : la stratégie de range se fait emporter par la cassure, la stratégie de tendance entre trop tôt.',
          en: 'Both strategy families get it wrong there: the range strategy is swept away by the breakout, the trend strategy enters too early.',
        },
      },
      {
        q: { fr: 'Pas de nouveau plus haut ni plus bas en 20 bougies, moyenne plate :', en: 'No new high or low in 20 candles, flat average:' },
        options: {
          fr: ['Traiter comme un range', 'Traiter comme une tendance', 'Arrêter l’analyse technique'],
          en: ['Treat as a range', 'Treat as a trend', 'Stop technical analysis'],
        },
        correct: 0,
        rationale: {
          fr: 'Hypothèse par défaut, révisable à la première cassure confirmée.',
          en: 'Default assumption, revised at the first confirmed breakout.',
        },
      },
    ],
  },

  'range-03': {
    chart: { symbol: 'FX:EURUSD', interval: '60' },
    intro: {
      fr: [
        'Le mean reversion (retour à la moyenne) parie qu’un prix éloigné de son équilibre y reviendra. En range, l’équilibre est le milieu, et les bornes sont les extrêmes : on achète près du bas, on vend près du haut, avec pour cible le milieu ou la borne opposée.',
        'Construction d’un trade : entrée sur un signal de rejet dans la zone de borne ; stop au-delà de la borne, avec une marge d’environ un quart ou un demi ATR pour absorber les mèches ; premier objectif au milieu, second vers la borne opposée. Le stop est non négociable : c’est lui qui vous sort le jour où le range casse.',
        'Le profil est l’inverse de la tendance : gains fréquents mais limités, pertes plus rares mais plus nettes quand la borne cède. Tout l’enjeu est de garder les pertes égales à ce que prévoit le stop — jamais plus.',
      ],
      en: [
        'Mean reversion bets that a price far from its equilibrium will return to it. In a range, equilibrium is the middle and the boundaries are the extremes: buy near the bottom, sell near the top, targeting the middle or the opposite boundary.',
        'Building a trade: entry on a rejection signal in the boundary zone; stop beyond the boundary, with a margin of about a quarter to a half ATR to absorb wicks; first target at the middle, second near the opposite boundary. The stop is non-negotiable: it gets you out the day the range breaks.',
        'The profile is the reverse of trend following: frequent but limited wins, rarer but sharper losses when a boundary gives way. The whole point is keeping losses equal to what the stop allows — never more.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Range 1.0800–1.0900. Achat à 1.0812 sur rejet, stop à 1.0790. Quel est le R:R jusqu’au milieu ?',
        en: 'Range 1.0800–1.0900. Buy at 1.0812 on a rejection, stop at 1.0790. What is the R:R to the middle?',
      },
      options: { fr: ['≈ 1,7', '≈ 4', '≈ 0,5'], en: ['≈ 1.7', '≈ 4', '≈ 0.5'] },
      correct: 0,
      rationale: {
        fr: 'Risque : 1.0812 − 1.0790 = 22 pips. Milieu : 1.0850, soit 38 pips de gain. 38 / 22 ≈ 1,7. Jusqu’au haut (1.0895 environ) le R:R dépasserait 3,5.',
        en: 'Risk: 1.0812 − 1.0790 = 22 pips. Middle: 1.0850, a 38-pip gain. 38 / 22 ≈ 1.7. To the top (about 1.0895) R:R would exceed 3.5.',
      },
    },
    quiz: [
      {
        q: { fr: 'Où va le stop d’un achat en bas de range ?', en: 'Where does the stop go on a range-bottom buy?' },
        options: {
          fr: ['Sous la borne, avec une marge', 'Au milieu du range', 'Pas de stop, le range tiendra'],
          en: ['Below the boundary, with a margin', 'At the middle of the range', 'No stop, the range will hold'],
        },
        correct: 0,
        rationale: {
          fr: 'L’idée est « le bas tient ». Elle est fausse si le prix s’installe sous la borne. La marge évite de sortir sur une simple mèche.',
          en: 'The idea is “the bottom holds”. It is wrong if price settles below the boundary. The margin avoids exits on a mere wick.',
        },
      },
      {
        q: { fr: 'Profil de gains du mean reversion :', en: 'Mean-reversion profit profile:' },
        options: {
          fr: ['Gains fréquents et limités, pertes rares mais nettes', 'Gains rares et énormes', 'Aucune perte possible'],
          en: ['Frequent limited wins, rare but sharp losses', 'Rare huge wins', 'No possible losses'],
        },
        correct: 0,
        rationale: {
          fr: 'Un taux de réussite élevé ne vaut rien si une seule perte non coupée efface vingt gains.',
          en: 'A high hit rate is worthless if one uncut loss wipes out twenty wins.',
        },
      },
      {
        q: { fr: 'Premier objectif logique :', en: 'First logical target:' },
        options: { fr: ['Le milieu du range', 'Le double du range', 'Un nouveau plus haut historique'], en: ['The middle of the range', 'Twice the range', 'A new all-time high'] },
        correct: 0,
        rationale: {
          fr: 'C’est l’équilibre du range : le premier endroit où les deux camps se neutralisent.',
          en: 'It is the range’s equilibrium: the first place where both sides cancel out.',
        },
      },
    ],
  },

  'range-04': {
    chart: { symbol: 'FX:EURUSD', interval: '240' },
    intro: {
      fr: [
        'Le RSI (Relative Strength Index, Welles Wilder, 1978) compare la taille des hausses à celle des baisses récentes. RSI = 100 − 100 / (1 + RS), où RS est la hausse moyenne divisée par la baisse moyenne sur 14 périodes. Il oscille entre 0 et 100.',
        'Les seuils classiques sont 70 (suracheté) et 30 (survendu). En range, un RSI sous 30 quand le prix touche la borne basse renforce l’idée d’un excès vendeur : c’est une confirmation, pas un signal à lui seul.',
        'En tendance, ces mêmes seuils trompent : un RSI peut rester au-dessus de 70 pendant des semaines dans une hausse forte. « Suracheté » ne veut pas dire « va baisser » — ça veut dire « les hausses récentes dominent ». Vendre chaque RSI à 70 dans une tendance, c’est se battre contre elle.',
      ],
      en: [
        'The RSI (Relative Strength Index, Welles Wilder, 1978) compares the size of recent gains with recent losses. RSI = 100 − 100 / (1 + RS), where RS is the average gain divided by the average loss over 14 periods. It moves between 0 and 100.',
        'The classic thresholds are 70 (overbought) and 30 (oversold). In a range, an RSI under 30 as price touches the lower boundary reinforces the idea of selling excess: it is a confirmation, not a signal on its own.',
        'In a trend the same thresholds mislead: RSI can stay above 70 for weeks in a strong rally. “Overbought” does not mean “will fall” — it means “recent gains dominate”. Selling every RSI 70 in a trend is fighting it.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Sur 14 périodes, la hausse moyenne vaut 1,2 et la baisse moyenne 0,4. Quel est le RSI ?',
        en: 'Over 14 periods, the average gain is 1.2 and the average loss 0.4. What is the RSI?',
      },
      options: { fr: ['75', '30', '67'], en: ['75', '30', '67'] },
      correct: 0,
      rationale: {
        fr: 'RS = 1,2 / 0,4 = 3. RSI = 100 − 100 / (1 + 3) = 100 − 25 = 75. Au-dessus de 70 : les hausses dominent nettement.',
        en: 'RS = 1.2 / 0.4 = 3. RSI = 100 − 100 / (1 + 3) = 100 − 25 = 75. Above 70: gains clearly dominate.',
      },
    },
    quiz: [
      {
        q: { fr: 'RSI à 78 dans une tendance haussière forte :', en: 'RSI at 78 in a strong uptrend:' },
        options: {
          fr: ['Normal : ce n’est pas un signal de vente', 'Vente immédiate', 'Signal de krach'],
          en: ['Normal: not a sell signal', 'Sell immediately', 'Crash signal'],
        },
        correct: 0,
        rationale: {
          fr: 'En tendance, le RSI reste souvent en zone haute. Il mesure la domination des hausses, pas un plafond.',
          en: 'In a trend, RSI often stays in the high zone. It measures the dominance of gains, not a ceiling.',
        },
      },
      {
        q: { fr: 'Meilleur usage du RSI en range :', en: 'Best use of RSI in a range:' },
        options: {
          fr: ['Confirmer un excès sur une borne', 'Remplacer les bornes', 'Choisir la taille de position'],
          en: ['Confirm an extreme at a boundary', 'Replace the boundaries', 'Choose position size'],
        },
        correct: 0,
        rationale: {
          fr: 'Borne + RSI extrême + bougie de rejet : trois indices indépendants valent mieux qu’un seul.',
          en: 'Boundary + extreme RSI + rejection candle: three independent clues beat one.',
        },
      },
      {
        q: { fr: 'RS dans la formule du RSI :', en: 'RS in the RSI formula:' },
        options: {
          fr: ['Hausse moyenne / baisse moyenne', 'Prix / moyenne 200', 'Volume / ATR'],
          en: ['Average gain / average loss', 'Price / 200 average', 'Volume / ATR'],
        },
        correct: 0,
        rationale: {
          fr: 'Plus les hausses l’emportent sur les baisses, plus RS grandit et plus le RSI s’approche de 100.',
          en: 'The more gains outweigh losses, the larger RS and the closer RSI gets to 100.',
        },
      },
    ],
  },

  'range-05': {
    chart: { symbol: 'FX:GBPUSD', interval: '60' },
    intro: {
      fr: [
        'Les bandes de Bollinger (John Bollinger, années 1980) entourent une moyenne mobile 20 de deux bandes placées à ± 2 écarts-types. Elles s’élargissent quand la volatilité monte et se resserrent quand elle baisse : ce sont des bandes de volatilité, pas des supports fixes.',
        'La plupart du temps, le prix reste entre les bandes. En range, un contact avec la bande basse près de la borne basse, suivi d’une bougie qui réintègre la bande, est un point d’entrée classique de mean reversion, avec la moyenne 20 comme premier objectif.',
        'Deux pièges. En tendance, le prix peut « marcher sur la bande » pendant longtemps : un contact avec la bande haute n’est alors pas un excès. Et un resserrement prolongé (le « squeeze ») annonce souvent une expansion de volatilité — pas sa direction. Après un squeeze, les stratégies de range sont les plus exposées.',
      ],
      en: [
        'Bollinger Bands (John Bollinger, 1980s) surround a 20-period moving average with two bands set at ± 2 standard deviations. They widen when volatility rises and narrow when it falls: they are volatility bands, not fixed supports.',
        'Most of the time price stays between the bands. In a range, a touch of the lower band near the range bottom, followed by a candle back inside the band, is a classic mean-reversion entry, with the 20 average as the first target.',
        'Two traps. In a trend, price can “walk the band” for a long time: a touch of the upper band is then not an extreme. And a prolonged narrowing (the “squeeze”) often precedes a volatility expansion — not its direction. After a squeeze, range strategies are the most exposed.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Moyenne 20 = 1.2700, écart-type = 0.0030. Où sont les bandes à 2 écarts-types ?',
        en: '20 average = 1.2700, standard deviation = 0.0030. Where are the 2-standard-deviation bands?',
      },
      options: {
        fr: ['1.2640 et 1.2760', '1.2670 et 1.2730', '1.2600 et 1.2800'],
        en: ['1.2640 and 1.2760', '1.2670 and 1.2730', '1.2600 and 1.2800'],
      },
      correct: 0,
      rationale: {
        fr: '2 × 0.0030 = 0.0060. 1.2700 ± 0.0060 donne 1.2640 et 1.2760. À un seul écart-type, on aurait 1.2670 et 1.2730.',
        en: '2 × 0.0030 = 0.0060. 1.2700 ± 0.0060 gives 1.2640 and 1.2760. At one standard deviation it would be 1.2670 and 1.2730.',
      },
    },
    quiz: [
      {
        q: { fr: 'Les bandes s’élargissent quand :', en: 'The bands widen when:' },
        options: { fr: ['La volatilité augmente', 'Le volume baisse', 'Le prix monte forcément'], en: ['Volatility rises', 'Volume falls', 'Price necessarily rises'] },
        correct: 0,
        rationale: {
          fr: 'L’écart-type mesure la dispersion des clôtures. Plus elles s’écartent de la moyenne, plus les bandes s’éloignent.',
          en: 'Standard deviation measures how spread out closes are. The further they stray from the average, the wider the bands.',
        },
      },
      {
        q: { fr: 'Un squeeze (bandes très serrées) annonce :', en: 'A squeeze (very narrow bands) signals:' },
        options: {
          fr: ['Une expansion de volatilité probable, sans direction', 'Une hausse', 'Une baisse'],
          en: ['A likely volatility expansion, no direction', 'A rise', 'A fall'],
        },
        correct: 0,
        rationale: {
          fr: 'Le calme précède souvent le mouvement, mais le squeeze ne dit pas de quel côté.',
          en: 'Calm often precedes movement, but the squeeze does not say which way.',
        },
      },
      {
        q: { fr: 'Le prix longe la bande haute pendant 10 bougies :', en: 'Price rides the upper band for 10 candles:' },
        options: {
          fr: ['Signe de tendance, pas d’excès à vendre', 'Vente garantie', 'Bandes mal réglées'],
          en: ['A sign of trend, not an extreme to sell', 'Guaranteed sell', 'Badly tuned bands'],
        },
        correct: 0,
        rationale: {
          fr: 'La « marche sur la bande » est la signature d’une tendance forte. Le mean reversion n’a pas sa place ici.',
          en: '“Walking the band” is the signature of a strong trend. Mean reversion has no place here.',
        },
      },
    ],
  },
};
