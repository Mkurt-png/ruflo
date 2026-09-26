// Marchés réels — leçons 6 à 10 (Pro). Server-only: paid copy,
// imported only through lesson-content.ts (see no-paid-content-in-bundle.test.ts).
//
// live-09 (taxes) states obligations and principles only, never rates:
// rates change with every budget, and a wrong figure here would be advice.

import type { LessonContent } from '../lesson-content';

export const LIVE_B: Record<string, LessonContent> = {
  'live-06': {
    intro: {
      fr: [
        'Une fois par semaine, à heure fixe, marché fermé : la revue hebdomadaire. Trente minutes pour regarder la semaine comme un gestionnaire regarde un employé — vous. Pas pour se juger, pour mesurer.',
        'Les chiffres de base : nombre de trades, taux de réussite, gain moyen et perte moyenne en R, espérance par trade (taux de réussite × gain moyen − taux d’échec × perte moyenne), et surtout le pourcentage de trades conformes au plan. Puis une question qualitative : quelle a été l’erreur la plus coûteuse, et se répète-t-elle ?',
        'La revue se termine par une seule décision : au maximum un changement pour la semaine suivante. Changer trois choses à la fois empêche de savoir laquelle a eu un effet. Et une semaine ne suffit pas à juger une méthode : la revue surveille surtout l’exécution ; la méthode se juge sur des dizaines de trades.',
      ],
      en: [
        'Once a week, at a fixed time, with the market closed: the weekly review. Thirty minutes to look at the week the way a manager looks at an employee — you. Not to judge, to measure.',
        'The basic figures: number of trades, hit rate, average win and average loss in R, expectancy per trade (hit rate × average win − loss rate × average loss), and above all the percentage of trades that followed the plan. Then one qualitative question: what was the costliest mistake, and does it repeat?',
        'The review ends with a single decision: at most one change for the following week. Changing three things at once makes it impossible to know which had an effect. And one week is not enough to judge a method: the review mainly monitors execution; the method is judged over dozens of trades.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Semaine : 10 trades, 4 gagnants à +2R en moyenne, 6 perdants à −1R. Quelle est l’espérance par trade ?',
        en: 'Week: 10 trades, 4 winners averaging +2R, 6 losers at −1R. What is the expectancy per trade?',
      },
      options: { fr: ['+0,2R', '−0,2R', '+0,8R'], en: ['+0.2R', '−0.2R', '+0.8R'] },
      correct: 0,
      rationale: {
        fr: '0,4 × 2 − 0,6 × 1 = 0,8 − 0,6 = +0,2R par trade. Avec seulement 40 % de réussite, l’espérance reste positive grâce au rapport gain/perte.',
        en: '0.4 × 2 − 0.6 × 1 = 0.8 − 0.6 = +0.2R per trade. With only a 40 % hit rate, expectancy stays positive thanks to the win/loss ratio.',
      },
    },
    quiz: [
      {
        q: { fr: 'Chiffre le plus important de la revue :', en: 'Most important figure in the review:' },
        options: {
          fr: ['Le pourcentage de trades conformes au plan', 'Le P&L de la semaine', 'Le nombre de trades'],
          en: ['Percentage of trades following the plan', 'The week’s P&L', 'Number of trades'],
        },
        correct: 0,
        rationale: {
          fr: 'Sur une semaine, le P&L est surtout de la variance. L’adhésion au plan, elle, dépend entièrement de vous.',
          en: 'Over a week, P&L is mostly variance. Plan adherence depends entirely on you.',
        },
      },
      {
        q: { fr: 'Combien de changements après une revue ?', en: 'How many changes after a review?' },
        options: { fr: ['Un au maximum', 'Autant que nécessaire', 'Tous les paramètres'], en: ['One at most', 'As many as needed', 'Every parameter'] },
        correct: 0,
        rationale: {
          fr: 'Un changement à la fois permet de mesurer son effet.',
          en: 'One change at a time lets you measure its effect.',
        },
      },
      {
        q: { fr: 'Une semaine perdante avec 100 % de trades conformes :', en: 'A losing week with 100 % plan adherence:' },
        options: {
          fr: ['Bonne semaine d’exécution', 'Il faut changer la méthode', 'Il faut doubler la taille'],
          en: ['A good execution week', 'The method must change', 'Double the size'],
        },
        correct: 0,
        rationale: {
          fr: 'Une méthode à espérance positive a des semaines perdantes. On la juge sur des dizaines de trades, pas sur cinq jours.',
          en: 'A positive-expectancy method has losing weeks. You judge it over dozens of trades, not five days.',
        },
      },
    ],
  },

  'live-07': {
    intro: {
      fr: [
        'Presque tous les traders traversent des plateaux : des semaines, parfois des mois, sans progrès visible. Deux phénomènes s’y mélangent. L’apprentissage n’est pas linéaire — on progresse par paliers. Et la variance crée des séries de pertes même avec une méthode saine.',
        'Un exemple chiffré : avec 50 % de réussite, la probabilité de perdre 5 trades d’affilée à partir d’un moment donné est de 1 sur 32. Sur quelques centaines de trades, voir au moins une série de 5, 6 ou 7 pertes consécutives devient très probable. Ce n’est pas un signe que la méthode est cassée ; c’est la statistique normale.',
        'Pendant un plateau, la tentation est de tout changer. Résistez : vérifiez d’abord l’adhésion au plan et les conditions de marché (le régime a-t-il changé ?). Si les deux sont bons, la bonne décision est souvent de continuer, en petite taille, et de laisser la série de trades s’allonger. La patience fait partie de la méthode.',
      ],
      en: [
        'Nearly every trader goes through plateaus: weeks, sometimes months, without visible progress. Two things mix there. Learning is not linear — you progress in steps. And variance creates losing streaks even with a sound method.',
        'A worked example: with a 50 % hit rate, the probability of losing 5 trades in a row from any given point is 1 in 32. Over a few hundred trades, seeing at least one streak of 5, 6 or 7 consecutive losses becomes very likely. It is not a sign the method is broken; it is ordinary statistics.',
        'During a plateau, the temptation is to change everything. Resist it: first check plan adherence and market conditions (has the regime changed?). If both are fine, the right decision is often to continue, at small size, and let the series of trades grow longer. Patience is part of the method.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Avec 50 % de réussite, quelle est la probabilité que les 4 prochains trades soient tous perdants ?',
        en: 'With a 50 % hit rate, what is the probability that the next 4 trades are all losers?',
      },
      options: { fr: ['1 sur 16', '1 sur 4', '1 sur 100'], en: ['1 in 16', '1 in 4', '1 in 100'] },
      correct: 0,
      rationale: {
        fr: '0,5 × 0,5 × 0,5 × 0,5 = 0,0625, soit 1 sur 16. Assez fréquent pour arriver plusieurs fois par an à un trader actif.',
        en: '0.5 × 0.5 × 0.5 × 0.5 = 0.0625, or 1 in 16. Frequent enough to happen several times a year to an active trader.',
      },
    },
    quiz: [
      {
        q: { fr: 'Une série de 6 pertes avec une méthode à 50 % :', en: 'A streak of 6 losses with a 50 % method:' },
        options: {
          fr: ['Peut arriver normalement sur quelques centaines de trades', 'Prouve que la méthode est cassée', 'Est impossible'],
          en: ['Can happen normally over a few hundred trades', 'Proves the method is broken', 'Is impossible'],
        },
        correct: 0,
        rationale: {
          fr: 'Les séries longues font partie de toute distribution aléatoire. C’est pour elles qu’on risque 1 % et pas 10 %.',
          en: 'Long streaks are part of any random distribution. That is why you risk 1 %, not 10 %.',
        },
      },
      {
        q: { fr: 'Pendant un plateau, vérifier d’abord :', en: 'During a plateau, check first:' },
        options: {
          fr: ['L’adhésion au plan et le régime de marché', 'Les nouvelles stratégies en vogue', 'Le solde du compte d’un ami'],
          en: ['Plan adherence and market regime', 'Trendy new strategies', 'A friend’s account balance'],
        },
        correct: 0,
        rationale: {
          fr: 'Si vous suivez le plan et que le régime convient à la méthode, le plateau est probablement de la variance.',
          en: 'If you follow the plan and the regime suits the method, the plateau is probably variance.',
        },
      },
      {
        q: { fr: 'Pourquoi l’apprentissage progresse-t-il par paliers ?', en: 'Why does learning progress in steps?' },
        options: {
          fr: ['Les compétences se consolident avant de se voir', 'Parce que le marché le décide', 'Ce n’est pas le cas'],
          en: ['Skills consolidate before they show', 'Because the market decides', 'It does not'],
        },
        correct: 0,
        rationale: {
          fr: 'Beaucoup de progrès sont invisibles dans le P&L avant de devenir des automatismes.',
          en: 'Much progress is invisible in P&L before it turns into habit.',
        },
      },
    ],
  },

  'live-08': {
    intro: {
      fr: [
        'Augmenter la taille est une décision de gestion, pas une récompense. Les critères doivent être écrits avant : par exemple, au moins 100 trades en réel, une espérance positive après frais, et une adhésion au plan supérieure à 90 % sur cette période.',
        'Augmentez par petites marches : passer de 0,5 % à 0,75 % de risque par trade, pas de 0,5 % à 2 %. Chaque palier réveille des émotions nouvelles — une perte de 150 $ ne se vit pas comme une perte de 50 $. Donnez-vous quelques semaines à chaque palier pour vérifier que l’exécution tient.',
        'Prévoyez aussi la règle inverse : redescendre d’un palier après un drawdown défini à l’avance, par exemple 10 % depuis le plus haut du compte. Réduire la taille en période difficile n’est pas un aveu d’échec ; c’est ce qui vous garde en jeu assez longtemps pour que votre avantage s’exprime.',
      ],
      en: [
        'Increasing size is a management decision, not a reward. The criteria must be written beforehand: for example, at least 100 live trades, positive expectancy after costs, and plan adherence above 90 % over that period.',
        'Step up in small increments: from 0.5 % to 0.75 % risk per trade, not from 0.5 % to 2 %. Each step wakes up new emotions — a $150 loss does not feel like a $50 loss. Give yourself a few weeks at each step to check that execution holds.',
        'Plan the reverse rule as well: step back down after a drawdown defined in advance, for example 10 % from the account’s peak. Cutting size during a difficult period is not an admission of failure; it is what keeps you in the game long enough for your edge to play out.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Après 3 semaines très gagnantes (35 trades), vous voulez passer de 0,5 % à 2 % de risque. Selon des critères prudents :',
        en: 'After 3 very profitable weeks (35 trades), you want to go from 0.5 % to 2 % risk. Under prudent criteria:',
      },
      options: {
        fr: ['Non : trop peu de trades et un saut trop grand', 'Oui, les résultats le justifient', 'Oui, et même 5 %'],
        en: ['No: too few trades and too big a jump', 'Yes, the results justify it', 'Yes, and even 5 %'],
      },
      correct: 0,
      rationale: {
        fr: '35 trades ne suffisent pas à distinguer un avantage de la chance, et quadrupler le risque d’un coup expose à une réaction émotionnelle que vous n’avez jamais vécue.',
        en: '35 trades are not enough to tell an edge from luck, and quadrupling risk at once exposes you to an emotional reaction you have never experienced.',
      },
    },
    quiz: [
      {
        q: { fr: 'Augmenter la taille se fait :', en: 'Increasing size should be done:' },
        options: {
          fr: ['Par petites marches, selon des critères écrits', 'Après une bonne journée', 'Pour rattraper une perte'],
          en: ['In small steps, per written criteria', 'After a good day', 'To recover a loss'],
        },
        correct: 0,
        rationale: {
          fr: 'Des critères écrits empêchent l’euphorie ou la frustration de décider à votre place.',
          en: 'Written criteria stop euphoria or frustration from deciding for you.',
        },
      },
      {
        q: { fr: 'Pourquoi rester plusieurs semaines à chaque palier ?', en: 'Why stay several weeks at each step?' },
        options: {
          fr: ['Vérifier que l’exécution tient avec des montants plus gros', 'Pour payer moins d’impôts', 'Aucune raison'],
          en: ['Check that execution holds with bigger amounts', 'To pay less tax', 'No reason'],
        },
        correct: 0,
        rationale: {
          fr: 'La même méthode peut être mal exécutée à une taille qui fait peur.',
          en: 'The same method can be poorly executed at a size that scares you.',
        },
      },
      {
        q: { fr: 'Règle inverse recommandée :', en: 'Recommended reverse rule:' },
        options: {
          fr: ['Redescendre d’un palier après un drawdown défini', 'Ne jamais réduire', 'Doubler après un drawdown'],
          en: ['Step down after a defined drawdown', 'Never reduce', 'Double after a drawdown'],
        },
        correct: 0,
        rationale: {
          fr: 'Réduire en difficulté limite l’asymétrie des pertes vue dans la piste Gestion du risque.',
          en: 'Cutting size in hard times limits the loss asymmetry seen in the Risk management track.',
        },
      },
    ],
  },

  'live-09': {
    intro: {
      fr: [
        'Cette leçon donne une vue d’ensemble, pas un conseil fiscal : les règles dépendent de votre pays, de votre province, de l’instrument tradé et de votre situation, et elles changent régulièrement. Pour votre cas précis, consultez un fiscaliste ou un comptable. Ce qui suit vous aide à lui poser les bonnes questions.',
        'Au Canada, l’Agence du revenu du Canada peut traiter vos gains comme des gains en capital (dont seule une partie est imposable) ou comme un revenu d’entreprise (imposable en totalité), selon notamment la fréquence de vos opérations, leur durée, le temps que vous y consacrez et votre niveau de connaissance. Au Québec, vous déclarez aussi à Revenu Québec. Si vous détenez des biens à l’étranger — un compte chez un courtier étranger, par exemple — dont le coût total dépasse 100 000 $ CA, le formulaire T1135 est obligatoire.',
        'En France, les gains sur instruments financiers sont en principe soumis au prélèvement forfaitaire unique, sauf option pour le barème progressif, et le régime exact dépend de l’instrument. Tout compte ouvert à l’étranger, y compris chez un courtier en ligne, doit être déclaré chaque année (formulaire 3916), sous peine d’amende. Partout : conservez tous vos relevés et confirmations d’opérations, et ne comptez pas sur votre mémoire au moment de déclarer.',
      ],
      en: [
        'This lesson gives an overview, not tax advice: the rules depend on your country, your province, the instrument traded and your situation, and they change regularly. For your specific case, consult a tax professional or an accountant. What follows helps you ask them the right questions.',
        'In Canada, the Canada Revenue Agency may treat your gains as capital gains (only part of which is taxable) or as business income (fully taxable), depending on factors such as how often you trade, how long you hold, the time you devote to it and your level of knowledge. In Québec you also file with Revenu Québec. If you hold foreign property — an account with a foreign broker, for example — with a total cost above CA$100,000, form T1135 is mandatory.',
        'In France, gains on financial instruments are in principle subject to the flat tax (prélèvement forfaitaire unique) unless you opt for the progressive scale, and the exact regime depends on the instrument. Every account opened abroad, including with an online broker, must be declared each year (form 3916), with fines for failing to do so. Everywhere: keep all your statements and trade confirmations, and do not rely on memory when it is time to file.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Vous résidez en France et ouvrez un compte chez un courtier en ligne basé à l’étranger. Obligation déclarative ?',
        en: 'You live in France and open an account with an online broker based abroad. Reporting obligation?',
      },
      options: {
        fr: ['Déclarer le compte chaque année (formulaire 3916)', 'Aucune, c’est un compte en ligne', 'Seulement si vous êtes gagnant'],
        en: ['Declare the account each year (form 3916)', 'None, it is an online account', 'Only if you are profitable'],
      },
      correct: 0,
      rationale: {
        fr: 'L’obligation porte sur l’existence du compte, pas sur son résultat. Un compte perdant non déclaré peut être sanctionné.',
        en: 'The obligation covers the account’s existence, not its result. An undeclared losing account can still be penalised.',
      },
    },
    quiz: [
      {
        q: { fr: 'Au Canada, ce qui peut faire traiter vos gains comme revenu d’entreprise :', en: 'In Canada, what can make gains count as business income:' },
        options: {
          fr: ['Une activité fréquente et organisée', 'Le fait d’utiliser un ordinateur', 'Un seul trade par an'],
          en: ['Frequent, organised activity', 'Using a computer', 'A single trade a year'],
        },
        correct: 0,
        rationale: {
          fr: 'L’ARC regarde l’ensemble du comportement : fréquence, durée de détention, temps consacré, connaissances.',
          en: 'The CRA looks at overall behaviour: frequency, holding period, time spent, knowledge.',
        },
      },
      {
        q: { fr: 'Pourquoi conserver tous les relevés ?', en: 'Why keep every statement?' },
        options: {
          fr: ['Pour déclarer correctement et justifier en cas de contrôle', 'Par nostalgie', 'Ce n’est pas utile'],
          en: ['To file correctly and justify in an audit', 'Out of nostalgia', 'It is not useful'],
        },
        correct: 0,
        rationale: {
          fr: 'Le calcul des gains et pertes se fait opération par opération ; sans pièces, il devient impossible à prouver.',
          en: 'Gains and losses are computed trade by trade; without records, they cannot be proven.',
        },
      },
      {
        q: { fr: 'Pour votre situation précise :', en: 'For your specific situation:' },
        options: {
          fr: ['Consulter un fiscaliste ou un comptable', 'Suivre un forum', 'Deviner'],
          en: ['Consult a tax professional or accountant', 'Follow a forum', 'Guess'],
        },
        correct: 0,
        rationale: {
          fr: 'Les règles varient et évoluent. Une consultation coûte peu comparée à une erreur de déclaration.',
          en: 'Rules vary and change. A consultation costs little compared with a filing mistake.',
        },
      },
    ],
  },

  'live-10': {
    intro: {
      fr: [
        'Le trading sollicite fortement le système nerveux : incertitude permanente, argent en jeu, résultats visibles en temps réel. Sur la durée, il peut dégrader le sommeil, l’humeur et les relations. Le traiter comme une activité à gérer — avec des horaires, des pauses et des jours off — fait partie de la méthode.',
        'Règles simples : des horaires fixes, sans consulter les positions en dehors ; au moins un jour complet par semaine sans graphiques ; des pauses courtes toutes les heures ; et une coupure d’une ou deux semaines après une période de drawdown ou de fatigue. Votre valeur personnelle ne se mesure pas au solde du compte.',
        'Certains signes ressemblent à ceux du jeu excessif : trader pour « se refaire », cacher ses pertes à ses proches, emprunter pour déposer, ne plus pouvoir s’arrêter malgré l’envie. Si vous en reconnaissez plusieurs, arrêtez de trader et parlez-en — à un proche, à votre médecin, ou à une ligne d’aide spécialisée ; il en existe de gratuites et confidentielles au Canada comme en France. Demander de l’aide est une décision de gestion du risque, la plus importante de toutes.',
      ],
      en: [
        'Trading strains the nervous system: constant uncertainty, money at stake, results visible in real time. Over time it can erode sleep, mood and relationships. Treating it as an activity to manage — with set hours, breaks and days off — is part of the method.',
        'Simple rules: fixed hours, with no checking positions outside them; at least one full day a week without charts; short breaks every hour; and a one- or two-week pause after a period of drawdown or fatigue. Your personal worth is not measured by your account balance.',
        'Some signs resemble those of problem gambling: trading to “win it back”, hiding losses from people close to you, borrowing to deposit, being unable to stop despite wanting to. If you recognise several, stop trading and talk about it — to someone close, to your doctor, or to a specialised helpline; free, confidential ones exist in Canada and in France. Asking for help is a risk-management decision, the most important of all.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Depuis un mois, vous dormez mal, vérifiez vos positions la nuit et avez emprunté pour renflouer le compte. Décision ?',
        en: 'For a month you have slept badly, checked positions at night and borrowed to top up the account. Decision?',
      },
      options: {
        fr: ['Arrêter de trader et en parler à quelqu’un', 'Trader plus pour rembourser vite', 'Cacher la situation le temps de se refaire'],
        en: ['Stop trading and talk to someone', 'Trade more to repay quickly', 'Hide it until you win it back'],
      },
      correct: 0,
      rationale: {
        fr: 'Emprunter pour trader et perdre le sommeil sont des signaux d’alerte sérieux. La priorité n’est plus le marché, c’est vous.',
        en: 'Borrowing to trade and losing sleep are serious warning signs. The priority is no longer the market, it is you.',
      },
    },
    quiz: [
      {
        q: { fr: 'Une bonne règle d’hygiène de trading :', en: 'A good trading-hygiene rule:' },
        options: {
          fr: ['Au moins un jour par semaine sans graphiques', 'Vérifier ses positions la nuit', 'Trader tous les jours sans exception'],
          en: ['At least one day a week without charts', 'Checking positions at night', 'Trading every day without exception'],
        },
        correct: 0,
        rationale: {
          fr: 'La récupération fait partie de la performance, comme pour un athlète.',
          en: 'Recovery is part of performance, as for an athlete.',
        },
      },
      {
        q: { fr: 'Signe qui ressemble au jeu excessif :', en: 'A sign resembling problem gambling:' },
        options: {
          fr: ['Emprunter pour déposer sur son compte', 'Tenir un journal', 'Faire une revue hebdomadaire'],
          en: ['Borrowing to fund your account', 'Keeping a journal', 'Doing a weekly review'],
        },
        correct: 0,
        rationale: {
          fr: 'Trader avec de l’argent emprunté pour compenser des pertes est un signal d’alerte majeur.',
          en: 'Trading borrowed money to make up for losses is a major warning sign.',
        },
      },
      {
        q: { fr: 'Demander de l’aide est :', en: 'Asking for help is:' },
        options: {
          fr: ['Une décision de gestion du risque', 'Un aveu de faiblesse', 'Inutile'],
          en: ['A risk-management decision', 'An admission of weakness', 'Pointless'],
        },
        correct: 0,
        rationale: {
          fr: 'Protéger sa santé, c’est protéger la seule ressource qu’aucun stop ne remplace.',
          en: 'Protecting your health protects the one resource no stop can replace.',
        },
      },
    ],
  },
};
