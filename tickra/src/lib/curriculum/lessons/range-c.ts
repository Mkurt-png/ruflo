// Stratégies de range — leçons 11 à 14 (Pro). Server-only: paid copy,
// imported only through lesson-content.ts (see no-paid-content-in-bundle.test.ts).

import type { LessonContent } from '../lesson-content';

export const RANGE_C: Record<string, LessonContent> = {
  'range-11': {
    chart: { symbol: 'FX:GBPUSD', interval: '60' },
    intro: {
      fr: [
        'Les canaux de Keltner encadrent une moyenne mobile avec des bandes calculées sur l’ATR plutôt que sur l’écart-type. La version moderne la plus répandue : EMA 20, plus et moins 2 × ATR. Parce que l’ATR varie moins brutalement que l’écart-type, les canaux sont plus réguliers que les bandes de Bollinger.',
        'Usage en range : une clôture hors du canal est un vrai écart par rapport à la volatilité normale. Quand ce dépassement se produit sur une borne de range et que la bougie suivante réintègre le canal, c’est un signal d’excès exploitable, avec l’EMA 20 comme objectif.',
        'L’association la plus utile est Bollinger + Keltner. Quand les bandes de Bollinger passent à l’intérieur des canaux de Keltner, la volatilité est anormalement comprimée : c’est le « squeeze ». Ce n’est pas le moment d’ouvrir des trades de range — c’est le moment de se préparer à une cassure.',
      ],
      en: [
        'Keltner Channels wrap a moving average in bands based on ATR rather than standard deviation. The most common modern version: EMA 20, plus and minus 2 × ATR. Because ATR moves less abruptly than standard deviation, the channels are smoother than Bollinger Bands.',
        'Use in a range: a close outside the channel is a real departure from normal volatility. When that happens at a range boundary and the next candle comes back inside the channel, it is an exploitable excess signal, with the EMA 20 as the target.',
        'The most useful pairing is Bollinger + Keltner. When the Bollinger Bands move inside the Keltner Channels, volatility is abnormally compressed: that is the “squeeze”. It is not the time to open range trades — it is the time to prepare for a breakout.',
      ],
    },
    drill: {
      prompt: {
        fr: 'EMA 20 = 1.2650, ATR = 0.0025. Où sont les canaux de Keltner à 2 ATR ?',
        en: 'EMA 20 = 1.2650, ATR = 0.0025. Where are the 2-ATR Keltner Channels?',
      },
      options: {
        fr: ['1.2600 et 1.2700', '1.2625 et 1.2675', '1.2550 et 1.2750'],
        en: ['1.2600 and 1.2700', '1.2625 and 1.2675', '1.2550 and 1.2750'],
      },
      correct: 0,
      rationale: {
        fr: '2 × 0.0025 = 0.0050. 1.2650 ± 0.0050 donne 1.2600 et 1.2700.',
        en: '2 × 0.0025 = 0.0050. 1.2650 ± 0.0050 gives 1.2600 and 1.2700.',
      },
    },
    quiz: [
      {
        q: { fr: 'Différence entre Keltner et Bollinger :', en: 'Keltner versus Bollinger:' },
        options: {
          fr: ['Keltner utilise l’ATR, Bollinger l’écart-type', 'Keltner utilise le volume', 'Aucune'],
          en: ['Keltner uses ATR, Bollinger standard deviation', 'Keltner uses volume', 'None'],
        },
        correct: 0,
        rationale: {
          fr: 'Deux mesures différentes de la volatilité, d’où des enveloppes aux comportements différents.',
          en: 'Two different measures of volatility, hence envelopes that behave differently.',
        },
      },
      {
        q: { fr: 'Bollinger à l’intérieur de Keltner signale :', en: 'Bollinger inside Keltner signals:' },
        options: {
          fr: ['Une compression de volatilité (squeeze)', 'Une tendance forte', 'Une erreur de réglage'],
          en: ['A volatility compression (squeeze)', 'A strong trend', 'A settings error'],
        },
        correct: 0,
        rationale: {
          fr: 'L’écart-type est tombé sous 2 ATR : les clôtures sont exceptionnellement serrées.',
          en: 'Standard deviation has dropped below 2 ATR: closes are exceptionally tight.',
        },
      },
      {
        q: { fr: 'Pendant un squeeze, un trader de range :', en: 'During a squeeze, a range trader:' },
        options: {
          fr: ['S’abstient et se prépare à une cassure', 'Double ses positions', 'Retire ses stops'],
          en: ['Stands aside and prepares for a breakout', 'Doubles positions', 'Removes stops'],
        },
        correct: 0,
        rationale: {
          fr: 'La compression précède l’expansion. Être positionné contre la future cassure est le pire endroit où se trouver.',
          en: 'Compression precedes expansion. Being positioned against the coming breakout is the worst place to be.',
        },
      },
    ],
  },

  'range-12': {
    intro: {
      fr: [
        'Le mean reversion échoue quand l’équilibre lui-même se déplace. Une annonce de banque centrale, un changement de politique, un choc de liquidité : le « prix normal » d’hier n’est plus celui d’aujourd’hui, et chaque achat « sur excès » se fait contre un marché qui se réévalue.',
        'L’exemple extrême : le 15 janvier 2015, la Banque nationale suisse a abandonné sans prévenir le plancher de 1,20 franc pour un euro qu’elle défendait depuis 2011. EUR/CHF est tombé sous 0,90 en quelques minutes. Pendant plus de trois ans, acheter près de 1,20 avait été le trade de range le plus « sûr » du marché ; des comptes ont été vidés, et certains courtiers ont fait faillite.',
        'Les leçons pratiques : un stop ne garantit pas le prix d’exécution quand le marché saute des niveaux ; aucune borne n’est permanente ; et le plus grand danger du mean reversion est de moyenner à la baisse — ajouter à une position perdante parce que le prix est « encore plus en excès ». C’est exactement la décision qui transforme une perte en ruine.',
      ],
      en: [
        'Mean reversion fails when the equilibrium itself moves. A central-bank announcement, a policy shift, a liquidity shock: yesterday’s “normal price” is no longer today’s, and every buy “on an extreme” is made against a market that is repricing.',
        'The extreme example: on 15 January 2015, the Swiss National Bank abandoned without warning the 1.20 franc-per-euro floor it had defended since 2011. EUR/CHF fell below 0.90 within minutes. For over three years, buying near 1.20 had been the market’s “safest” range trade; accounts were wiped out, and some brokers went bankrupt.',
        'The practical lessons: a stop does not guarantee the fill price when the market jumps levels; no boundary is permanent; and mean reversion’s greatest danger is averaging down — adding to a losing position because price is “even more extreme”. That is exactly the decision that turns a loss into ruin.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Vous êtes acheteur en bas de range. La banque centrale annonce un changement de politique inattendu et le prix chute de 3 ATR. Réponse ?',
        en: 'You are long at the range bottom. The central bank announces an unexpected policy change and price drops 3 ATR. Response?',
      },
      options: {
        fr: ['Accepter la sortie : l’équilibre a changé', 'Acheter plus, c’est encore moins cher', 'Retirer le stop et attendre'],
        en: ['Accept the exit: the equilibrium has changed', 'Buy more, it is even cheaper', 'Remove the stop and wait'],
      },
      correct: 0,
      rationale: {
        fr: 'Une nouvelle information a déplacé la valeur de référence. Le range d’hier n’existe plus ; défendre la position revient à parier contre le marché qui intègre la nouvelle.',
        en: 'New information has moved the reference value. Yesterday’s range no longer exists; defending the position means betting against a market pricing in the news.',
      },
    },
    quiz: [
      {
        q: { fr: 'Le mean reversion échoue surtout quand :', en: 'Mean reversion fails mostly when:' },
        options: {
          fr: ['L’équilibre lui-même se déplace', 'Le marché est calme', 'Le range est large'],
          en: ['The equilibrium itself shifts', 'The market is calm', 'The range is wide'],
        },
        correct: 0,
        rationale: {
          fr: 'Le pari « retour à la moyenne » suppose une moyenne stable. Quand la référence change, il n’y a plus rien vers quoi revenir.',
          en: 'The “return to the mean” bet assumes a stable mean. When the reference changes, there is nothing to return to.',
        },
      },
      {
        q: { fr: 'Leçon du 15 janvier 2015 (franc suisse) :', en: 'Lesson of 15 January 2015 (Swiss franc):' },
        options: {
          fr: ['Aucune borne n’est permanente et un stop peut glisser', 'Les banques centrales ne bougent jamais', 'Il faut toujours acheter les planchers'],
          en: ['No boundary is permanent and a stop can slip', 'Central banks never move', 'Always buy floors'],
        },
        correct: 0,
        rationale: {
          fr: 'Même un plancher annoncé officiellement a cédé, et les prix ont sauté bien au-delà des stops placés.',
          en: 'Even an officially announced floor gave way, and prices jumped far beyond the stops that had been placed.',
        },
      },
      {
        q: { fr: 'La décision qui transforme une perte en ruine :', en: 'The decision that turns a loss into ruin:' },
        options: {
          fr: ['Moyenner à la baisse une position perdante', 'Respecter son stop', 'Réduire sa taille'],
          en: ['Averaging down a losing position', 'Honouring your stop', 'Reducing size'],
        },
        correct: 0,
        rationale: {
          fr: 'Chaque ajout augmente l’exposition au moment où l’hypothèse se révèle fausse.',
          en: 'Every addition increases exposure just as the hypothesis proves wrong.',
        },
      },
    ],
  },

  'range-13': {
    chart: { symbol: 'FX:GBPUSD', interval: '240' },
    intro: {
      fr: [
        'Exercice : GBP/USD évolue depuis trois semaines entre 1.2600 et 1.2750, avec trois rebonds nets sur le bas et trois rejets sur le haut. La moyenne 50 en H4 est plate, l’ADX est à 17.',
        'Le prix revient à 1.2605 et imprime une bougie à longue ombre basse qui clôture à 1.2612 ; le RSI remonte au-dessus de 30. Aucune annonce majeure n’est prévue dans les 24 heures. Vous préparez un achat à 1.2615, stop à 1.2580, objectif 1 au milieu (1.2675), objectif 2 sous le haut (1.2740).',
        'Faites le calcul avant de répondre : risque en pips, R:R vers chaque objectif, et taille de position pour risquer 1 % d’un compte de 5 000 $ (valeur du pip : 10 $ par lot standard). Notez tout dans votre journal — c’est exactement le format de vos futurs trades réels.',
      ],
      en: [
        'Drill: GBP/USD has spent three weeks between 1.2600 and 1.2750, with three clean bounces off the bottom and three rejections at the top. The H4 50 average is flat, ADX is at 17.',
        'Price returns to 1.2605 and prints a long-lower-wick candle closing at 1.2612; RSI climbs back above 30. No major release is due within 24 hours. You prepare a buy at 1.2615, stop at 1.2580, target 1 at the middle (1.2675), target 2 just below the top (1.2740).',
        'Do the maths before answering: risk in pips, R:R to each target, and position size to risk 1 % of a $5,000 account (pip value: $10 per standard lot). Write it all in your journal — it is exactly the format of your future real trades.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Quel est le R:R vers l’objectif 1 (1.2675) ?',
        en: 'What is the R:R to target 1 (1.2675)?',
      },
      options: { fr: ['≈ 1,7', '≈ 3,6', '≈ 0,6'], en: ['≈ 1.7', '≈ 3.6', '≈ 0.6'] },
      correct: 0,
      rationale: {
        fr: 'Risque : 1.2615 − 1.2580 = 35 pips. Gain vers 1.2675 : 60 pips. 60 / 35 ≈ 1,7. Vers 1.2740 : 125 pips, soit ≈ 3,6.',
        en: 'Risk: 1.2615 − 1.2580 = 35 pips. Gain to 1.2675: 60 pips. 60 / 35 ≈ 1.7. To 1.2740: 125 pips, ≈ 3.6.',
      },
    },
    quiz: [
      {
        q: { fr: 'Taille pour risquer 1 % de 5 000 $ avec ce stop ?', en: 'Size to risk 1 % of $5,000 with this stop?' },
        options: { fr: ['≈ 0,14 lot', '1 lot', '0,5 lot'], en: ['≈ 0.14 lot', '1 lot', '0.5 lot'] },
        correct: 0,
        rationale: {
          fr: 'Risque = 50 $. 50 / (35 pips × 10 $) ≈ 0,14 lot. À 1 lot, la perte au stop serait de 350 $, 7 % du compte.',
          en: 'Risk = $50. 50 / (35 pips × $10) ≈ 0.14 lot. At 1 lot the stop-out loss would be $350, 7 % of the account.',
        },
      },
      {
        q: { fr: 'Quel élément du contexte soutient ce trade ?', en: 'Which part of the context supports this trade?' },
        options: {
          fr: ['ADX 17 et moyenne plate : régime de range', 'Une tendance haussière forte', 'Une annonce imminente'],
          en: ['ADX 17 and flat average: ranging regime', 'A strong uptrend', 'An imminent release'],
        },
        correct: 0,
        rationale: {
          fr: 'Le régime est la première condition. Trois tests par borne et aucune annonce complètent le tableau.',
          en: 'The regime is the first condition. Three tests per boundary and no scheduled release complete the picture.',
        },
      },
      {
        q: { fr: 'Le prix clôture à 1.2570 en H4. Votre action ?', en: 'Price closes at 1.2570 on H4. Your action?' },
        options: {
          fr: ['Le stop à 1.2580 est exécuté : fin du trade', 'Ajouter à 1.2570', 'Reculer le stop à 1.2500'],
          en: ['The 1.2580 stop is filled: trade over', 'Add at 1.2570', 'Move the stop to 1.2500'],
        },
        correct: 0,
        rationale: {
          fr: 'Le bas du range a cédé. La perte prévue de 1 % est encaissée ; la suite se joue sur un autre trade, peut-être une vente de cassure.',
          en: 'The range bottom gave way. The planned 1 % loss is taken; what comes next is another trade, perhaps a breakout short.',
        },
      },
    ],
  },

  'range-14': {
    intro: {
      fr: [
        'Point de contrôle range. Quatre acquis : prouver un range avant de le trader (deux tests par borne, moyenne plate), entrer sur rejet près des bornes et jamais au milieu, placer le stop au-delà de la zone de borne, viser d’abord le milieu.',
        'Les oscillateurs — RSI, stochastique — et les enveloppes — Bollinger, Keltner — confirment un excès sur une borne ; ils ne le créent pas. En tendance, ils restent à leurs extrêmes et poussent à vendre des marchés qui montent.',
        'Retenez surtout les cas d’échec : fausses sorties à exploiter, vraies cassures à respecter, et changements d’équilibre (banque centrale, choc) où le mean reversion devient dangereux. La piste suivante, Régimes de volatilité, vous apprend à mesurer ces changements avant qu’ils ne vous coûtent.',
      ],
      en: [
        'Range checkpoint. Four things to lock in: prove a range before trading it (two tests per boundary, flat average), enter on rejection near the boundaries and never in the middle, place the stop beyond the boundary zone, target the middle first.',
        'Oscillators — RSI, stochastic — and envelopes — Bollinger, Keltner — confirm an extreme at a boundary; they do not create it. In a trend they stay at their extremes and push you to sell rising markets.',
        'Above all, remember the failure cases: fakeouts to exploit, genuine breakouts to respect, and shifts in equilibrium (central bank, shock) where mean reversion turns dangerous. The next track, Volatility regimes, teaches you to measure those shifts before they cost you.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Le prix est au milieu d’un range confirmé, le RSI est à 50. Que faites-vous ?',
        en: 'Price is in the middle of a confirmed range, RSI at 50. What do you do?',
      },
      options: {
        fr: ['Rien : aucune borne, aucun avantage', 'Acheter', 'Vendre'],
        en: ['Nothing: no boundary, no edge', 'Buy', 'Sell'],
      },
      correct: 0,
      rationale: {
        fr: 'Au milieu, stop logique lointain et objectif proche dans les deux sens : le R:R est défavorable quel que soit le choix.',
        en: 'In the middle, the logical stop is far and the target near either way: R:R is unfavourable whichever side you pick.',
      },
    },
    quiz: [
      {
        q: { fr: 'Condition minimale pour parler de range :', en: 'Minimum condition for a range:' },
        options: {
          fr: ['Au moins deux tests de chaque borne', 'Une seule bougie de rejet', 'Un RSI à 70'],
          en: ['At least two tests of each boundary', 'A single rejection candle', 'An RSI of 70'],
        },
        correct: 0,
        rationale: {
          fr: 'Sans preuve des deux bornes, ce n’est qu’une hypothèse.',
          en: 'Without proof of both boundaries, it is only a hypothesis.',
        },
      },
      {
        q: { fr: 'Rôle des oscillateurs en range :', en: 'Oscillators’ role in a range:' },
        options: {
          fr: ['Confirmer un excès sur une borne', 'Définir les bornes', 'Remplacer le stop'],
          en: ['Confirm an extreme at a boundary', 'Define the boundaries', 'Replace the stop'],
        },
        correct: 0,
        rationale: {
          fr: 'La borne est le contexte ; l’oscillateur, un indice supplémentaire.',
          en: 'The boundary is the context; the oscillator is one more clue.',
        },
      },
      {
        q: { fr: 'Un plancher défendu depuis des années :', en: 'A floor defended for years:' },
        options: {
          fr: ['Peut céder d’un coup : stop et taille modeste', 'Est garanti', 'Justifie un levier maximal'],
          en: ['Can give way at once: stop and modest size', 'Is guaranteed', 'Justifies maximum leverage'],
        },
        correct: 0,
        rationale: {
          fr: 'Le franc suisse en 2015 l’a montré : plus une borne semble sûre, plus la position de chacun y est lourde, et plus la sortie est violente.',
          en: 'The Swiss franc in 2015 showed it: the safer a boundary looks, the heavier everyone is positioned on it, and the more violent the exit.',
        },
      },
    ],
  },
};
