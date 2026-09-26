// Stratégies de tendance — leçons 12 à 16 (Pro). Server-only: paid copy,
// imported only through lesson-content.ts (see no-paid-content-in-bundle.test.ts).

import type { LessonContent } from '../lesson-content';

export const TREND_C: Record<string, LessonContent> = {
  'trend-12': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'L’ADX (Average Directional Index, Welles Wilder, 1978) répond à une seule question : y a-t-il une tendance, et quelle est sa force ? Il ne dit pas dans quel sens. Pour la direction, on regarde ses deux compagnons, +DI et −DI : le plus haut des deux indique le camp dominant.',
        'Repères usuels sur 14 périodes : ADX sous 20, pas de tendance exploitable ; au-dessus de 25, tendance présente ; un ADX qui monte signale une tendance qui se renforce, un ADX élevé qui se retourne à la baisse une tendance qui perd de la vigueur.',
        'Piège fréquent : un ADX qui monte dans une chute violente n’est pas « haussier ». L’ADX mesure l’intensité, dans un sens comme dans l’autre. Son meilleur usage est de filtrer le régime : n’activer une stratégie de tendance que si l’ADX dépasse votre seuil.',
      ],
      en: [
        'The ADX (Average Directional Index, Welles Wilder, 1978) answers one question: is there a trend, and how strong is it? It does not say which way. For direction you look at its two companions, +DI and −DI: the higher of the two shows the dominant side.',
        'Usual 14-period markers: ADX under 20, no exploitable trend; above 25, a trend is present; a rising ADX signals a strengthening trend, a high ADX turning down a trend losing vigour.',
        'Common trap: an ADX rising during a violent sell-off is not “bullish”. ADX measures intensity, in either direction. Its best use is filtering the regime: only switch on a trend strategy when ADX clears your threshold.',
      ],
    },
    drill: {
      prompt: {
        fr: 'ADX = 34 et en hausse, +DI = 12, −DI = 31. Lecture ?',
        en: 'ADX = 34 and rising, +DI = 12, −DI = 31. Reading?',
      },
      options: {
        fr: ['Tendance baissière qui se renforce', 'Tendance haussière forte', 'Aucune tendance'],
        en: ['A strengthening downtrend', 'A strong uptrend', 'No trend'],
      },
      correct: 0,
      rationale: {
        fr: 'ADX au-dessus de 25 et montant : tendance forte qui s’intensifie. −DI très au-dessus de +DI : ce sont les vendeurs qui dominent.',
        en: 'ADX above 25 and rising: a strong trend gaining intensity. −DI well above +DI: sellers dominate.',
      },
    },
    quiz: [
      {
        q: { fr: 'L’ADX indique :', en: 'ADX shows:' },
        options: {
          fr: ['La force de la tendance, pas sa direction', 'La direction de la tendance', 'Le volume échangé'],
          en: ['Trend strength, not direction', 'Trend direction', 'Volume traded'],
        },
        correct: 0,
        rationale: {
          fr: 'Direction : +DI contre −DI. Force : ADX.',
          en: 'Direction: +DI versus −DI. Strength: ADX.',
        },
      },
      {
        q: { fr: 'ADX à 15 depuis trois semaines :', en: 'ADX at 15 for three weeks:' },
        options: {
          fr: ['Stratégies de tendance en pause', 'Moment idéal pour suivre la tendance', 'Signal de krach imminent'],
          en: ['Trend strategies on hold', 'Ideal time to follow the trend', 'Imminent crash signal'],
        },
        correct: 0,
        rationale: {
          fr: 'Sous 20, le marché n’a pas de direction exploitable. Les stratégies de range sont mieux adaptées à ce régime.',
          en: 'Under 20, the market has no exploitable direction. Range strategies suit that regime better.',
        },
      },
      {
        q: { fr: 'ADX à 45 qui commence à baisser :', en: 'ADX at 45 starting to fall:' },
        options: {
          fr: ['La tendance perd de sa vigueur', 'La tendance s’inverse forcément', 'La tendance accélère'],
          en: ['The trend is losing vigour', 'The trend must reverse', 'The trend is accelerating'],
        },
        correct: 0,
        rationale: {
          fr: 'Moins d’intensité ne veut pas dire retournement : le marché peut simplement passer en consolidation. C’est un moment pour resserrer la gestion, pas pour parier sur l’inverse.',
          en: 'Less intensity does not mean reversal: the market may simply consolidate. It is a time to tighten management, not to bet on the opposite.',
        },
      },
    ],
  },

  'trend-13': {
    chart: { symbol: 'FX:EURUSD', interval: '240' },
    intro: {
      fr: [
        'Les bougies Heikin Ashi (« barre moyenne » en japonais) sont recalculées pour lisser le bruit. Clôture HA = (ouverture + plus haut + plus bas + clôture) / 4. Ouverture HA = (ouverture HA précédente + clôture HA précédente) / 2. Le plus haut et le plus bas HA sont les extrêmes entre les vrais extrêmes et ce corps recalculé.',
        'Résultat : en tendance, les bougies gardent la même couleur sur de longues séries. Une suite de bougies HA vertes sans ombre basse traduit une tendance haussière nette ; des corps qui rétrécissent et des ombres des deux côtés annoncent une hésitation.',
        'Limite essentielle : ces prix n’existent pas. La clôture HA n’est pas un prix auquel vous pouvez traiter. Lisez la tendance en Heikin Ashi, mais placez entrées, stops et objectifs sur les vraies bougies — sinon vos calculs de risque sont faux.',
      ],
      en: [
        'Heikin Ashi candles (“average bar” in Japanese) are recalculated to smooth noise. HA close = (open + high + low + close) / 4. HA open = (previous HA open + previous HA close) / 2. The HA high and low are the extremes among the real extremes and that recalculated body.',
        'The result: in a trend, candles keep the same colour for long runs. A string of green HA candles with no lower wick reflects a clean uptrend; shrinking bodies with wicks on both sides signal hesitation.',
        'The essential limit: these prices do not exist. The HA close is not a price you can trade at. Read the trend in Heikin Ashi, but place entries, stops and targets on the real candles — otherwise your risk maths is wrong.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Bougie réelle : O 100, H 106, L 98, C 104. Quelle est la clôture Heikin Ashi ?',
        en: 'Real candle: O 100, H 106, L 98, C 104. What is the Heikin Ashi close?',
      },
      options: { fr: ['102', '104', '106'], en: ['102', '104', '106'] },
      correct: 0,
      rationale: {
        fr: '(100 + 106 + 98 + 104) / 4 = 408 / 4 = 102. Le marché a réellement clôturé à 104 : c’est ce prix-là qui compte pour vos ordres.',
        en: '(100 + 106 + 98 + 104) / 4 = 408 / 4 = 102. The market really closed at 104: that is the price that matters for your orders.',
      },
    },
    quiz: [
      {
        q: { fr: 'Une série de bougies HA vertes sans ombre basse indique :', en: 'A run of green HA candles with no lower wick shows:' },
        options: {
          fr: ['Une tendance haussière nette', 'Un retournement imminent', 'Un marché sans direction'],
          en: ['A clean uptrend', 'An imminent reversal', 'A directionless market'],
        },
        correct: 0,
        rationale: {
          fr: 'Pas d’ombre basse = le prix n’est pas revenu sous le corps lissé : les acheteurs contrôlent.',
          en: 'No lower wick = price did not dip under the smoothed body: buyers are in control.',
        },
      },
      {
        q: { fr: 'Pourquoi ne pas placer son stop sur un prix Heikin Ashi ?', en: 'Why not place your stop on a Heikin Ashi price?' },
        options: {
          fr: ['Ce prix n’a jamais été réellement échangé', 'Les courtiers l’interdisent', 'Il est toujours trop large'],
          en: ['That price was never actually traded', 'Brokers forbid it', 'It is always too wide'],
        },
        correct: 0,
        rationale: {
          fr: 'Les valeurs HA sont des moyennes. Le risque se calcule sur les prix où vos ordres seront exécutés.',
          en: 'HA values are averages. Risk is computed on the prices where your orders will fill.',
        },
      },
      {
        q: { fr: 'Le principal avantage de Heikin Ashi :', en: 'Heikin Ashi’s main advantage:' },
        options: {
          fr: ['Lisser le bruit pour lire la tendance', 'Prédire les gaps', 'Donner des prix plus précis'],
          en: ['Smoothing noise to read the trend', 'Predicting gaps', 'Giving more precise prices'],
        },
        correct: 0,
        rationale: {
          fr: 'Il gagne en lisibilité ce qu’il perd en précision. Un outil de lecture, pas d’exécution.',
          en: 'It gains readability at the cost of precision. A reading tool, not an execution one.',
        },
      },
    ],
  },

  'trend-14': {
    chart: { symbol: 'FX:USDJPY', interval: 'D' },
    intro: {
      fr: [
        'Ichimoku Kinko Hyo (« l’équilibre d’un coup d’œil »), publié en 1969 par Goichi Hosoda, réunit tendance, momentum et supports sur un seul graphique. Cinq lignes : Tenkan-sen (milieu des 9 dernières périodes), Kijun-sen (milieu des 26), Senkou A (moyenne de Tenkan et Kijun, projetée 26 périodes en avant), Senkou B (milieu des 52, projeté 26 en avant), Chikou (la clôture, reportée 26 périodes en arrière).',
        'L’espace entre Senkou A et B forme le nuage (kumo). Lecture de base : prix au-dessus du nuage = biais haussier, en dessous = baissier, dedans = zone d’indécision. Un nuage épais est une zone de support ou de résistance plus solide qu’un nuage fin.',
        'Ichimoku est un système complet, pas un indicateur de plus : n’en prenez pas une ligne isolément. Ses réglages 9/26/52 datent d’une époque de semaines à six jours de bourse ; beaucoup les gardent par convention. Commencez par une seule règle — ne prendre que des achats au-dessus du nuage — avant d’ajouter les autres signaux.',
      ],
      en: [
        'Ichimoku Kinko Hyo (“equilibrium at a glance”), published in 1969 by Goichi Hosoda, brings trend, momentum and support onto one chart. Five lines: Tenkan-sen (midpoint of the last 9 periods), Kijun-sen (midpoint of 26), Senkou A (average of Tenkan and Kijun, projected 26 periods ahead), Senkou B (midpoint of 52, projected 26 ahead), Chikou (the close, shifted 26 periods back).',
        'The space between Senkou A and B forms the cloud (kumo). Basic reading: price above the cloud = bullish bias, below = bearish, inside = indecision. A thick cloud is sturdier support or resistance than a thin one.',
        'Ichimoku is a complete system, not one more indicator: do not take a single line on its own. Its 9/26/52 settings date from six-day trading weeks; many keep them by convention. Start with one rule — only take buys above the cloud — before adding the other signals.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Le prix est à l’intérieur d’un nuage épais. Votre plan « achats au-dessus du nuage » dit :',
        en: 'Price is inside a thick cloud. Your plan “buys above the cloud” says:',
      },
      options: {
        fr: ['Attendre : zone d’indécision', 'Acheter : le nuage va porter le prix', 'Vendre : le prix est sous le haut du nuage'],
        en: ['Wait: indecision zone', 'Buy: the cloud will carry price', 'Sell: price is under the cloud top'],
      },
      correct: 0,
      rationale: {
        fr: 'Dans le nuage, ni les acheteurs ni les vendeurs ne dominent. La règle simple protège : pas de trade tant que le prix n’en est pas sorti.',
        en: 'Inside the cloud, neither buyers nor sellers dominate. The simple rule protects: no trade until price has left it.',
      },
    },
    quiz: [
      {
        q: { fr: 'Le Kijun-sen se calcule sur :', en: 'The Kijun-sen is computed over:' },
        options: {
          fr: ['Le milieu du plus haut et du plus bas des 26 périodes', 'La moyenne des clôtures sur 9 périodes', 'Le volume sur 52 périodes'],
          en: ['The midpoint of the 26-period high and low', 'The 9-period close average', '52-period volume'],
        },
        correct: 0,
        rationale: {
          fr: 'Ichimoku utilise des milieux de fourchettes (plus haut + plus bas) / 2, pas des moyennes de clôtures.',
          en: 'Ichimoku uses range midpoints (high + low) / 2, not close averages.',
        },
      },
      {
        q: { fr: 'Prix sous le nuage :', en: 'Price below the cloud:' },
        options: { fr: ['Biais baissier', 'Biais haussier', 'Aucune information'], en: ['Bearish bias', 'Bullish bias', 'No information'] },
        correct: 0,
        rationale: {
          fr: 'Le nuage agit comme une zone d’équilibre. En dessous, les vendeurs ont l’avantage.',
          en: 'The cloud acts as an equilibrium zone. Below it, sellers have the edge.',
        },
      },
      {
        q: { fr: 'Meilleure façon de débuter avec Ichimoku :', en: 'Best way to start with Ichimoku:' },
        options: {
          fr: ['Une seule règle simple, puis ajouter', 'Utiliser les cinq signaux dès le premier jour', 'Changer les réglages à chaque trade'],
          en: ['One simple rule, then build up', 'Use all five signals from day one', 'Change settings every trade'],
        },
        correct: 0,
        rationale: {
          fr: 'Cinq lignes = beaucoup de signaux contradictoires. Une règle maîtrisée vaut mieux que cinq appliquées à moitié.',
          en: 'Five lines = many contradictory signals. One mastered rule beats five half-applied.',
        },
      },
    ],
  },

  'trend-15': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'Exercice : trois situations sur SPY en daily. Pour chacune, décidez « je prends » ou « je passe », et justifiez avec les outils de la piste — pente des moyennes, structure, ADX, emplacement du stop.',
        'Setup A : SPY au-dessus de ses moyennes 50 et 200, toutes deux montantes, ADX à 28. Le prix revient sur l’EMA 20 et imprime une englobante haussière ; le stop sous la bougie représente 1 ATR. Setup B : même contexte, mais le prix vient de monter 6 séances d’affilée et se trouve à 3 ATR au-dessus de l’EMA 20. Setup C : SPY sous une moyenne 200 descendante, ADX à 16 ; une bougie verte casse un petit plus haut.',
        'Avant de regarder la solution, écrivez votre réponse dans votre journal. L’objectif n’est pas d’avoir juste : c’est de nommer le critère qui décide. Si vous ne pouvez pas le nommer, vous n’avez pas encore de plan.',
      ],
      en: [
        'Drill: three situations on SPY, daily chart. For each, decide “take it” or “pass”, and justify with the tools of this track — slope of the averages, structure, ADX, stop placement.',
        'Setup A: SPY above its 50 and 200 averages, both rising, ADX at 28. Price returns to the EMA 20 and prints a bullish engulfing; the stop under the candle is 1 ATR. Setup B: same context, but price has just risen 6 sessions in a row and sits 3 ATR above the EMA 20. Setup C: SPY under a falling 200 average, ADX at 16; a green candle breaks a small high.',
        'Before looking at the answer, write yours in your journal. The point is not to be right: it is to name the criterion that decides. If you cannot name it, you do not have a plan yet.',
      ],
    },
    drill: {
      prompt: { fr: 'Lequel des trois setups prenez-vous ?', en: 'Which of the three setups do you take?' },
      options: { fr: ['A seulement', 'B seulement', 'A et C'], en: ['A only', 'B only', 'A and C'] },
      correct: 0,
      rationale: {
        fr: 'A réunit tout : tendance de fond montante, ADX > 25, pullback sur moyenne avec rejet, stop structurel raisonnable. B est une poursuite : entrée loin de toute invalidation, R:R médiocre. C est un achat contre une tendance baissière, sans régime de tendance (ADX 16).',
        en: 'A has it all: rising underlying trend, ADX > 25, pullback to the average with rejection, a reasonable structural stop. B is a chase: entry far from any invalidation, poor R:R. C buys against a downtrend with no trending regime (ADX 16).',
      },
    },
    quiz: [
      {
        q: { fr: 'Le défaut principal du setup B :', en: 'Setup B’s main flaw:' },
        options: {
          fr: ['Entrée loin de l’invalidation, R:R dégradé', 'La tendance est baissière', 'L’ADX est trop bas'],
          en: ['Entry far from invalidation, poor R:R', 'The trend is down', 'ADX is too low'],
        },
        correct: 0,
        rationale: {
          fr: 'Le contexte est bon, le prix d’entrée ne l’est pas. Attendre un retour vers la moyenne transformerait B en A.',
          en: 'The context is good, the entry price is not. Waiting for a return to the average would turn B into A.',
        },
      },
      {
        q: { fr: 'Pourquoi passer le setup C ?', en: 'Why pass on setup C?' },
        options: {
          fr: ['Achat contre la tendance de fond, sans régime directionnel', 'Parce que la bougie est verte', 'Parce que SPY ne se trade pas en daily'],
          en: ['Buying against the underlying trend, no directional regime', 'Because the candle is green', 'Because SPY cannot be traded daily'],
        },
        correct: 0,
        rationale: {
          fr: 'Moyenne 200 descendante + ADX sous 20 : ni le sens ni le régime ne soutiennent un achat de tendance.',
          en: 'Falling 200 average + ADX under 20: neither direction nor regime support a trend buy.',
        },
      },
      {
        q: { fr: 'L’objectif réel de cet exercice :', en: 'The real goal of this drill:' },
        options: {
          fr: ['Nommer le critère qui décide', 'Deviner la suite du prix', 'Prendre le plus de trades possible'],
          en: ['Name the deciding criterion', 'Guess what price does next', 'Take as many trades as possible'],
        },
        correct: 0,
        rationale: {
          fr: 'Un critère nommé peut être vérifié, répété et amélioré. Une intuition non nommée ne peut que se répéter — erreurs comprises.',
          en: 'A named criterion can be checked, repeated and improved. An unnamed intuition can only repeat itself — mistakes included.',
        },
      },
    ],
  },

  'trend-16': {
    intro: {
      fr: [
        'Point de contrôle tendance. Quatre acquis : lire le sens avec les moyennes, entrer sur pullback ou sur cassure confirmée, dimensionner stop et position avec l’ATR, sortir par une règle écrite (trailing stop ou cassure de structure).',
        'Et surtout une compétence en amont : identifier le régime. Une stratégie de tendance appliquée à un range perd de façon régulière, et aucun réglage d’indicateur ne corrige ça. MACD, ADX, Heikin Ashi et Ichimoku servent à confirmer ce que la structure montre déjà — jamais à la remplacer.',
        'Exercice avant de passer à la piste suivante (Stratégies de range) : reprenez vos 20 derniers trades ou trades simulés et classez-les selon le régime au moment de l’entrée. Si vos pertes se concentrent dans une seule case, vous venez de trouver la règle la plus rentable de votre plan : ne pas trader dans cette case.',
      ],
      en: [
        'Trend checkpoint. Four things to lock in: reading direction with averages, entering on a pullback or a confirmed breakout, sizing stop and position with ATR, exiting by a written rule (trailing stop or structure break).',
        'And above all one upstream skill: identifying the regime. A trend strategy applied to a range loses steadily, and no indicator setting fixes that. MACD, ADX, Heikin Ashi and Ichimoku confirm what structure already shows — they never replace it.',
        'Drill before moving to the next track (Range strategies): take your last 20 real or simulated trades and sort them by the regime at entry. If your losses cluster in one box, you have just found the most profitable rule in your plan: do not trade in that box.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Votre analyse montre que 80 % de vos pertes ont eu lieu avec un ADX sous 20. Quelle règle ajoutez-vous ?',
        en: 'Your review shows 80 % of your losses happened with ADX under 20. Which rule do you add?',
      },
      options: {
        fr: ['Pas de trade de tendance si ADX < 20', 'Doubler la taille quand ADX < 20', 'Supprimer les stops'],
        en: ['No trend trades when ADX < 20', 'Double size when ADX < 20', 'Remove stops'],
      },
      correct: 0,
      rationale: {
        fr: 'Filtrer le régime perdant est souvent plus efficace que chercher un meilleur signal d’entrée. Vérifiez ensuite sur les 20 trades suivants que la règle tient.',
        en: 'Filtering out the losing regime is often more effective than hunting a better entry signal. Then check over the next 20 trades that the rule holds.',
      },
    },
    quiz: [
      {
        q: { fr: 'Un stop en ATR sert à :', en: 'An ATR-based stop serves to:' },
        options: {
          fr: ['Adapter le stop à la volatilité du marché', 'Garantir un gain', 'Éviter tout calcul de taille'],
          en: ['Adapt the stop to market volatility', 'Guarantee a win', 'Avoid any sizing maths'],
        },
        correct: 0,
        rationale: {
          fr: 'Et il impose justement de recalculer la taille : stop plus large, position plus petite.',
          en: 'And it forces you to recompute size: wider stop, smaller position.',
        },
      },
      {
        q: { fr: 'Le rôle des indicateurs de la piste :', en: 'The role of this track’s indicators:' },
        options: {
          fr: ['Confirmer ce que la structure montre', 'Remplacer la lecture du prix', 'Prédire les retournements'],
          en: ['Confirm what structure shows', 'Replace reading price', 'Predict reversals'],
        },
        correct: 0,
        rationale: {
          fr: 'Tous sont calculés à partir du prix. Ils le résument, ils ne savent rien de plus que lui.',
          en: 'All are computed from price. They summarise it; they know nothing more than it does.',
        },
      },
      {
        q: { fr: 'Stratégie de tendance en range :', en: 'Trend strategy in a range:' },
        options: {
          fr: ['Pertes régulières : il faut filtrer le régime', 'Gains réguliers', 'Aucun effet'],
          en: ['Steady losses: filter the regime', 'Steady gains', 'No effect'],
        },
        correct: 0,
        rationale: {
          fr: 'C’est la leçon centrale de la piste. La piste suivante vous donne des outils pour ce régime-là.',
          en: 'That is the core lesson of this track. The next track gives you tools for that regime.',
        },
      },
    ],
  },
};
