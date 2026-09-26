// Stratégies de tendance — leçons 1 à 6 (Pro). Server-only: paid copy,
// imported only through lesson-content.ts (see no-paid-content-in-bundle.test.ts).

import type { LessonContent } from '../lesson-content';

export const TREND_A: Record<string, LessonContent> = {
  'trend-01': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'Une moyenne mobile lisse le prix : c’est la moyenne des N dernières clôtures, recalculée à chaque bougie. La simple (SMA) donne le même poids à chaque clôture ; l’exponentielle (EMA) pondère davantage les plus récentes et réagit donc plus vite.',
        'Elle ne prédit rien. Elle résume. Une moyenne qui monte dit que les clôtures récentes sont plus hautes que les anciennes — c’est la définition d’une tendance haussière, rien de plus. Son vrai rôle est de répondre à une question : « dans quel sens le vent souffle-t-il ? »',
        'Le choix de N fixe l’horizon. La 20 suit le mouvement de quelques semaines en daily, la 50 le trimestre, la 200 l’année. Plus N est grand, moins la moyenne se laisse tromper par le bruit — et plus elle arrive en retard. Ce retard n’est pas un défaut à corriger : c’est le prix de la stabilité.',
      ],
      en: [
        'A moving average smooths price: it is the mean of the last N closes, recalculated on every candle. The simple one (SMA) weights every close equally; the exponential one (EMA) weights recent closes more and so reacts faster.',
        'It predicts nothing. It summarises. A rising average says recent closes are higher than older ones — that is the definition of an uptrend, nothing more. Its real job is to answer one question: “which way is the wind blowing?”',
        'The choice of N sets the horizon. The 20 follows a few weeks of movement on the daily, the 50 a quarter, the 200 a year. The larger N, the less the average is fooled by noise — and the later it arrives. That lag is not a flaw to fix: it is the price of stability.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Les 5 dernières clôtures sont 100, 102, 101, 104, 108. Quelle est la SMA 5 ?',
        en: 'The last 5 closes are 100, 102, 101, 104, 108. What is the 5-period SMA?',
      },
      options: { fr: ['103', '104', '108'], en: ['103', '104', '108'] },
      correct: 0,
      rationale: {
        fr: '(100 + 102 + 101 + 104 + 108) / 5 = 515 / 5 = 103. Le dernier prix, 108, est au-dessus : le marché est plus haut que sa moyenne récente.',
        en: '(100 + 102 + 101 + 104 + 108) / 5 = 515 / 5 = 103. The last price, 108, is above it: the market sits higher than its recent average.',
      },
    },
    quiz: [
      {
        q: { fr: 'Quelle différence entre SMA et EMA ?', en: 'What separates an SMA from an EMA?' },
        options: {
          fr: ['L’EMA pondère davantage les clôtures récentes', 'La SMA utilise les plus hauts et plus bas', 'L’EMA prédit le prochain prix'],
          en: ['The EMA weights recent closes more', 'The SMA uses highs and lows', 'The EMA predicts the next price'],
        },
        correct: 0,
        rationale: {
          fr: 'Les deux utilisent les clôtures. L’EMA donne plus de poids aux dernières, donc réagit plus vite — et se fait aussi piéger plus souvent.',
          en: 'Both use closes. The EMA gives more weight to the latest ones, so it reacts faster — and gets fooled more often too.',
        },
      },
      {
        q: { fr: 'Une moyenne mobile 200 en daily décrit plutôt :', en: 'A 200-period daily moving average describes:' },
        options: {
          fr: ['La tendance de fond sur environ un an', 'Le mouvement de la journée', 'Le prochain retournement'],
          en: ['The underlying trend over about a year', 'Today’s move', 'The next reversal'],
        },
        correct: 0,
        rationale: {
          fr: '200 séances de bourse ≈ une année. C’est un filtre de contexte, pas un signal d’entrée.',
          en: '200 trading sessions ≈ one year. It is a context filter, not an entry signal.',
        },
      },
      {
        q: { fr: 'Pourquoi une moyenne longue est-elle « en retard » ?', en: 'Why is a long average “late”?' },
        options: {
          fr: ['Elle moyenne beaucoup de clôtures anciennes', 'Elle est mal calculée', 'Elle ignore la clôture du jour'],
          en: ['It averages many old closes', 'It is miscalculated', 'It ignores today’s close'],
        },
        correct: 0,
        rationale: {
          fr: 'Chaque nouvelle clôture ne pèse que 1/N. Plus N est grand, plus il faut de bougies pour faire tourner la moyenne : moins de bruit, plus de retard.',
          en: 'Each new close weighs only 1/N. The larger N, the more candles it takes to turn the average: less noise, more lag.',
        },
      },
    ],
  },

  'trend-02': {
    chart: { symbol: 'FX:EURUSD', interval: '240' },
    intro: {
      fr: [
        'Le pullback est l’entrée la plus classique en tendance : au lieu d’acheter après une forte hausse, on attend que le prix revienne vers sa moyenne, puis on entre quand il repart dans le sens de la tendance.',
        'La moyenne ne sert pas de mur magique. Elle marque une zone où, dans une tendance saine, les acheteurs ont l’habitude de revenir. On attend donc une preuve : une bougie de rejet (longue ombre basse, englobante haussière) sur ou près de la moyenne, pas simplement le contact.',
        'Trois conditions avant d’entrer : la moyenne elle-même monte (sinon ce n’est pas une tendance), le pullback se fait sur un volume ou une amplitude plus faibles que la poussée précédente, et le stop se place sous le plus bas du pullback — là où l’idée devient fausse.',
      ],
      en: [
        'The pullback is the classic trend entry: instead of buying after a strong rally, you wait for price to come back towards its average, then enter when it turns back in the direction of the trend.',
        'The average is not a magic wall. It marks a zone where, in a healthy trend, buyers tend to return. So you wait for proof: a rejection candle (long lower wick, bullish engulfing) on or near the average, not merely the touch.',
        'Three conditions before entering: the average itself is rising (otherwise it is not a trend), the pullback comes on lower volume or range than the prior push, and the stop goes under the pullback low — where the idea becomes wrong.',
      ],
    },
    drill: {
      prompt: {
        fr: 'EUR/USD en tendance haussière, EMA 20 montante. Le prix revient sur l’EMA et imprime une longue ombre basse qui clôture au-dessus. Où va le stop ?',
        en: 'EUR/USD in an uptrend, EMA 20 rising. Price returns to the EMA and prints a long lower wick that closes above it. Where does the stop go?',
      },
      options: {
        fr: ['Sous le plus bas de l’ombre', 'Au niveau de l’EMA 20', 'À 10 pips sous l’entrée, par principe'],
        en: ['Below the wick’s low', 'At the EMA 20 level', '10 pips under entry, as a rule'],
      },
      correct: 0,
      rationale: {
        fr: 'Le plus bas de l’ombre est le point que le marché a refusé. S’il est cassé, le rejet a échoué et le pullback devient autre chose. Un stop à distance fixe ignore la structure.',
        en: 'The wick’s low is the point the market refused. If it breaks, the rejection failed and the pullback is becoming something else. A fixed-distance stop ignores structure.',
      },
    },
    quiz: [
      {
        q: { fr: 'Pourquoi attendre un pullback plutôt qu’acheter la cassure ?', en: 'Why wait for a pullback rather than buy the breakout?' },
        options: {
          fr: ['Stop plus proche, meilleur ratio risque/gain', 'Le pullback garantit la hausse', 'Pour trader plus souvent'],
          en: ['Closer stop, better risk/reward', 'The pullback guarantees the rise', 'To trade more often'],
        },
        correct: 0,
        rationale: {
          fr: 'Entrer près de la zone d’invalidation raccourcit le stop, donc améliore le R:R. Rien n’est garanti — certains pullbacks deviennent des retournements.',
          en: 'Entering near the invalidation zone shortens the stop, which improves R:R. Nothing is guaranteed — some pullbacks become reversals.',
        },
      },
      {
        q: { fr: 'Le prix touche une EMA qui descend. C’est :', en: 'Price touches a falling EMA. That is:' },
        options: {
          fr: ['Pas un pullback haussier : la tendance n’est pas haussière', 'Un achat idéal', 'Un signal neutre sans importance'],
          en: ['Not a bullish pullback: the trend is not up', 'An ideal buy', 'A neutral, irrelevant signal'],
        },
        correct: 0,
        rationale: {
          fr: 'La pente de la moyenne est la condition n°1. Acheter un contact sur une moyenne descendante, c’est acheter contre le vent.',
          en: 'The average’s slope is condition #1. Buying a touch on a falling average is buying into the wind.',
        },
      },
      {
        q: { fr: 'Quel pullback est le plus sain ?', en: 'Which pullback is healthiest?' },
        options: {
          fr: ['Lent, sur amplitude faible, après une poussée forte', 'Aussi violent que la poussée précédente', 'Qui casse le dernier creux'],
          en: ['Slow, on small range, after a strong push', 'As violent as the prior push', 'One that breaks the last low'],
        },
        correct: 0,
        rationale: {
          fr: 'Un repli mou montre que les vendeurs manquent de conviction. Un repli aussi fort que la hausse, ou qui casse le creux, change la structure.',
          en: 'A soft pullback shows sellers lack conviction. One as strong as the rally, or one that breaks the low, changes the structure.',
        },
      },
    ],
  },

  'trend-03': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'Le croisement de moyennes est le signal de tendance le plus connu : quand une moyenne courte (20) passe au-dessus d’une longue (50), le momentum récent dépasse celui du trimestre. On parle de « golden cross » pour le croisement 50/200 à la hausse, de « death cross » à la baisse.',
        'Sa force est sa simplicité : il est objectif, sans interprétation. Sa faiblesse est son retard : quand la 20 croise la 50, une bonne partie du mouvement a souvent déjà eu lieu. Et dans un marché sans direction, les deux moyennes s’entrelacent et produisent croisement sur croisement — chacun une petite perte.',
        'Utilisez-le comme un filtre, pas comme une gâchette. « 20 au-dessus de 50 » dit : je ne cherche que des achats. L’entrée elle-même se fait ensuite sur un pullback ou une cassure, avec un stop structurel.',
      ],
      en: [
        'The moving-average cross is the best-known trend signal: when a short average (20) moves above a long one (50), recent momentum exceeds the quarter’s. The 50/200 cross upwards is called a “golden cross”, downwards a “death cross”.',
        'Its strength is simplicity: it is objective, with no interpretation. Its weakness is lag: by the time the 20 crosses the 50, much of the move has often happened. And in a directionless market the two averages braid together and throw cross after cross — each one a small loss.',
        'Use it as a filter, not a trigger. “20 above 50” says: I only look for buys. The entry itself then comes on a pullback or a breakout, with a structural stop.',
      ],
    },
    drill: {
      prompt: {
        fr: 'En 3 mois, la 20 et la 50 se sont croisées 6 fois sur un actif. Que dit cette fréquence ?',
        en: 'Over 3 months, the 20 and 50 crossed 6 times on an asset. What does that frequency say?',
      },
      options: {
        fr: ['Le marché est en range : les croisements ne valent rien ici', 'La tendance est très forte', 'Il faut réduire à une 5/10 pour réagir plus vite'],
        en: ['The market is ranging: crosses are worthless here', 'The trend is very strong', 'Switch to a 5/10 to react faster'],
      },
      correct: 0,
      rationale: {
        fr: 'Une tendance produit peu de croisements. Des croisements répétés signalent des moyennes plates et entrelacées : un range. Raccourcir les moyennes produirait encore plus de faux signaux.',
        en: 'A trend produces few crosses. Repeated crosses mean flat, braided averages: a range. Shortening the averages would only produce more false signals.',
      },
    },
    quiz: [
      {
        q: { fr: 'Le principal défaut du croisement de moyennes :', en: 'The main flaw of the moving-average cross:' },
        options: {
          fr: ['Il arrive en retard et se fait piéger en range', 'Il est subjectif', 'Il ne fonctionne qu’en forex'],
          en: ['It is late and gets trapped in ranges', 'It is subjective', 'It only works in forex'],
        },
        correct: 0,
        rationale: {
          fr: 'Il est parfaitement objectif — c’est sa qualité. Mais il est construit sur des moyennes, donc toujours après le mouvement, et il multiplie les faux signaux sans tendance.',
          en: 'It is perfectly objective — that is its virtue. But it is built on averages, so always after the move, and it multiplies false signals without a trend.',
        },
      },
      {
        q: { fr: 'Le « golden cross » désigne :', en: 'The “golden cross” is:' },
        options: {
          fr: ['La 50 qui passe au-dessus de la 200', 'La 20 qui passe sous la 50', 'Le prix qui touche la 200'],
          en: ['The 50 crossing above the 200', 'The 20 crossing below the 50', 'Price touching the 200'],
        },
        correct: 0,
        rationale: {
          fr: 'Golden cross : 50 au-dessus de 200. Death cross : l’inverse. Ce sont des marqueurs de régime de long terme, très médiatisés, et tardifs.',
          en: 'Golden cross: 50 over 200. Death cross: the reverse. They are long-term regime markers, heavily publicised, and late.',
        },
      },
      {
        q: { fr: 'Meilleur usage d’un croisement 20/50 :', en: 'Best use of a 20/50 cross:' },
        options: {
          fr: ['Filtrer le sens des trades', 'Entrer à la clôture du croisement, toujours', 'Placer le stop sur la 50'],
          en: ['Filter trade direction', 'Always enter at the cross close', 'Put the stop on the 50'],
        },
        correct: 0,
        rationale: {
          fr: 'Le croisement fixe le camp (acheteur ou vendeur). L’entrée et le stop se décident sur la structure du prix.',
          en: 'The cross picks the side (buyer or seller). Entry and stop are decided on price structure.',
        },
      },
    ],
  },

  'trend-04': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'Une tendance haussière progresse par paliers : le prix bute sur une résistance, consolide, puis la franchit. La cassure de résistance est l’entrée qui cherche à attraper le début de la jambe suivante.',
        'Une cassure crédible a trois signes : une clôture nette au-dessus du niveau (pas seulement une mèche), une amplitude de bougie supérieure à la moyenne, et idéalement un volume en hausse. Une consolidation longue et serrée avant la cassure renforce le signal : plus l’énergie a été comprimée, plus la sortie a de chances de porter.',
        'Le risque principal est la fausse cassure : le prix passe le niveau, attire les acheteurs tardifs, puis retombe dans la zone. D’où deux règles : entrer sur clôture plutôt qu’en intrabar, et placer le stop sous le milieu ou le bas de la consolidation, pas juste sous la résistance cassée.',
      ],
      en: [
        'An uptrend advances in steps: price stalls at a resistance, consolidates, then clears it. The resistance breakout is the entry that tries to catch the start of the next leg.',
        'A credible breakout has three signs: a clean close above the level (not just a wick), a candle range larger than average, and ideally rising volume. A long, tight consolidation before the break strengthens the signal: the more energy was compressed, the more likely the exit carries.',
        'The main risk is the false breakout: price clears the level, draws in late buyers, then falls back into the zone. Hence two rules: enter on the close rather than intrabar, and place the stop under the middle or bottom of the consolidation, not just under the broken resistance.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Résistance à 450. Une bougie monte à 452 en séance mais clôture à 449. Que faites-vous ?',
        en: 'Resistance at 450. A candle trades up to 452 intraday but closes at 449. What do you do?',
      },
      options: {
        fr: ['Rien : pas de clôture au-dessus, pas de cassure', 'J’achète : le niveau a été franchi', 'Je vends à découvert immédiatement'],
        en: ['Nothing: no close above, no breakout', 'Buy: the level was crossed', 'Short immediately'],
      },
      correct: 0,
      rationale: {
        fr: 'Une mèche au-dessus suivie d’une clôture en dessous, c’est un rejet, pas une cassure. Vendre dessus serait aussi prématuré : un seul rejet ne retourne pas une tendance.',
        en: 'A wick above followed by a close below is a rejection, not a breakout. Shorting it would also be premature: one rejection does not reverse a trend.',
      },
    },
    quiz: [
      {
        q: { fr: 'Qu’est-ce qui renforce le plus une cassure ?', en: 'What strengthens a breakout most?' },
        options: {
          fr: ['Une consolidation serrée et longue avant', 'Une annonce sur les réseaux sociaux', 'Une cassure en pleine nuit sans volume'],
          en: ['A long, tight consolidation beforehand', 'A social media post', 'A break overnight on no volume'],
        },
        correct: 0,
        rationale: {
          fr: 'La compression précède l’expansion. Une cassure sur faible liquidité est au contraire la plus suspecte.',
          en: 'Compression precedes expansion. A break on thin liquidity is, on the contrary, the most suspect.',
        },
      },
      {
        q: { fr: 'Pourquoi entrer sur clôture plutôt qu’en intrabar ?', en: 'Why enter on the close rather than intrabar?' },
        options: {
          fr: ['Pour filtrer les mèches qui repassent sous le niveau', 'Pour payer moins de spread', 'Parce que le marché est fermé en séance'],
          en: ['To filter wicks that fall back under the level', 'To pay less spread', 'Because the market is closed intraday'],
        },
        correct: 0,
        rationale: {
          fr: 'Une partie des fausses cassures se voit à la clôture. Le coût : parfois une entrée plus haute. Le gain : moins de pièges.',
          en: 'Part of the false breakouts show at the close. The cost: sometimes a higher entry. The gain: fewer traps.',
        },
      },
      {
        q: { fr: 'Où placer le stop d’une cassure ?', en: 'Where does a breakout stop go?' },
        options: {
          fr: ['Sous le milieu ou le bas de la consolidation', 'À 1 pip sous la résistance cassée', 'Pas de stop, on attend'],
          en: ['Below the middle or bottom of the consolidation', '1 pip under the broken resistance', 'No stop, just wait'],
        },
        correct: 0,
        rationale: {
          fr: 'Un simple retour sous la résistance est fréquent et pas forcément un échec. L’idée est fausse si le prix réintègre franchement la consolidation.',
          en: 'A simple dip back under resistance is common and not necessarily a failure. The idea is wrong if price clearly re-enters the consolidation.',
        },
      },
    ],
  },

  'trend-05': {
    chart: { symbol: 'FX:EURUSD', interval: '60' },
    intro: {
      fr: [
        'Après une cassure, le prix revient souvent tester le niveau qu’il vient de franchir : l’ancienne résistance est désormais testée comme support. C’est le retest, et il offre une deuxième entrée — souvent meilleure que la première.',
        'Pourquoi ça arrive : les vendeurs piégés sous le niveau cherchent à sortir à prix coûtant, les acheteurs qui ont manqué la cassure attendent un meilleur prix. Si le niveau tient, c’est que la demande a vraiment changé de camp.',
        'L’entrée se fait sur la preuve que le niveau tient : une bougie de rejet sur le niveau, ou une reprise au-dessus du plus haut de la bougie de test. Le stop va sous le niveau retesté, avec une marge. Tous les breakouts ne font pas de retest : manquer un trade n’est pas une perte.',
      ],
      en: [
        'After a breakout, price often returns to test the level it just cleared: the old resistance is now tested as support. That is the retest, and it offers a second entry — often better than the first.',
        'Why it happens: sellers trapped below the level look to exit at breakeven, buyers who missed the breakout wait for a better price. If the level holds, demand has genuinely switched sides.',
        'Entry comes on proof that the level holds: a rejection candle on the level, or a move back above the test candle’s high. The stop goes under the retested level, with a margin. Not every breakout retests: a missed trade is not a loss.',
      ],
    },
    drill: {
      prompt: {
        fr: 'EUR/USD a cassé 1.1000 et monte à 1.1060. Il revient à 1.1005 et imprime une englobante haussière. Entrée à 1.1020, où est l’invalidation ?',
        en: 'EUR/USD broke 1.1000 and rallied to 1.1060. It returns to 1.1005 and prints a bullish engulfing. Entry at 1.1020, where is invalidation?',
      },
      options: {
        fr: ['Un peu sous 1.1000, par exemple 1.0985', '1.1060, le dernier plus haut', '1.1019, juste sous l’entrée'],
        en: ['A little under 1.1000, e.g. 1.0985', '1.1060, the last high', '1.1019, just under entry'],
      },
      correct: 0,
      rationale: {
        fr: 'L’idée est « 1.1000 est devenu un support ». Elle est fausse si le prix repasse franchement dessous. La marge de quelques pips absorbe le bruit autour du niveau.',
        en: 'The idea is “1.1000 has become support”. It is wrong if price clearly goes back below. A few pips of margin absorb the noise around the level.',
      },
    },
    quiz: [
      {
        q: { fr: 'Pourquoi une ancienne résistance peut-elle devenir support ?', en: 'Why can old resistance become support?' },
        options: {
          fr: ['Vendeurs piégés et acheteurs en retard y agissent', 'Par une règle officielle des bourses', 'Parce que les indicateurs l’imposent'],
          en: ['Trapped sellers and late buyers act there', 'By an official exchange rule', 'Because indicators require it'],
        },
        correct: 0,
        rationale: {
          fr: 'C’est un phénomène de mémoire collective et de positionnement, pas une loi. C’est pour ça qu’il faut une preuve avant d’entrer.',
          en: 'It is a matter of collective memory and positioning, not a law. That is why you need proof before entering.',
        },
      },
      {
        q: { fr: 'Le retest ne vient jamais et le prix file. Vous :', en: 'The retest never comes and price runs. You:' },
        options: {
          fr: ['Laissez passer : pas de setup, pas de trade', 'Achetez au plus haut par peur de rater', 'Vendez pour « punir » le marché'],
          en: ['Let it go: no setup, no trade', 'Buy the high out of fear of missing out', 'Short to “punish” the market'],
        },
        correct: 0,
        rationale: {
          fr: 'Courir après le prix transforme un bon plan en mauvaise entrée : stop lointain, R:R dégradé. Il y aura d’autres cassures.',
          en: 'Chasing price turns a good plan into a bad entry: distant stop, degraded R:R. There will be other breakouts.',
        },
      },
      {
        q: { fr: 'Quel signal confirme que le retest tient ?', en: 'Which signal confirms the retest holds?' },
        options: {
          fr: ['Une bougie de rejet sur le niveau', 'Le simple contact du niveau', 'Une clôture sous le niveau'],
          en: ['A rejection candle on the level', 'Merely touching the level', 'A close below the level'],
        },
        correct: 0,
        rationale: {
          fr: 'Le contact ne dit rien de qui gagne. Le rejet montre que les acheteurs ont défendu la zone. Une clôture dessous invalide l’idée.',
          en: 'The touch says nothing about who wins. The rejection shows buyers defended the zone. A close below invalidates the idea.',
        },
      },
    ],
  },

  'trend-06': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'En tendance, le gain vient de quelques mouvements longs. Un take-profit fixe les coupe ; un trailing stop — un stop que l’on remonte au fil de la tendance — les laisse courir tout en verrouillant une partie du chemin parcouru.',
        'Trois méthodes courantes : sous chaque nouveau creux plus haut (structurel), sous une moyenne mobile (par exemple clôture sous l’EMA 20), ou à une distance en ATR du plus haut atteint (par exemple 3 ATR, la « sortie chandelier »). Toutes ont la même règle d’or : un trailing stop ne recule jamais.',
        'Le compromis est permanent. Serré, il sort tôt et rate la suite ; large, il rend une grosse part du gain avant de sortir. Il n’existe pas de réglage parfait : choisissez-en un, notez-le dans votre plan, et jugez-le sur 30 trades, pas sur le dernier.',
      ],
      en: [
        'In a trend, profit comes from a few long moves. A fixed take-profit cuts them short; a trailing stop — a stop you raise as the trend progresses — lets them run while locking in part of the ground covered.',
        'Three common methods: under each new higher low (structural), under a moving average (e.g. a close below the EMA 20), or an ATR distance from the highest high reached (e.g. 3 ATR, the “chandelier exit”). All share one golden rule: a trailing stop never moves back.',
        'The trade-off never goes away. Tight, it exits early and misses the rest; wide, it gives back a large part of the gain before exiting. There is no perfect setting: pick one, write it in your plan, and judge it over 30 trades, not the last one.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Long à 100, stop initial 95. Le prix fait un creux plus haut à 104 puis monte à 112. Avec un trailing structurel, où est le stop ?',
        en: 'Long at 100, initial stop 95. Price makes a higher low at 104 then rises to 112. With a structural trailing stop, where is the stop?',
      },
      options: {
        fr: ['Juste sous 104', 'Toujours à 95', 'À 111, juste sous le prix'],
        en: ['Just under 104', 'Still at 95', 'At 111, just under price'],
      },
      correct: 0,
      rationale: {
        fr: 'Le creux plus haut à 104 est la nouvelle structure : s’il casse, la tendance est en doute. Le trade est maintenant garanti en gain de 4 points. 111 serait un stop au hasard, sans structure.',
        en: 'The higher low at 104 is the new structure: if it breaks, the trend is in doubt. The trade now locks in 4 points. 111 would be an arbitrary stop with no structure.',
      },
    },
    quiz: [
      {
        q: { fr: 'La règle d’or du trailing stop :', en: 'The golden rule of a trailing stop:' },
        options: {
          fr: ['Il ne recule jamais', 'Il suit le prix au pip près', 'On le retire si le prix s’en approche'],
          en: ['It never moves back', 'It follows price pip by pip', 'Remove it if price gets close'],
        },
        correct: 0,
        rationale: {
          fr: 'Reculer un stop, c’est augmenter son risque après coup. C’est exactement ce que le plan est censé empêcher.',
          en: 'Moving a stop back increases risk after the fact. That is exactly what the plan is meant to prevent.',
        },
      },
      {
        q: { fr: 'La sortie « chandelier » place le stop :', en: 'The “chandelier” exit places the stop:' },
        options: {
          fr: ['À un multiple d’ATR sous le plus haut atteint', 'Au prix d’entrée', 'Sur la moyenne 200'],
          en: ['A multiple of ATR under the highest high', 'At the entry price', 'On the 200 average'],
        },
        correct: 0,
        rationale: {
          fr: 'Plus haut atteint − k × ATR (souvent k = 3). La distance s’adapte à la volatilité du moment.',
          en: 'Highest high − k × ATR (often k = 3). The distance adapts to the current volatility.',
        },
      },
      {
        q: { fr: 'Comment juger un réglage de trailing stop ?', en: 'How do you judge a trailing-stop setting?' },
        options: {
          fr: ['Sur une série de trades, pas sur un seul', 'Sur le dernier trade', 'Au ressenti'],
          en: ['Over a series of trades, not one', 'On the last trade', 'By feel'],
        },
        correct: 0,
        rationale: {
          fr: 'Chaque réglage aura des trades où il paraît absurde. Seule une série montre s’il capte les grandes tendances sans trop rendre.',
          en: 'Every setting has trades where it looks absurd. Only a series shows whether it catches big trends without giving back too much.',
        },
      },
    ],
  },
};
