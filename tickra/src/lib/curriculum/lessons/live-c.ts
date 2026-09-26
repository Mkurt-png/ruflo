// Marchés réels — leçons 11 à 14 (Pro). Server-only: paid copy,
// imported only through lesson-content.ts (see no-paid-content-in-bundle.test.ts).
//
// live-14 describes the diploma for what it is — a certificate of completion:
// it unlocks when every lesson is completed (quiz answered, not necessarily
// passed), and public verification links exist per track certificate, not for
// the diploma itself. It also says plainly what the diploma is not.

import type { LessonContent } from '../lesson-content';

export const LIVE_C: Record<string, LessonContent> = {
  'live-11': {
    intro: {
      fr: [
        'Votre capital de trading grandit de deux façons : par les gains réinvestis, et par de l’argent ajouté. Les deux sont légitimes à une condition — que la décision soit prise à froid, selon des critères, jamais pour compenser une perte ou « accélérer » après une bonne série.',
        'Séparez clairement les poches : l’argent de vos dépenses courantes, votre épargne de sécurité, et le capital de trading, qui doit pouvoir être perdu sans changer votre vie. Ne tradez jamais de l’argent dont vous aurez besoin dans les prochains mois, ni de l’argent emprunté.',
        'Décidez aussi d’une politique de retrait, par exemple retirer une partie des gains chaque trimestre. Cela transforme des chiffres sur un écran en résultats réels, et limite la tentation d’augmenter la taille au-delà de ce que vos critères autorisent. Méfiez-vous enfin des offres qui promettent un gros capital contre des frais d’évaluation : lisez les règles en entier, et comptez le coût des échecs possibles.',
      ],
      en: [
        'Your trading capital grows in two ways: reinvested gains, and money added. Both are legitimate on one condition — the decision is made calmly, by criteria, never to make up for a loss or to “speed things up” after a good run.',
        'Keep the pots clearly separate: money for day-to-day spending, your emergency savings, and trading capital, which must be losable without changing your life. Never trade money you will need in the coming months, nor borrowed money.',
        'Decide on a withdrawal policy too, for example taking out part of the gains every quarter. It turns numbers on a screen into real results, and curbs the temptation to raise size beyond what your criteria allow. Finally, be wary of offers promising large capital in exchange for evaluation fees: read the rules in full, and count the cost of possible failures.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Votre compte a perdu 15 % ce mois-ci. Vous envisagez d’y ajouter 2 000 $ pour « revenir à flot » plus vite. Décision ?',
        en: 'Your account lost 15 % this month. You are considering adding $2,000 to get “back afloat” faster. Decision?',
      },
      options: {
        fr: ['Non : on n’ajoute pas de capital pour compenser une perte', 'Oui, pour récupérer plus vite', 'Oui, et doubler la taille'],
        en: ['No: you do not add capital to offset a loss', 'Yes, to recover faster', 'Yes, and double size'],
      },
      correct: 0,
      rationale: {
        fr: 'Ajouter de l’argent après une perte, c’est laisser la perte décider. Après un drawdown de 15 %, votre plan dit plutôt de réduire la taille et d’analyser la cause.',
        en: 'Adding money after a loss lets the loss decide. After a 15 % drawdown, your plan says instead to reduce size and analyse the cause.',
      },
    },
    quiz: [
      {
        q: { fr: 'Le capital de trading doit être :', en: 'Trading capital should be:' },
        options: {
          fr: ['De l’argent qu’on peut perdre sans changer sa vie', 'L’épargne de sécurité', 'De l’argent emprunté'],
          en: ['Money you can lose without changing your life', 'Your emergency savings', 'Borrowed money'],
        },
        correct: 0,
        rationale: {
          fr: 'Trader de l’argent nécessaire ajoute une pression qui dégrade chaque décision.',
          en: 'Trading money you need adds pressure that degrades every decision.',
        },
      },
      {
        q: { fr: 'Intérêt d’une politique de retrait :', en: 'Benefit of a withdrawal policy:' },
        options: {
          fr: ['Matérialiser les gains et freiner la surexposition', 'Payer moins de spread', 'Aucun'],
          en: ['Realising gains and curbing overexposure', 'Paying less spread', 'None'],
        },
        correct: 0,
        rationale: {
          fr: 'Un gain retiré ne peut plus être reperdu, et un compte qui ne gonfle pas indéfiniment limite la taille des positions.',
          en: 'A withdrawn gain cannot be lost again, and an account that does not swell indefinitely limits position size.',
        },
      },
      {
        q: { fr: 'Avant de payer des frais d’évaluation pour un compte financé :', en: 'Before paying evaluation fees for a funded account:' },
        options: {
          fr: ['Lire toutes les règles et compter le coût des échecs', 'Payer vite avant la fin de l’offre', 'Ne rien lire'],
          en: ['Read all the rules and count the cost of failures', 'Pay fast before the offer ends', 'Read nothing'],
        },
        correct: 0,
        rationale: {
          fr: 'Limites de perte strictes, délais, restrictions : chaque règle réduit vos chances de réussir, et chaque échec coûte des frais.',
          en: 'Strict loss limits, deadlines, restrictions: each rule lowers your odds of passing, and each failure costs fees.',
        },
      },
    ],
  },

  'live-12': {
    intro: {
      fr: [
        'Savoir s’arrêter est une compétence, et elle se prépare à l’avance, par écrit. Définissez maintenant, à froid, deux seuils : un seuil d’audit (par exemple un drawdown de 20 % du capital de trading : on arrête, on analyse, on reprend en démo) et un seuil d’arrêt (par exemple 30 %, ou six mois en réel sans espérance positive malgré une adhésion au plan supérieure à 90 %).',
        'Pourquoi à l’avance : pendant un drawdown, un biais puissant pousse à continuer — le coût irrécupérable. « J’ai déjà mis tant de temps et d’argent, je ne peux pas arrêter maintenant. » Ce raisonnement regarde le passé ; la seule question utile regarde l’avenir : avec ce que je sais aujourd’hui, est-ce que je commencerais ?',
        'Arrêter n’est pas échouer. Les compétences acquises — gestion du risque, discipline, lecture des marchés, connaissance de soi — restent utiles pour investir à long terme, gérer son épargne ou simplement éviter les pièges financiers. Beaucoup de gens gagnent davantage en investissant simplement qu’en tradant activement, et c’est une conclusion parfaitement respectable.',
      ],
      en: [
        'Knowing when to stop is a skill, and it is prepared in advance, in writing. Define two thresholds now, calmly: an audit threshold (for example a 20 % drawdown of trading capital: stop, analyse, resume on demo) and a stop threshold (for example 30 %, or six months live without positive expectancy despite plan adherence above 90 %).',
        'Why in advance: during a drawdown, a powerful bias pushes you to keep going — the sunk cost. “I have already put in so much time and money, I cannot stop now.” That reasoning looks at the past; the only useful question looks ahead: knowing what I know today, would I start?',
        'Stopping is not failing. The skills you have built — risk management, discipline, reading markets, self-knowledge — remain useful for long-term investing, managing savings or simply avoiding financial traps. Many people earn more by investing simply than by trading actively, and that is a perfectly respectable conclusion.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Six mois en réel, adhésion au plan de 95 %, espérance négative après frais. Votre seuil d’arrêt écrit correspond exactement à ce cas. Vous :',
        en: 'Six months live, 95 % plan adherence, negative expectancy after costs. Your written stop threshold matches this case exactly. You:',
      },
      options: {
        fr: ['Appliquez la règle : arrêt et retour en démo ou fin', 'Continuez, l’argent déjà perdu doit revenir', 'Doublez la taille'],
        en: ['Apply the rule: stop and return to demo, or end', 'Continue, the money already lost must come back', 'Double the size'],
      },
      correct: 0,
      rationale: {
        fr: 'Avec une bonne exécution, une espérance négative sur six mois met en cause la méthode elle-même. « L’argent déjà perdu » est le coût irrécupérable : il ne reviendra pas en continuant.',
        en: 'With good execution, negative expectancy over six months calls the method itself into question. “Money already lost” is the sunk cost: continuing will not bring it back.',
      },
    },
    quiz: [
      {
        q: { fr: 'Le biais du coût irrécupérable pousse à :', en: 'The sunk-cost bias pushes you to:' },
        options: {
          fr: ['Continuer à cause de ce qui est déjà investi', 'Arrêter trop tôt', 'Diversifier'],
          en: ['Keep going because of what is already invested', 'Stop too early', 'Diversify'],
        },
        correct: 0,
        rationale: {
          fr: 'Le passé est perdu quoi qu’on fasse ; seule compte la suite.',
          en: 'The past is gone whatever you do; only what comes next matters.',
        },
      },
      {
        q: { fr: 'Quand fixer ses seuils d’arrêt ?', en: 'When should you set stop thresholds?' },
        options: { fr: ['Maintenant, à froid', 'Pendant un drawdown', 'Jamais'], en: ['Now, calmly', 'During a drawdown', 'Never'] },
        correct: 0,
        rationale: {
          fr: 'Pendant un drawdown, le jugement est biaisé par l’espoir de se refaire.',
          en: 'During a drawdown, judgement is biased by the hope of winning it back.',
        },
      },
      {
        q: { fr: 'Arrêter le trading actif :', en: 'Stopping active trading:' },
        options: {
          fr: ['Peut être une conclusion rationnelle et respectable', 'Est toujours un échec', 'Est interdit'],
          en: ['Can be a rational, respectable conclusion', 'Is always a failure', 'Is forbidden'],
        },
        correct: 0,
        rationale: {
          fr: 'Les compétences restent, et investir simplement sur le long terme est souvent plus rentable pour beaucoup de gens.',
          en: 'The skills remain, and simple long-term investing is often more profitable for many people.',
        },
      },
    ],
  },

  'live-13': {
    intro: {
      fr: [
        'Exercice : rédigez votre plan pour le premier mois en réel. Il tient sur une page et reprend votre plan de trading (piste Psychologie), avec des règles propres à ce mois de démarrage.',
        'Structure attendue : marchés (un ou deux) et horaires ; setups autorisés, avec leur check-list ; taille (la plus petite possible, par exemple 0,01 lot) et risque par trade ; limite de perte journalière et règle des deux écarts ; nombre maximal de trades par jour ; revue hebdomadaire à heure fixe ; critères pour passer au mois 2 (par exemple adhésion au plan supérieure à 90 %, et aucune violation de la limite journalière).',
        'Remarquez ce qui n’y figure pas : aucun objectif de gain. Le premier mois se juge sur l’exécution. Écrivez votre plan maintenant, datez-le, et relisez-le chaque matin avant d’ouvrir la plateforme.',
      ],
      en: [
        'Drill: write your plan for your first month live. It fits on one page and builds on your trading plan (Psychology track), with rules specific to this starting month.',
        'Expected structure: markets (one or two) and hours; allowed setups, with their checklist; size (the smallest possible, e.g. 0.01 lot) and risk per trade; daily loss limit and the two-deviation rule; maximum number of trades per day; weekly review at a fixed time; criteria for moving on to month 2 (e.g. plan adherence above 90 %, and no breach of the daily limit).',
        'Notice what is not there: no profit target. The first month is judged on execution. Write your plan now, date it, and reread it every morning before opening the platform.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Quel élément n’a pas sa place dans le plan du premier mois ?',
        en: 'Which item does not belong in the first-month plan?',
      },
      options: {
        fr: ['Un objectif de gain de 10 %', 'Une limite de perte journalière', 'Une revue hebdomadaire à heure fixe'],
        en: ['A 10 % profit target', 'A daily loss limit', 'A weekly review at a fixed time'],
      },
      correct: 0,
      rationale: {
        fr: 'Un objectif de gain pousse à forcer des trades pour l’atteindre. Le premier mois se mesure à l’exécution, pas au résultat.',
        en: 'A profit target pushes you to force trades to reach it. The first month is measured by execution, not outcome.',
      },
    },
    quiz: [
      {
        q: { fr: 'Taille recommandée pour le premier mois :', en: 'Recommended size for the first month:' },
        options: { fr: ['La plus petite possible', 'La même qu’en démo', 'La plus grande autorisée'], en: ['The smallest possible', 'The same as on demo', 'The largest allowed'] },
        correct: 0,
        rationale: {
          fr: 'Les erreurs du premier mois doivent coûter le moins possible.',
          en: 'First-month mistakes should cost as little as possible.',
        },
      },
      {
        q: { fr: 'Critère raisonnable pour passer au mois 2 :', en: 'Reasonable criterion for month 2:' },
        options: {
          fr: ['Adhésion au plan > 90 %, aucune limite journalière violée', 'Avoir gagné au moins 500 $', 'Avoir tradé tous les jours'],
          en: ['Plan adherence > 90 %, no daily limit breached', 'Having won at least $500', 'Having traded every day'],
        },
        correct: 0,
        rationale: {
          fr: 'Des critères de comportement, que vous contrôlez entièrement.',
          en: 'Behavioural criteria, which you fully control.',
        },
      },
      {
        q: { fr: 'Pourquoi relire le plan chaque matin ?', en: 'Why reread the plan every morning?' },
        options: {
          fr: ['Pour que les règles soient présentes avant la première décision', 'Pour l’apprendre par cœur une fois pour toutes', 'Ce n’est pas utile'],
          en: ['So the rules are present before the first decision', 'To memorise it once and for all', 'It is not useful'],
        },
        correct: 0,
        rationale: {
          fr: 'Une règle relue deux minutes avant d’ouvrir la plateforme pèse plus qu’une règle lue il y a trois semaines.',
          en: 'A rule reread two minutes before opening the platform carries more weight than one read three weeks ago.',
        },
      },
    ],
  },

  'live-14': {
    intro: {
      fr: [
        'Dernière leçon. En la terminant, vous débloquez votre diplôme nkNOWTrade : il atteste que vous avez suivi l’ensemble du parcours — des bases du forex jusqu’aux marchés réels — en complétant les exercices et les quiz de chaque leçon. Chaque certificat de piste obtenu en chemin dispose en outre d’un lien de vérification public, que vous pouvez partager.',
        'Ce qu’il n’est pas : ni un permis, ni une certification réglementaire, ni une qualification de conseiller financier, et pas une garantie de résultats. Au Canada comme en France, conseiller d’autres personnes sur leurs placements ou gérer leur argent est une activité réglementée qui exige des inscriptions et des examens spécifiques. Présentez-le pour ce qu’il est : la preuve d’un apprentissage structuré et complet.',
        'La suite ne dépend plus d’un cursus : un plan écrit, un journal tenu après chaque trade, une revue chaque semaine, et des retours réguliers sur les leçons qui vous ont posé problème. Les marchés changeront ; la méthode — mesurer, limiter le risque, se connaître — reste valable. Bon trading, et protégez votre capital.',
      ],
      en: [
        'Final lesson. By completing it, you unlock your nkNOWTrade diploma: it certifies that you have followed the whole programme — from forex basics to live markets — completing the drills and quizzes of every lesson. Each track certificate earned along the way also has a public verification link you can share.',
        'What it is not: not a licence, not a regulatory certification, not a financial-adviser qualification, and not a guarantee of results. In Canada as in France, advising other people on their investments or managing their money is a regulated activity requiring specific registrations and exams. Present it for what it is: proof of a structured, complete course of study.',
        'What comes next no longer depends on a curriculum: a written plan, a journal kept after every trade, a review every week, and regular returns to the lessons that gave you trouble. Markets will change; the method — measure, limit risk, know yourself — still holds. Trade well, and protect your capital.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Un ami vous propose de gérer son épargne « puisque vous avez le diplôme nkNOWTrade ». Réponse juste ?',
        en: 'A friend offers to let you manage their savings “since you have the nkNOWTrade diploma”. Right answer?',
      },
      options: {
        fr: [
          'Refuser : gérer l’argent d’autrui est une activité réglementée',
          'Accepter, le diplôme l’autorise',
          'Accepter si le montant est petit',
        ],
        en: [
          'Decline: managing other people’s money is a regulated activity',
          'Accept, the diploma allows it',
          'Accept if the amount is small',
        ],
      },
      correct: 0,
      rationale: {
        fr: 'Le diplôme atteste un apprentissage, pas une autorisation professionnelle. Gérer ou conseiller l’argent d’autrui exige une inscription auprès du régulateur.',
        en: 'The diploma certifies learning, not professional authorisation. Managing or advising on other people’s money requires registration with the regulator.',
      },
    },
    quiz: [
      {
        q: { fr: 'Le diplôme nkNOWTrade atteste :', en: 'The nkNOWTrade diploma certifies:' },
        options: {
          fr: ['L’achèvement du parcours complet', 'Une qualification de conseiller financier', 'Des gains garantis'],
          en: ['Completion of the full programme', 'A financial-adviser qualification', 'Guaranteed gains'],
        },
        correct: 0,
        rationale: {
          fr: 'Il prouve un apprentissage structuré ; chaque certificat de piste se vérifie par un lien public.',
          en: 'It proves a structured course of study; each track certificate can be verified through a public link.',
        },
      },
      {
        q: { fr: 'Les trois habitudes qui prolongent le parcours :', en: 'The three habits that carry the programme forward:' },
        options: {
          fr: ['Plan écrit, journal, revue hebdomadaire', 'Signaux, levier, intuition', 'Aucune'],
          en: ['Written plan, journal, weekly review', 'Signals, leverage, intuition', 'None'],
        },
        correct: 0,
        rationale: {
          fr: 'Elles transforment chaque trade, gagnant ou perdant, en apprentissage.',
          en: 'They turn every trade, winning or losing, into learning.',
        },
      },
      {
        q: { fr: 'Ce qui reste valable quand les marchés changent :', en: 'What still holds when markets change:' },
        options: {
          fr: ['Mesurer, limiter le risque, se connaître', 'Un indicateur précis', 'Un marché unique'],
          en: ['Measure, limit risk, know yourself', 'One specific indicator', 'A single market'],
        },
        correct: 0,
        rationale: {
          fr: 'Les setups évoluent ; les principes de gestion du risque et de discipline, non.',
          en: 'Setups evolve; the principles of risk management and discipline do not.',
        },
      },
    ],
  },
};
