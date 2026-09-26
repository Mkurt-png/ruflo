// Marchés réels — leçons 1 à 5 (Pro). Server-only: paid copy,
// imported only through lesson-content.ts (see no-paid-content-in-bundle.test.ts).

import type { LessonContent } from '../lesson-content';

export const LIVE_A: Record<string, LessonContent> = {
  'live-01': {
    intro: {
      fr: [
        'Avant d’engager de l’argent réel, revérifiez votre courtier avec un œil neuf. Premier critère, non négociable : la régulation. Au Canada, les courtiers en placement sont encadrés par l’OCRI (Organisme canadien de réglementation des investissements), et au Québec par l’Autorité des marchés financiers ; en France, par l’AMF et l’ACPR. Vérifiez l’inscription sur le registre officiel du régulateur, pas sur le site du courtier.',
        'Ensuite, la protection de vos fonds : comptes clients séparés des fonds propres du courtier, fonds de garantie éventuel (le FCPE couvre les clients des membres de l’OCRI au Canada), et, pour les CFD en Europe, protection contre le solde négatif, obligatoire pour les clients particuliers. Un effet de levier très élevé proposé à un particulier est souvent le signe d’un courtier hors de ces cadres.',
        'Enfin, les coûts réels : spread moyen aux heures où vous tradez, commissions, swaps, frais de retrait et d’inactivité. Faites un test concret : déposez un petit montant, passez quelques ordres, puis retirez une partie. Un courtier qui rend un retrait difficile vous dit tout ce que vous devez savoir.',
      ],
      en: [
        'Before committing real money, check your broker again with fresh eyes. The first criterion, non-negotiable: regulation. In Canada, investment dealers are overseen by CIRO (Canadian Investment Regulatory Organization), and in Québec by the Autorité des marchés financiers; in France, by the AMF and the ACPR. Check the registration on the regulator’s official register, not on the broker’s website.',
        'Next, protection of your funds: client accounts segregated from the broker’s own money, any compensation fund (CIPF covers clients of CIRO members in Canada), and, for CFDs in Europe, negative balance protection, mandatory for retail clients. Very high leverage offered to a retail client is often a sign of a broker outside those frameworks.',
        'Finally, real costs: average spread at the hours you trade, commissions, swaps, withdrawal and inactivity fees. Run a concrete test: deposit a small amount, place a few orders, then withdraw part of it. A broker that makes withdrawals difficult tells you everything you need to know.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Un courtier inconnu propose un levier de 1:500 et un bonus de dépôt de 100 %. Il n’apparaît sur aucun registre de régulateur. Décision ?',
        en: 'An unknown broker offers 1:500 leverage and a 100 % deposit bonus. It appears on no regulator’s register. Decision?',
      },
      options: {
        fr: ['Refuser : aucun cadre réglementaire', 'Accepter pour le bonus', 'Tester avec tout son capital'],
        en: ['Refuse: no regulatory framework', 'Accept for the bonus', 'Test with all your capital'],
      },
      correct: 0,
      rationale: {
        fr: 'Sans régulation, aucun recours si les fonds disparaissent. Les bonus de dépôt sont d’ailleurs interdits pour les particuliers par plusieurs régulateurs, précisément parce qu’ils poussent à surtrader.',
        en: 'Without regulation, there is no recourse if funds vanish. Deposit bonuses are banned for retail clients by several regulators, precisely because they encourage overtrading.',
      },
    },
    quiz: [
      {
        q: { fr: 'Où vérifier la régulation d’un courtier ?', en: 'Where do you check a broker’s regulation?' },
        options: {
          fr: ['Sur le registre officiel du régulateur', 'Sur le site du courtier', 'Sur les réseaux sociaux'],
          en: ['On the regulator’s official register', 'On the broker’s site', 'On social media'],
        },
        correct: 0,
        rationale: {
          fr: 'Les faux courtiers affichent volontiers de faux logos de régulateurs. Le registre officiel fait foi.',
          en: 'Fake brokers readily display fake regulator logos. The official register is the reference.',
        },
      },
      {
        q: { fr: 'Des fonds clients « séparés » signifie :', en: '“Segregated” client funds means:' },
        options: {
          fr: ['Distincts de l’argent propre du courtier', 'Placés en bourse par le courtier', 'Non retirables'],
          en: ['Kept apart from the broker’s own money', 'Invested by the broker', 'Non-withdrawable'],
        },
        correct: 0,
        rationale: {
          fr: 'En cas de faillite du courtier, ces fonds ne servent pas à payer ses dettes.',
          en: 'If the broker fails, those funds are not used to pay its debts.',
        },
      },
      {
        q: { fr: 'Le test le plus révélateur d’un courtier :', en: 'The most revealing test of a broker:' },
        options: {
          fr: ['Un petit dépôt suivi d’un retrait', 'Lire ses publicités', 'Compter ses instruments'],
          en: ['A small deposit followed by a withdrawal', 'Reading its ads', 'Counting its instruments'],
        },
        correct: 0,
        rationale: {
          fr: 'Déposer est toujours facile. La qualité d’un courtier se voit au moment de récupérer l’argent.',
          en: 'Depositing is always easy. A broker’s quality shows when you take the money back.',
        },
      },
    ],
  },

  'live-02': {
    intro: {
      fr: [
        'Le compte démo est indispensable pour apprendre une méthode, et trompeur sur un point : il ne reproduit ni l’exécution réelle, ni vous. En démo, les ordres sont souvent exécutés au prix affiché, sans glissement ; en réel, les ordres au marché glissent parfois, surtout autour des annonces.',
        'La différence principale est pourtant psychologique. Perdre 100 $ fictifs ne déclenche rien ; perdre 100 $ réels déclenche exactement les réactions étudiées dans la piste Psychologie : stop déplacé, sortie prématurée, trade de revanche. Beaucoup de traders rentables en démo deviennent perdants en réel sans rien changer à leur méthode — seulement à leur comportement.',
        'Critères de passage raisonnables : un plan écrit, au moins 50 trades démo en suivant ce plan, une adhésion aux règles supérieure à 90 %, et une espérance au moins positive sur cette série. Le résultat compte moins que la discipline : une démo gagnante en violant ses règles ne prouve rien.',
      ],
      en: [
        'A demo account is essential for learning a method, and misleading on one point: it reproduces neither real execution nor you. On demo, orders often fill at the displayed price, with no slippage; live, market orders sometimes slip, especially around news releases.',
        'The main difference, however, is psychological. Losing $100 of play money triggers nothing; losing $100 of real money triggers exactly the reactions studied in the Psychology track: moved stop, premature exit, revenge trade. Many traders profitable on demo become losing traders live without changing their method — only their behaviour.',
        'Reasonable criteria for switching: a written plan, at least 50 demo trades following that plan, rule adherence above 90 %, and at least positive expectancy over that series. The result matters less than the discipline: a winning demo achieved by breaking your rules proves nothing.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Après 50 trades démo : +8 %, mais seulement 70 % des trades respectent le plan. Passage en réel ?',
        en: 'After 50 demo trades: +8 %, but only 70 % of trades follow the plan. Go live?',
      },
      options: {
        fr: ['Pas encore : l’adhésion aux règles est insuffisante', 'Oui, le résultat est positif', 'Oui, avec une taille plus grosse'],
        en: ['Not yet: rule adherence is too low', 'Yes, the result is positive', 'Yes, with a bigger size'],
      },
      correct: 0,
      rationale: {
        fr: 'Un tiers des trades hors plan : le +8 % ne mesure pas votre méthode, il mesure un mélange de méthode et d’improvisation. En réel, c’est l’improvisation qui grossit.',
        en: 'A third of trades off-plan: the +8 % measures not your method but a mix of method and improvisation. Live, it is the improvisation that grows.',
      },
    },
    quiz: [
      {
        q: { fr: 'Principale différence entre démo et réel :', en: 'Main difference between demo and live:' },
        options: {
          fr: ['Votre comportement face aux pertes réelles', 'Les graphiques', 'Les indicateurs disponibles'],
          en: ['Your behaviour facing real losses', 'The charts', 'The available indicators'],
        },
        correct: 0,
        rationale: {
          fr: 'La méthode est identique ; ce qui change, c’est la personne qui l’exécute sous pression.',
          en: 'The method is identical; what changes is the person executing it under pressure.',
        },
      },
      {
        q: { fr: 'Le glissement (slippage) est :', en: 'Slippage is:' },
        options: {
          fr: ['L’écart entre le prix demandé et le prix obtenu', 'Une commission fixe', 'Un bonus du courtier'],
          en: ['The gap between requested and obtained price', 'A fixed commission', 'A broker bonus'],
        },
        correct: 0,
        rationale: {
          fr: 'Rare en démo, fréquent en réel autour des annonces et aux heures de faible liquidité.',
          en: 'Rare on demo, common live around releases and in low-liquidity hours.',
        },
      },
      {
        q: { fr: 'Critère le plus important avant de passer en réel :', en: 'Most important criterion before going live:' },
        options: {
          fr: ['Une adhésion aux règles supérieure à 90 %', 'Un gros gain en démo', 'Une intuition forte'],
          en: ['Rule adherence above 90 %', 'A big demo gain', 'A strong gut feeling'],
        },
        correct: 0,
        rationale: {
          fr: 'La discipline se transfère en réel, un résultat obtenu par chance ne se transfère pas.',
          en: 'Discipline carries over to live trading; a result obtained by luck does not.',
        },
      },
    ],
  },

  'live-03': {
    intro: {
      fr: [
        'Les premiers mois en réel ont un seul objectif : exécuter votre plan avec de l’argent réel, pas gagner de l’argent. Tradez donc la plus petite taille possible — souvent 0,01 lot en forex (un micro-lot), ou une seule action — même si le résultat en dollars paraît dérisoire.',
        'Pourquoi si petit : vous allez faire des erreurs nouvelles, que la démo ne pouvait pas révéler. Mauvais bouton, ordre oublié, stop mal placé, réaction émotionnelle inattendue. Autant qu’elles coûtent quelques dollars plutôt que quelques centaines.',
        'Attendez-vous à des résultats inférieurs à ceux de la démo : frais réels, glissements, et une exécution moins sereine. C’est normal. Le signal à surveiller n’est pas le gain, c’est le pourcentage de trades conformes au plan. Quand il reste au-dessus de 90 % sur plusieurs semaines en réel, vous aurez gagné le droit d’augmenter la taille — progressivement.',
      ],
      en: [
        'The first months live have a single goal: executing your plan with real money, not making money. So trade the smallest size possible — often 0.01 lot in forex (a micro lot), or a single share — even if the dollar result looks trivial.',
        'Why so small: you will make new mistakes the demo could not reveal. Wrong button, forgotten order, misplaced stop, an unexpected emotional reaction. Better they cost a few dollars than a few hundred.',
        'Expect results below your demo’s: real costs, slippage, and less relaxed execution. That is normal. The signal to watch is not profit but the percentage of trades that follow the plan. When it stays above 90 % for several weeks live, you will have earned the right to increase size — gradually.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Premier mois en réel à 0,01 lot : −15 $ au total, 95 % des trades conformes au plan. Bilan ?',
        en: 'First month live at 0.01 lot: −$15 in total, 95 % of trades follow the plan. Assessment?',
      },
      options: {
        fr: ['Réussi : l’objectif était l’exécution', 'Échec : le résultat est négatif', 'Il faut tripler la taille'],
        en: ['Success: the goal was execution', 'Failure: the result is negative', 'Triple the size'],
      },
      correct: 0,
      rationale: {
        fr: 'Un mois de discipline en réel pour 15 $ est un excellent investissement. Sur si peu de trades, le résultat reflète surtout la variance.',
        en: 'A month of live discipline for $15 is an excellent investment. Over so few trades, the result mostly reflects variance.',
      },
    },
    quiz: [
      {
        q: { fr: 'Objectif des premiers mois en réel :', en: 'Goal of the first months live:' },
        options: {
          fr: ['Exécuter le plan avec de l’argent réel', 'Rembourser l’abonnement', 'Doubler le compte'],
          en: ['Executing the plan with real money', 'Paying back the subscription', 'Doubling the account'],
        },
        correct: 0,
        rationale: {
          fr: 'La compétence recherchée est la discipline sous pression réelle ; le gain viendra ensuite, ou pas.',
          en: 'The skill sought is discipline under real pressure; profit comes later, or it does not.',
        },
      },
      {
        q: { fr: 'Un micro-lot en forex correspond à :', en: 'A micro lot in forex is:' },
        options: { fr: ['0,01 lot, soit 1 000 unités', '1 lot', '10 lots'], en: ['0.01 lot, i.e. 1,000 units', '1 lot', '10 lots'] },
        correct: 0,
        rationale: {
          fr: 'Sur EUR/USD, un pip y vaut environ 0,10 $ : de quoi apprendre sans se ruiner.',
          en: 'On EUR/USD a pip is worth about $0.10 there: enough to learn without going broke.',
        },
      },
      {
        q: { fr: 'Quand augmenter la taille ?', en: 'When should you increase size?' },
        options: {
          fr: ['Après plusieurs semaines d’adhésion > 90 % en réel', 'Après un gros gain', 'Dès le deuxième jour'],
          en: ['After several weeks of > 90 % adherence live', 'After a big win', 'From day two'],
        },
        correct: 0,
        rationale: {
          fr: 'La taille récompense la discipline démontrée, pas un résultat isolé.',
          en: 'Size rewards demonstrated discipline, not an isolated result.',
        },
      },
    ],
  },

  'live-04': {
    intro: {
      fr: [
        'Tradez ce que vous savez : uniquement les setups de votre plan, sur les marchés que vous avez étudiés, aux horaires que vous connaissez. Le réel n’est pas le moment d’essayer une figure vue hier dans une vidéo, ni une cryptomonnaie qui monte fort cette semaine.',
        'Chaque marché a sa personnalité : sa volatilité habituelle, ses heures actives, ses réactions aux annonces, ses coûts. Vos statistiques de démo ne valent que pour le marché et le setup où elles ont été mesurées. Changer de marché, c’est repartir de zéro — et ça se fait en démo.',
        'Le « syndrome de l’objet brillant » coûte cher : il remplace une méthode mesurée par une série d’essais non mesurés. Tenez une liste « à tester plus tard » : chaque idée nouvelle y va, puis passe par la démo avec la même exigence que votre méthode principale. Rien ne passe directement en réel.',
      ],
      en: [
        'Trade what you know: only the setups in your plan, on the markets you have studied, at the hours you know. Live trading is not the time to try a pattern seen yesterday in a video, or a cryptocurrency rallying hard this week.',
        'Every market has its own personality: its usual volatility, active hours, reactions to releases, costs. Your demo statistics only hold for the market and setup where they were measured. Switching markets means starting from zero — and that happens on demo.',
        '“Shiny object syndrome” is expensive: it replaces a measured method with a string of unmeasured experiments. Keep a “test later” list: every new idea goes on it, then through demo with the same standard as your main method. Nothing goes straight to live.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Votre plan couvre EUR/USD et GBP/USD. L’or bouge énormément aujourd’hui et vous voyez « une occasion évidente ». Action ?',
        en: 'Your plan covers EUR/USD and GBP/USD. Gold is moving enormously today and you see “an obvious opportunity”. Action?',
      },
      options: {
        fr: ['Noter l’idée sur la liste « à tester », ne pas trader', 'Trader l’or en petite taille', 'Trader l’or en taille normale'],
        en: ['Put the idea on the “test later” list, do not trade', 'Trade gold at small size', 'Trade gold at normal size'],
      },
      correct: 0,
      rationale: {
        fr: 'Vous n’avez aucune statistique sur l’or : ni sa volatilité, ni vos résultats. « Évident » est une sensation, pas une mesure.',
        en: 'You have no statistics on gold: neither its volatility nor your results. “Obvious” is a feeling, not a measurement.',
      },
    },
    quiz: [
      {
        q: { fr: 'Vos statistiques de démo valent :', en: 'Your demo statistics hold:' },
        options: {
          fr: ['Pour le marché et le setup mesurés', 'Pour tous les marchés', 'Pour aucun marché'],
          en: ['For the market and setup measured', 'For every market', 'For no market'],
        },
        correct: 0,
        rationale: {
          fr: 'Un avantage mesuré sur EUR/USD ne dit rien de l’or, du pétrole ou d’une action.',
          en: 'An edge measured on EUR/USD says nothing about gold, oil or a stock.',
        },
      },
      {
        q: { fr: 'Une idée nouvelle passe d’abord par :', en: 'A new idea goes first through:' },
        options: { fr: ['La démo', 'Le réel en petite taille', 'Le réel en grande taille'], en: ['Demo', 'Live at small size', 'Live at large size'] },
        correct: 0,
        rationale: {
          fr: 'Même exigence que pour la méthode principale : plan écrit, série de trades, mesure.',
          en: 'Same standard as the main method: written plan, series of trades, measurement.',
        },
      },
      {
        q: { fr: 'Le « syndrome de l’objet brillant » :', en: '“Shiny object syndrome”:' },
        options: {
          fr: ['Changer sans cesse de méthode ou de marché', 'Trader uniquement l’or', 'Utiliser des graphiques colorés'],
          en: ['Constantly switching method or market', 'Trading only gold', 'Using colourful charts'],
        },
        correct: 0,
        rationale: {
          fr: 'Chaque changement réinitialise l’apprentissage : on n’accumule jamais assez de trades pour savoir ce qui fonctionne.',
          en: 'Every switch resets learning: you never accumulate enough trades to know what works.',
        },
      },
    ],
  },

  'live-05': {
    intro: {
      fr: [
        'En réel, le journal s’enrichit. Gardez les trois lignes de la piste Psychologie — décision, émotion, phrase pour la prochaine fois — et ajoutez les données que la démo ne montrait pas : prix demandé et prix obtenu (le glissement), spread payé, commission, swap, et le risque réel en dollars.',
        'Ajoutez deux captures d’écran : le graphique au moment de l’entrée, avec votre raison tracée dessus, et le graphique à la sortie. Relire un trade avec l’image de ce que vous avez vu vaut mieux que votre souvenir, qui se réécrit en fonction du résultat.',
        'Ces coûts, additionnés sur un mois, surprennent souvent : sur des trades courts, spread et commissions peuvent absorber une part importante du gain brut. Le journal réel vous dit si votre avantage survit aux frais — une question que la démo ne pose jamais sérieusement.',
      ],
      en: [
        'Live, the journal gets richer. Keep the three lines from the Psychology track — decision, emotion, sentence for next time — and add the data demo did not show: price requested and price obtained (slippage), spread paid, commission, swap, and the real risk in dollars.',
        'Add two screenshots: the chart at entry, with your reason drawn on it, and the chart at exit. Reviewing a trade with the image of what you saw beats your memory, which rewrites itself according to the outcome.',
        'Those costs, added up over a month, often surprise: on short trades, spread and commissions can absorb a large share of the gross gain. The live journal tells you whether your edge survives costs — a question demo never seriously asks.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Sur un mois : gains bruts de 400 $, spreads et commissions de 260 $. Que révèle le journal ?',
        en: 'Over a month: $400 gross gains, $260 in spreads and commissions. What does the journal reveal?',
      },
      options: {
        fr: ['Les coûts absorbent 65 % du gain : l’avantage est fragile', 'Un mois excellent', 'Les coûts sont négligeables'],
        en: ['Costs absorb 65 % of the gain: the edge is fragile', 'An excellent month', 'Costs are negligible'],
      },
      correct: 0,
      rationale: {
        fr: '260 / 400 = 65 %. Il reste 140 $ net. Moins de trades, des objectifs plus larges ou un courtier moins cher pourraient changer la donne.',
        en: '260 / 400 = 65 %. $140 net remains. Fewer trades, wider targets or a cheaper broker could change the picture.',
      },
    },
    quiz: [
      {
        q: { fr: 'Donnée à ajouter en réel :', en: 'Data to add live:' },
        options: {
          fr: ['Le glissement entre prix demandé et obtenu', 'La météo', 'Le nombre d’indicateurs'],
          en: ['Slippage between requested and obtained price', 'The weather', 'The number of indicators'],
        },
        correct: 0,
        rationale: {
          fr: 'C’est un coût réel, invisible en démo, qui s’additionne trade après trade.',
          en: 'It is a real cost, invisible on demo, that adds up trade after trade.',
        },
      },
      {
        q: { fr: 'Pourquoi des captures d’écran ?', en: 'Why screenshots?' },
        options: {
          fr: ['La mémoire se réécrit selon le résultat', 'Pour les réseaux sociaux', 'C’est obligatoire'],
          en: ['Memory rewrites itself according to the outcome', 'For social media', 'It is mandatory'],
        },
        correct: 0,
        rationale: {
          fr: 'Après un gain, on se souvient d’un setup parfait ; après une perte, d’un setup douteux. L’image ne change pas.',
          en: 'After a win you remember a perfect setup; after a loss, a doubtful one. The image does not change.',
        },
      },
      {
        q: { fr: 'La question que seul le journal réel tranche :', en: 'The question only the live journal settles:' },
        options: {
          fr: ['L’avantage survit-il aux frais ?', 'Quel indicateur est le plus joli ?', 'Quelle heure est-il ?'],
          en: ['Does the edge survive costs?', 'Which indicator looks best?', 'What time is it?'],
        },
        correct: 0,
        rationale: {
          fr: 'Une stratégie gagnante avant frais et perdante après est une stratégie perdante.',
          en: 'A strategy that wins before costs and loses after them is a losing strategy.',
        },
      },
    ],
  },
};
