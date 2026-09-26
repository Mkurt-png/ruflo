// Régimes de volatilité — leçons 1 à 5 (Pro). Server-only: paid copy,
// imported only through lesson-content.ts (see no-paid-content-in-bundle.test.ts).

import type { LessonContent } from '../lesson-content';

export const VOL_A: Record<string, LessonContent> = {
  'vol-01': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'La volatilité mesure l’ampleur des variations de prix, pas leur direction. Un marché qui monte de 2 % puis baisse de 2 % chaque jour est très volatil même s’il ne va nulle part. Pour le trader, elle fixe presque tout : la distance du stop, la taille de position, la durée probable d’un trade.',
        'Deux mesures principales. La volatilité historique (ou réalisée) est l’écart-type des rendements quotidiens, souvent annualisé en le multipliant par √252 (le nombre approximatif de séances boursières par an). L’ATR, vu dans la piste Tendance, mesure l’amplitude moyenne des bougies en unités de prix — plus concret pour placer un stop.',
        'Pour comparer deux marchés, exprimez la volatilité en pourcentage du prix. Un ATR de 5 $ sur une action à 50 $ (10 %) n’a rien à voir avec un ATR de 5 $ sur une action à 500 $ (1 %). La même règle de stop en dollars serait absurde sur l’une et prudente sur l’autre.',
      ],
      en: [
        'Volatility measures the size of price changes, not their direction. A market that rises 2 % then falls 2 % every day is very volatile even if it goes nowhere. For a trader it sets almost everything: stop distance, position size, how long a trade is likely to last.',
        'Two main measures. Historical (or realised) volatility is the standard deviation of daily returns, often annualised by multiplying by √252 (the approximate number of trading sessions per year). ATR, seen in the Trend track, measures the average candle range in price units — more concrete for placing a stop.',
        'To compare two markets, express volatility as a percentage of price. A $5 ATR on a $50 stock (10 %) has nothing in common with a $5 ATR on a $500 stock (1 %). The same dollar stop rule would be absurd on one and cautious on the other.',
      ],
    },
    drill: {
      prompt: {
        fr: 'L’écart-type des rendements quotidiens d’un indice est de 1 %. Quelle est sa volatilité annualisée approximative ?',
        en: 'An index’s daily-return standard deviation is 1 %. What is its approximate annualised volatility?',
      },
      options: { fr: ['≈ 16 %', '≈ 252 %', '≈ 1 %'], en: ['≈ 16 %', '≈ 252 %', '≈ 1 %'] },
      correct: 0,
      rationale: {
        fr: '1 % × √252 ≈ 1 % × 15,9 ≈ 16 %. On multiplie par la racine du nombre de séances, pas par le nombre lui-même : les variations quotidiennes se compensent en partie.',
        en: '1 % × √252 ≈ 1 % × 15.9 ≈ 16 %. You multiply by the square root of the number of sessions, not the number itself: daily moves partly offset each other.',
      },
    },
    quiz: [
      {
        q: { fr: 'La volatilité mesure :', en: 'Volatility measures:' },
        options: { fr: ['L’ampleur des variations', 'La direction du marché', 'Le volume'], en: ['The size of moves', 'Market direction', 'Volume'] },
        correct: 0,
        rationale: {
          fr: 'Une chute et une envolée de même taille ont la même volatilité.',
          en: 'A drop and a rally of the same size have the same volatility.',
        },
      },
      {
        q: { fr: 'Pourquoi exprimer l’ATR en % du prix ?', en: 'Why express ATR as a % of price?' },
        options: {
          fr: ['Pour comparer des actifs de prix différents', 'Pour qu’il paraisse plus petit', 'Parce que les courtiers l’exigent'],
          en: ['To compare assets with different prices', 'To make it look smaller', 'Because brokers require it'],
        },
        correct: 0,
        rationale: {
          fr: 'Une valeur absolue ne dit rien sans le niveau du prix. Le pourcentage rend les marchés comparables.',
          en: 'An absolute value says nothing without the price level. The percentage makes markets comparable.',
        },
      },
      {
        q: { fr: 'Pour placer un stop, la mesure la plus pratique est :', en: 'For placing a stop, the most practical measure is:' },
        options: {
          fr: ['L’ATR, en unités de prix', 'La volatilité annualisée', 'Le nombre de bougies vertes'],
          en: ['ATR, in price units', 'Annualised volatility', 'The number of green candles'],
        },
        correct: 0,
        rationale: {
          fr: 'L’ATR se lit directement en pips ou en dollars sur le graphique où vous placez l’ordre.',
          en: 'ATR reads directly in pips or dollars on the chart where you place the order.',
        },
      },
    ],
  },

  'vol-02': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'Le VIX, publié par le Cboe, mesure la volatilité implicite des options sur le S&P 500 pour les 30 prochains jours, exprimée en pourcentage annualisé. Ce n’est pas une mesure du passé : c’est le prix que le marché paie pour se protéger contre les mouvements à venir.',
        'Règle pratique du « 16 » : diviser le VIX par environ 16 (√252) donne le mouvement quotidien typique attendu. VIX à 16 → environ 1 % par jour ; VIX à 32 → environ 2 %. Sur longue période il tourne autour de 19-20 ; sous 15, les marchés sont calmes ; au-dessus de 30, ils sont sous tension. Il a dépassé 80 à l’automne 2008 et en mars 2020.',
        'Le VIX ne s’achète pas directement. Les produits qui le répliquent passent par des contrats à terme et perdent souvent de la valeur avec le temps quand le marché est calme. Pour la plupart des traders, le VIX est un thermomètre du régime, pas un actif à trader.',
      ],
      en: [
        'The VIX, published by Cboe, measures the implied volatility of S&P 500 options over the next 30 days, expressed as an annualised percentage. It does not measure the past: it is the price the market pays to protect itself against upcoming moves.',
        'The rule of “16”: dividing the VIX by about 16 (√252) gives the typical expected daily move. VIX at 16 → about 1 % a day; VIX at 32 → about 2 %. Over the long run it hovers around 19-20; below 15 markets are calm; above 30 they are under stress. It went above 80 in autumn 2008 and in March 2020.',
        'The VIX cannot be bought directly. Products tracking it go through futures and often lose value over time when markets are calm. For most traders the VIX is a regime thermometer, not an asset to trade.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Le VIX est à 24. Quel mouvement quotidien typique du S&P 500 le marché anticipe-t-il ?',
        en: 'The VIX is at 24. What typical daily S&P 500 move does the market expect?',
      },
      options: { fr: ['≈ 1,5 %', '≈ 24 %', '≈ 0,24 %'], en: ['≈ 1.5 %', '≈ 24 %', '≈ 0.24 %'] },
      correct: 0,
      rationale: {
        fr: '24 / 16 = 1,5 %. Ce n’est pas une promesse de mouvement dans un sens — c’est l’ampleur typique attendue, à la hausse comme à la baisse.',
        en: '24 / 16 = 1.5 %. It is not a promise of a move either way — it is the typical expected size, up or down.',
      },
    },
    quiz: [
      {
        q: { fr: 'Le VIX mesure :', en: 'The VIX measures:' },
        options: {
          fr: ['La volatilité implicite du S&P 500 à 30 jours', 'La volatilité passée du Nasdaq', 'Le volume des options'],
          en: ['The 30-day implied volatility of the S&P 500', 'The Nasdaq’s past volatility', 'Options volume'],
        },
        correct: 0,
        rationale: {
          fr: 'Implicite = déduite des prix des options, donc tournée vers l’avenir.',
          en: 'Implied = derived from option prices, therefore forward-looking.',
        },
      },
      {
        q: { fr: 'VIX à 35 :', en: 'VIX at 35:' },
        options: {
          fr: ['Marché sous tension, mouvements larges attendus', 'Marché très calme', 'Hausse garantie'],
          en: ['Market under stress, large moves expected', 'Very calm market', 'Guaranteed rise'],
        },
        correct: 0,
        rationale: {
          fr: '35 / 16 ≈ 2,2 % de mouvement quotidien typique : réduire la taille est la première réponse.',
          en: '35 / 16 ≈ 2.2 % typical daily move: cutting size is the first response.',
        },
      },
      {
        q: { fr: 'Pourquoi le VIX est-il surtout un thermomètre ?', en: 'Why is the VIX mainly a thermometer?' },
        options: {
          fr: ['Il ne s’achète pas directement et ses produits dérivés s’érodent', 'Il est interdit aux particuliers', 'Il ne change jamais'],
          en: ['It cannot be bought directly and its products erode', 'It is banned for retail', 'It never changes'],
        },
        correct: 0,
        rationale: {
          fr: 'Détenir un produit « VIX » en marché calme coûte en général de l’argent. Le lire, en revanche, ne coûte rien.',
          en: 'Holding a “VIX” product in a calm market usually costs money. Reading it costs nothing.',
        },
      },
    ],
  },

  'vol-03': {
    chart: { symbol: 'FX:EURUSD', interval: 'D' },
    intro: {
      fr: [
        'L’ATR vous a servi à placer des stops. Il sert aussi de baromètre : comparez l’ATR actuel à sa propre moyenne sur plusieurs mois. Un ATR 14 à 1,5 fois sa moyenne de 100 séances signale un marché nettement plus nerveux que d’habitude ; à 0,6 fois, un marché anormalement calme.',
        'Ce ratio répond à une question que l’ATR brut ne pose pas : est-ce normal pour ce marché ? 80 pips d’ATR sur EUR/USD n’ont pas le même sens selon que la moyenne des derniers mois est 60 ou 100.',
        'Utilisez ce baromètre avant chaque session : il vous dit dans quel régime vous entrez et quelles stratégies sont plausibles. Il ne vous dit pas ce que fera le prix. Un ATR qui monte peut accompagner une hausse comme une baisse.',
      ],
      en: [
        'You have used ATR to place stops. It also works as a barometer: compare the current ATR with its own average over several months. A 14-period ATR at 1.5 times its 100-session average signals a clearly more nervous market than usual; at 0.6 times, an abnormally calm one.',
        'That ratio answers a question raw ATR does not ask: is this normal for this market? An 80-pip ATR on EUR/USD means something different depending on whether the average of recent months is 60 or 100.',
        'Check this barometer before every session: it tells you which regime you are walking into and which strategies are plausible. It does not tell you what price will do. A rising ATR can come with a rally as much as a sell-off.',
      ],
    },
    drill: {
      prompt: {
        fr: 'ATR 14 actuel : 90 pips. Moyenne de l’ATR sur 100 séances : 60 pips. Quel régime ?',
        en: 'Current 14-period ATR: 90 pips. 100-session ATR average: 60 pips. Which regime?',
      },
      options: {
        fr: ['Nerveux : 1,5 fois la normale', 'Calme', 'Impossible à dire'],
        en: ['Nervous: 1.5 times normal', 'Calm', 'Impossible to say'],
      },
      correct: 0,
      rationale: {
        fr: '90 / 60 = 1,5. Le marché bouge 50 % de plus que d’habitude : stops plus larges, tailles plus petites, et prudence sur les stratégies de range.',
        en: '90 / 60 = 1.5. The market moves 50 % more than usual: wider stops, smaller sizes, and caution with range strategies.',
      },
    },
    quiz: [
      {
        q: { fr: 'Comparer l’ATR à sa propre moyenne sert à :', en: 'Comparing ATR with its own average serves to:' },
        options: {
          fr: ['Savoir si la volatilité actuelle est normale pour ce marché', 'Prédire la direction', 'Calculer le spread'],
          en: ['Know whether current volatility is normal for this market', 'Predict direction', 'Compute the spread'],
        },
        correct: 0,
        rationale: {
          fr: 'Chaque marché a sa volatilité habituelle. Le ratio situe le moment présent par rapport à elle.',
          en: 'Each market has its usual volatility. The ratio places the present moment against it.',
        },
      },
      {
        q: { fr: 'Ratio ATR à 0,6 :', en: 'ATR ratio at 0.6:' },
        options: {
          fr: ['Marché anormalement calme', 'Marché en crise', 'Tendance haussière'],
          en: ['Abnormally calm market', 'Market in crisis', 'Uptrend'],
        },
        correct: 0,
        rationale: {
          fr: 'Le calme favorise les ranges — et précède souvent une expansion de volatilité.',
          en: 'Calm favours ranges — and often precedes a volatility expansion.',
        },
      },
      {
        q: { fr: 'Un ATR en hausse signifie :', en: 'A rising ATR means:' },
        options: {
          fr: ['Des mouvements plus larges, dans un sens ou l’autre', 'Une hausse du prix', 'Une baisse du prix'],
          en: ['Larger moves, either way', 'A price rise', 'A price fall'],
        },
        correct: 0,
        rationale: {
          fr: 'Même principe que l’ADX : on mesure l’intensité, jamais la direction.',
          en: 'Same principle as ADX: it measures intensity, never direction.',
        },
      },
    ],
  },

  'vol-04': {
    chart: { symbol: 'FX:EURUSD', interval: 'D' },
    intro: {
      fr: [
        'Le régime calme : bougies petites, ATR sous sa moyenne, VIX bas. Les ranges tiennent mieux, les stratégies de retour à la moyenne fonctionnent, et les cassures manquent souvent de suite. Certaines tendances lentes et régulières s’y développent aussi.',
        'Le piège du calme est psychologique. Des semaines sans mouvement donnent l’impression que le risque a disparu ; beaucoup augmentent alors leur levier pour « compenser » les petits mouvements. C’est le mécanisme décrit par l’économiste Hyman Minsky : la stabilité encourage des comportements qui préparent l’instabilité.',
        'Conduite à tenir : exploiter les ranges avec des stops normaux, ne pas augmenter le levier parce que les mouvements sont petits, et surveiller les signes de compression (squeeze Bollinger/Keltner, ATR au plus bas depuis des mois). Plus un calme dure, plus sa fin mérite d’être anticipée — sans pouvoir être datée.',
      ],
      en: [
        'The calm regime: small candles, ATR below its average, low VIX. Ranges hold better, mean-reversion strategies work, and breakouts often lack follow-through. Some slow, steady trends develop there too.',
        'The trap of calm is psychological. Weeks without movement make risk feel like it has vanished; many then raise leverage to “make up” for the small moves. That is the mechanism the economist Hyman Minsky described: stability encourages behaviour that prepares instability.',
        'How to act: exploit ranges with normal stops, do not raise leverage because moves are small, and watch for signs of compression (Bollinger/Keltner squeeze, ATR at multi-month lows). The longer a calm lasts, the more its end deserves anticipating — without being able to date it.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Depuis deux mois l’ATR est à 0,6 fois sa moyenne. Vos gains sont petits. Un collègue propose de tripler le levier. Réponse ?',
        en: 'For two months ATR has been at 0.6 times its average. Your gains are small. A colleague suggests tripling leverage. Response?',
      },
      options: {
        fr: ['Non : le risque par trade reste fixé en %', 'Oui, le marché est sans risque', 'Oui, mais sans stop'],
        en: ['No: risk per trade stays fixed in %', 'Yes, the market is risk-free', 'Yes, but without a stop'],
      },
      correct: 0,
      rationale: {
        fr: 'Tripler le levier en période calme, c’est être au maximum d’exposition le jour où la volatilité revient — souvent d’un coup.',
        en: 'Tripling leverage in a calm period means being at maximum exposure the day volatility returns — often all at once.',
      },
    },
    quiz: [
      {
        q: { fr: 'Stratégies favorisées en régime calme :', en: 'Strategies favoured in a calm regime:' },
        options: {
          fr: ['Retour à la moyenne, trading de range', 'Poursuite de cassures violentes', 'Aucune'],
          en: ['Mean reversion, range trading', 'Chasing violent breakouts', 'None'],
        },
        correct: 0,
        rationale: {
          fr: 'Sans énergie, les excursions hors des bornes reviennent plus souvent vers l’équilibre.',
          en: 'Without energy, excursions beyond the boundaries return to equilibrium more often.',
        },
      },
      {
        q: { fr: 'Le paradoxe de Minsky :', en: 'Minsky’s paradox:' },
        options: {
          fr: ['La stabilité prépare l’instabilité', 'Le calme dure toujours', 'La volatilité est constante'],
          en: ['Stability breeds instability', 'Calm lasts forever', 'Volatility is constant'],
        },
        correct: 0,
        rationale: {
          fr: 'Le calme pousse à s’endetter et à prendre plus de risque, ce qui rend la sortie du calme plus brutale.',
          en: 'Calm pushes people to borrow and take more risk, which makes the exit from calm more brutal.',
        },
      },
      {
        q: { fr: 'Signe de fin de calme possible :', en: 'Possible sign that calm is ending:' },
        options: {
          fr: ['Compression extrême (squeeze)', 'Une bougie verte', 'Un week-end'],
          en: ['Extreme compression (squeeze)', 'A green candle', 'A weekend'],
        },
        correct: 0,
        rationale: {
          fr: 'La compression ne donne ni la date ni la direction, mais elle justifie de réduire l’exposition aux stratégies de range.',
          en: 'Compression gives neither the date nor the direction, but it justifies reducing exposure to range strategies.',
        },
      },
    ],
  },

  'vol-05': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'Le régime nerveux : bougies larges, ATR au-dessus de sa moyenne, VIX élevé, gaps plus fréquents, spreads plus larges aux heures creuses. Les niveaux techniques sont franchis puis retrouvés dans la même séance ; un plan qui marchait en régime calme devient une machine à se faire sortir.',
        'Trois ajustements. Stops plus larges, en ATR, pour laisser respirer. Taille plus petite, pour que ce stop élargi coûte toujours le même pourcentage du compte. Moins de trades : ne garder que les setups les plus nets, car chaque erreur coûte plus cher et les coûts d’exécution augmentent.',
        'Les stratégies de tendance souffrent moins que celles de range si la volatilité accompagne un mouvement directionnel. Le retour à la moyenne, en revanche, se fait piéger : vendre un « excès » dans un marché qui panique revient à se mettre devant le mouvement.',
      ],
      en: [
        'The nervous regime: wide candles, ATR above its average, high VIX, more frequent gaps, wider spreads in quiet hours. Technical levels are broken and reclaimed in the same session; a plan that worked in a calm regime becomes a stop-out machine.',
        'Three adjustments. Wider stops, in ATR, to give room. Smaller size, so the wider stop still costs the same percentage of the account. Fewer trades: keep only the cleanest setups, because every mistake costs more and execution costs rise.',
        'Trend strategies suffer less than range strategies if volatility comes with a directional move. Mean reversion, on the other hand, gets trapped: selling an “extreme” in a panicking market means standing in front of the move.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Votre stop normal fait 1,5 ATR pour 1 lot. L’ATR vient de doubler. À risque constant, vous :',
        en: 'Your normal stop is 1.5 ATR on 1 lot. ATR has just doubled. At constant risk, you:',
      },
      options: {
        fr: ['Gardez 1,5 ATR et passez à 0,5 lot', 'Gardez 1 lot et le même stop en pips', 'Passez à 2 lots'],
        en: ['Keep 1.5 ATR and go to 0.5 lot', 'Keep 1 lot and the same pip stop', 'Go to 2 lots'],
      },
      correct: 0,
      rationale: {
        fr: 'Le stop en ATR double en pips ; la taille doit être divisée par deux pour que la perte au stop reste identique. Garder l’ancien stop en pips vous ferait sortir par le simple bruit.',
        en: 'The ATR stop doubles in pips; size must halve so the stop-out loss stays the same. Keeping the old pip stop would get you taken out by noise alone.',
      },
    },
    quiz: [
      {
        q: { fr: 'Premier ajustement en régime nerveux :', en: 'First adjustment in a nervous regime:' },
        options: {
          fr: ['Réduire la taille pour garder le même risque', 'Augmenter le levier', 'Supprimer les stops'],
          en: ['Cut size to keep the same risk', 'Raise leverage', 'Remove stops'],
        },
        correct: 0,
        rationale: {
          fr: 'Le risque par trade en % est la constante ; tout le reste s’adapte autour.',
          en: 'Risk per trade in % is the constant; everything else adapts around it.',
        },
      },
      {
        q: { fr: 'Stratégie la plus exposée en marché qui panique :', en: 'Strategy most exposed in a panicking market:' },
        options: {
          fr: ['Le retour à la moyenne contre le mouvement', 'Ne pas trader', 'Suivre la tendance avec un stop'],
          en: ['Mean reversion against the move', 'Not trading', 'Following the trend with a stop'],
        },
        correct: 0,
        rationale: {
          fr: 'Les « excès » peuvent s’étendre bien au-delà de toute mesure habituelle quand la volatilité explose.',
          en: '“Extremes” can extend far beyond any usual measure when volatility explodes.',
        },
      },
      {
        q: { fr: 'Pourquoi moins de trades en régime nerveux ?', en: 'Why fewer trades in a nervous regime?' },
        options: {
          fr: ['Erreurs et coûts d’exécution plus chers', 'Le marché est fermé', 'Les stops sont interdits'],
          en: ['Mistakes and execution costs are dearer', 'The market is closed', 'Stops are forbidden'],
        },
        correct: 0,
        rationale: {
          fr: 'Spreads plus larges, glissements plus fréquents, faux signaux plus nombreux : la sélectivité devient l’avantage principal.',
          en: 'Wider spreads, more slippage, more false signals: selectivity becomes the main edge.',
        },
      },
    ],
  },
};
