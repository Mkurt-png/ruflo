// Régimes de volatilité — leçons 11 à 14 (Pro). Server-only: paid copy,
// imported only through lesson-content.ts (see no-paid-content-in-bundle.test.ts).

import type { LessonContent } from '../lesson-content';

export const VOL_C: Record<string, LessonContent> = {
  'vol-11': {
    chart: { symbol: 'FX:USDJPY', interval: 'D' },
    intro: {
      fr: [
        '« Risk-on » et « risk-off » décrivent l’appétit collectif pour le risque. En risk-on, les capitaux vont vers les actions, les devises liées à la croissance et aux matières premières (dollar australien, néo-zélandais), les marchés émergents. En risk-off, ils se replient vers les valeurs refuges : obligations d’État solides, yen, franc suisse, souvent le dollar américain et l’or.',
        'Les transitions sont rapides et se voient d’abord sur plusieurs marchés à la fois : actions en baisse, VIX en hausse, yen en hausse contre la plupart des devises. Un seul de ces signaux peut être un bruit ; trois en même temps décrivent un changement de régime.',
        'Pourquoi ça vous concerne même si vous ne tradez qu’une paire : en risk-off, vos positions deviennent corrélées. Être acheteur d’AUD/USD, du S&P 500 et vendeur de yen revient à prendre trois fois le même pari. Comptez votre exposition par thème, pas par nombre de positions.',
      ],
      en: [
        '“Risk-on” and “risk-off” describe collective appetite for risk. In risk-on, capital flows to equities, growth- and commodity-linked currencies (Australian and New Zealand dollars), emerging markets. In risk-off, it retreats to safe havens: strong government bonds, the yen, the Swiss franc, often the US dollar and gold.',
        'Transitions are fast and show first across several markets at once: equities down, VIX up, the yen up against most currencies. One of those signals alone may be noise; three at once describe a regime change.',
        'Why it matters even if you trade a single pair: in risk-off, your positions become correlated. Being long AUD/USD, long the S&P 500 and short the yen is taking the same bet three times. Count your exposure by theme, not by number of positions.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Vous êtes acheteur d’AUD/USD, du S&P 500 et d’AUD/JPY, 1 % de risque chacun. Quel est votre risque réel en cas de choc risk-off ?',
        en: 'You are long AUD/USD, the S&P 500 and AUD/JPY, 1 % risk each. What is your real risk in a risk-off shock?',
      },
      options: {
        fr: ['Proche de 3 % : trois fois le même pari', '1 % : les positions se compensent', '0 % : c’est diversifié'],
        en: ['Close to 3 %: the same bet three times', '1 %: the positions offset', '0 %: it is diversified'],
      },
      correct: 0,
      rationale: {
        fr: 'Les trois positions gagnent avec l’appétit pour le risque et perdent ensemble quand il disparaît. La diversification apparente cache une seule exposition.',
        en: 'All three positions win with risk appetite and lose together when it vanishes. Apparent diversification hides a single exposure.',
      },
    },
    quiz: [
      {
        q: { fr: 'Valeurs refuges classiques en risk-off :', en: 'Classic safe havens in risk-off:' },
        options: {
          fr: ['Yen, franc suisse, obligations d’État solides', 'Dollar australien, actions émergentes', 'Cryptomonnaies'],
          en: ['Yen, Swiss franc, strong government bonds', 'Australian dollar, emerging equities', 'Cryptocurrencies'],
        },
        correct: 0,
        rationale: {
          fr: 'Ces actifs tendent à monter quand l’aversion au risque s’installe, même si aucun refuge ne l’est à chaque fois.',
          en: 'These assets tend to rise when risk aversion sets in, though no haven works every single time.',
        },
      },
      {
        q: { fr: 'Comment confirmer une transition risk-off ?', en: 'How do you confirm a risk-off transition?' },
        options: {
          fr: ['Plusieurs marchés envoient le même signal', 'Une seule bougie rouge', 'Un titre de presse'],
          en: ['Several markets send the same signal', 'One red candle', 'A news headline'],
        },
        correct: 0,
        rationale: {
          fr: 'Actions, VIX et devises refuges qui bougent ensemble : c’est la confirmation croisée qui compte.',
          en: 'Equities, VIX and safe-haven currencies moving together: cross-market confirmation is what counts.',
        },
      },
      {
        q: { fr: 'Compter son exposition :', en: 'Counting your exposure:' },
        options: {
          fr: ['Par thème de risque', 'Par nombre de positions', 'Par nombre de courtiers'],
          en: ['By risk theme', 'By number of positions', 'By number of brokers'],
        },
        correct: 0,
        rationale: {
          fr: 'Cinq positions sur le même thème peuvent représenter un seul gros pari.',
          en: 'Five positions on the same theme can amount to one big bet.',
        },
      },
    ],
  },

  'vol-12': {
    intro: {
      fr: [
        'En haute volatilité, un piège revient sans cesse : le stop trop serré, touché par le bruit, suivi d’une nouvelle entrée dans le même sens, touchée à son tour. Trois ou quatre « petites » pertes plus tard, la journée coûte plus cher qu’un seul stop correctement dimensionné.',
        'La cause est un stop calibré pour un marché calme dans un marché qui ne l’est plus. Le réflexe qui aggrave les choses est de courir après le prix : rentrer plus haut que la sortie précédente, par peur de rater le mouvement qu’on avait vu juste.',
        'Deux règles simples l’évitent. Stop en ATR avec taille réduite en conséquence, pour que le bruit ne suffise pas à vous sortir. Et une limite de réentrées : au maximum une nouvelle tentative sur la même idée dans la journée. Si elle échoue aussi, l’idée est peut-être juste, mais le moment ne l’est pas.',
      ],
      en: [
        'In high volatility, one trap keeps coming back: the stop too tight, hit by noise, followed by a new entry in the same direction, hit in turn. Three or four “small” losses later, the day costs more than one properly sized stop would have.',
        'The cause is a stop calibrated for a calm market in a market that no longer is. The reflex that makes it worse is chasing price: re-entering above the previous exit, for fear of missing the move you called correctly.',
        'Two simple rules prevent it. An ATR-based stop with size reduced to match, so noise alone cannot take you out. And a re-entry limit: at most one new attempt on the same idea in a day. If that fails too, the idea may be right, but the timing is not.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Trois stops de 20 pips touchés sur la même idée, à 0,5 % chacun. Un stop de 60 pips à taille réduite aurait risqué 0,5 %. Combien vous a coûté la répétition ?',
        en: 'Three 20-pip stops hit on the same idea, 0.5 % each. A 60-pip stop at reduced size would have risked 0.5 %. What did the repetition cost?',
      },
      options: {
        fr: ['1,5 % au lieu de 0,5 % au maximum', '0,5 %, comme prévu', 'Rien, les stops étaient petits'],
        en: ['1.5 % instead of 0.5 % at most', '0.5 %, as planned', 'Nothing, the stops were small'],
      },
      correct: 0,
      rationale: {
        fr: 'Trois petites pertes font une grosse perte. Le stop adapté à la volatilité, avec une taille réduite, plafonnait le risque de l’idée à 0,5 %.',
        en: 'Three small losses make one large loss. The volatility-adjusted stop with reduced size capped the idea’s risk at 0.5 %.',
      },
    },
    quiz: [
      {
        q: { fr: 'Cause principale des stops touchés en série :', en: 'Main cause of stops hit in series:' },
        options: {
          fr: ['Stop calibré pour un marché calme', 'Mauvais courtier', 'Manque d’indicateurs'],
          en: ['Stop calibrated for a calm market', 'Bad broker', 'Lack of indicators'],
        },
        correct: 0,
        rationale: {
          fr: 'Le bruit d’un marché nerveux dépasse la distance d’un stop pensé pour un marché calme.',
          en: 'A nervous market’s noise exceeds the distance of a stop designed for a calm one.',
        },
      },
      {
        q: { fr: 'Limite de réentrées recommandée :', en: 'Recommended re-entry limit:' },
        options: {
          fr: ['Une seule nouvelle tentative par idée et par jour', 'Aucune limite', 'Dix par jour'],
          en: ['One new attempt per idea per day', 'No limit', 'Ten a day'],
        },
        correct: 0,
        rationale: {
          fr: 'Au-delà, on ne trade plus un plan, on poursuit un prix.',
          en: 'Beyond that, you are no longer trading a plan, you are chasing a price.',
        },
      },
      {
        q: { fr: 'Rentrer plus haut que sa sortie par peur de rater le mouvement :', en: 'Re-entering above your exit for fear of missing the move:' },
        options: {
          fr: ['C’est courir après le prix', 'C’est une bonne gestion', 'C’est obligatoire en tendance'],
          en: ['It is chasing price', 'It is good management', 'It is mandatory in a trend'],
        },
        correct: 0,
        rationale: {
          fr: 'L’entrée se dégrade à chaque tentative, et le risque cumulé grandit sans que le plan l’ait prévu.',
          en: 'The entry worsens with each attempt, and cumulative risk grows without the plan having allowed for it.',
        },
      },
    ],
  },

  'vol-13': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'Exercice : classer 10 séances selon leur régime. Pour chaque séance, on compare l’amplitude du jour (plus haut − plus bas) à l’ATR 20 : sous 0,7 ATR, séance calme ; entre 0,7 et 1,3, normale ; au-dessus de 1,3, nerveuse.',
        'Les 10 ratios, dans l’ordre : 0,5 — 0,6 — 1,0 — 1,1 — 1,8 — 2,4 — 0,9 — 1,5 — 0,4 — 1,2. Classez chacun, comptez les séances de chaque catégorie, puis regardez la séquence : les séances nerveuses sont-elles isolées ou regroupées ?',
        'Refaites ensuite l’exercice sur les 10 dernières séances réelles du marché que vous tradez. Vous saurez en deux minutes dans quel régime vous êtes — et donc quelle taille, quels stops et quelles stratégies ont du sens aujourd’hui.',
      ],
      en: [
        'Drill: classify 10 sessions by regime. For each session, compare the day’s range (high − low) with the 20-period ATR: below 0.7 ATR, calm; between 0.7 and 1.3, normal; above 1.3, nervous.',
        'The 10 ratios, in order: 0.5 — 0.6 — 1.0 — 1.1 — 1.8 — 2.4 — 0.9 — 1.5 — 0.4 — 1.2. Classify each one, count the sessions in each category, then look at the sequence: are the nervous sessions isolated or clustered?',
        'Then repeat the drill on the last 10 real sessions of the market you trade. In two minutes you will know which regime you are in — and so which size, which stops and which strategies make sense today.',
      ],
    },
    drill: {
      prompt: { fr: 'Combien de séances nerveuses (ratio > 1,3) ?', en: 'How many nervous sessions (ratio > 1.3)?' },
      options: { fr: ['3', '2', '5'], en: ['3', '2', '5'] },
      correct: 0,
      rationale: {
        fr: '1,8, 2,4 et 1,5 : trois séances. Les deux premières sont consécutives — la volatilité se regroupe, comme vu dans la leçon sur les cycles.',
        en: '1.8, 2.4 and 1.5: three sessions. The first two are back to back — volatility clusters, as seen in the cycles lesson.',
      },
    },
    quiz: [
      {
        q: { fr: 'Combien de séances calmes (ratio < 0,7) ?', en: 'How many calm sessions (ratio < 0.7)?' },
        options: { fr: ['3', '4', '1'], en: ['3', '4', '1'] },
        correct: 0,
        rationale: { fr: '0,5, 0,6 et 0,4.', en: '0.5, 0.6 and 0.4.' },
      },
      {
        q: { fr: 'Combien de séances normales (0,7 à 1,3) ?', en: 'How many normal sessions (0.7 to 1.3)?' },
        options: { fr: ['4', '3', '6'], en: ['4', '3', '6'] },
        correct: 0,
        rationale: { fr: '1,0, 1,1, 0,9 et 1,2. Total : 3 + 4 + 3 = 10.', en: '1.0, 1.1, 0.9 and 1.2. Total: 3 + 4 + 3 = 10.' },
      },
      {
        q: { fr: 'Après les séances à 1,8 et 2,4, la meilleure attitude :', en: 'After the 1.8 and 2.4 sessions, the best stance:' },
        options: {
          fr: ['Taille réduite, stops en ATR, sélectivité', 'Taille maximale', 'Stratégie de range agressive'],
          en: ['Reduced size, ATR stops, selectivity', 'Maximum size', 'Aggressive range strategy'],
        },
        correct: 0,
        rationale: {
          fr: 'Deux séances nerveuses consécutives signalent un régime qui a changé ; les ajustements du régime nerveux s’appliquent.',
          en: 'Two consecutive nervous sessions signal a changed regime; the nervous-regime adjustments apply.',
        },
      },
    ],
  },

  'vol-14': {
    intro: {
      fr: [
        'Point de contrôle volatilité. Quatre acquis : mesurer (ATR, volatilité historique, VIX), situer (ratio de l’ATR à sa propre moyenne), adapter (stop en ATR et taille inversement proportionnelle), anticiper (la volatilité se regroupe, monte vite, redescend lentement).',
        'Retenez aussi les deux dangers extrêmes : le calme prolongé, qui pousse à augmenter le levier au pire moment, et la crise de liquidité, où les stops glissent et où tous les actifs baissent ensemble. Dans les deux cas, la protection se décide avant, jamais pendant.',
        'Vous avez maintenant les trois outils des pistes avancées : lire la tendance, exploiter le range, et reconnaître le régime qui dit lequel utiliser. La suite du parcours (Psychologie & journal, puis Marchés réels) porte sur la partie la plus difficile : appliquer tout ça avec de l’argent réel, sans vous saboter vous-même.',
      ],
      en: [
        'Volatility checkpoint. Four things to lock in: measure (ATR, historical volatility, VIX), place (ATR ratio to its own average), adapt (ATR stop and size inversely proportional), anticipate (volatility clusters, rises fast, falls slowly).',
        'Remember the two extreme dangers too: prolonged calm, which pushes you to raise leverage at the worst moment, and the liquidity crisis, where stops slip and every asset falls together. In both cases, protection is decided before, never during.',
        'You now hold the three tools of the advanced tracks: reading the trend, exploiting the range, and recognising the regime that tells you which to use. The rest of the programme (Psychology & journal, then Live markets) covers the hardest part: applying all of it with real money, without sabotaging yourself.',
      ],
    },
    drill: {
      prompt: {
        fr: 'L’ATR est à 1,6 fois sa moyenne et le VIX à 31. Votre stratégie principale est le range. Décision ?',
        en: 'ATR is 1.6 times its average and VIX is 31. Your main strategy is range trading. Decision?',
      },
      options: {
        fr: ['Réduire fortement ou suspendre le range', 'Trader normalement', 'Doubler la taille'],
        en: ['Sharply reduce or pause range trading', 'Trade normally', 'Double size'],
      },
      correct: 0,
      rationale: {
        fr: 'Régime nerveux sur deux mesures indépendantes : le range y est la stratégie la plus exposée.',
        en: 'Nervous regime on two independent measures: range trading is the most exposed strategy there.',
      },
    },
    quiz: [
      {
        q: { fr: 'Quand la volatilité double, la taille :', en: 'When volatility doubles, size:' },
        options: { fr: ['Est divisée par deux', 'Double', 'Reste identique'], en: ['Halves', 'Doubles', 'Stays the same'] },
        correct: 0,
        rationale: {
          fr: 'Stop en ATR deux fois plus large, taille deux fois plus petite : même risque en %.',
          en: 'ATR stop twice as wide, size half as big: same % risk.',
        },
      },
      {
        q: { fr: 'Le VIX mesure une volatilité :', en: 'The VIX measures a volatility that is:' },
        options: { fr: ['Implicite, tournée vers l’avenir', 'Réalisée, passée', 'Du Nasdaq uniquement'], en: ['Implied, forward-looking', 'Realised, past', 'Nasdaq only'] },
        correct: 0,
        rationale: {
          fr: 'Il se déduit du prix des options sur le S&P 500 à 30 jours.',
          en: 'It is derived from 30-day S&P 500 option prices.',
        },
      },
      {
        q: { fr: 'Protection contre une crise de liquidité :', en: 'Protection against a liquidity crisis:' },
        options: {
          fr: ['Levier modéré décidé avant', 'Réaction rapide pendant', 'Stops plus serrés'],
          en: ['Moderate leverage decided beforehand', 'Fast reaction during', 'Tighter stops'],
        },
        correct: 0,
        rationale: {
          fr: 'Quand la liquidité disparaît, un stop serré glisse autant qu’un stop large. Seule l’exposition choisie avant compte.',
          en: 'When liquidity vanishes, a tight stop slips as much as a wide one. Only the exposure chosen beforehand counts.',
        },
      },
    ],
  },
};
