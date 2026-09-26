// Psychologie & journal — leçons 11 à 16 (Pro). Server-only: paid copy,
// imported only through lesson-content.ts (see no-paid-content-in-bundle.test.ts).

import type { LessonContent } from '../lesson-content';

export const PSY: Record<string, LessonContent> = {
  'psy-11': {
    intro: {
      fr: [
        'La mémoire de travail est limitée : on ne garde en tête que quelques éléments à la fois. Six graphiques, quatre indicateurs, trois marchés et un fil d’actualités ouverts en même temps dépassent largement cette capacité. Au-delà, on ne décide plus — on réagit au dernier élément vu.',
        'Les erreurs typiques d’une charge trop lourde : oublier de vérifier le calendrier économique, se tromper de taille de position, confondre deux graphiques. Ce ne sont pas des fautes de connaissance ; ce sont des fautes d’attention, et elles augmentent avec la fatigue et la durée de la session.',
        'Réduire la charge est une compétence de trader. Moins de marchés suivis, moins d’indicateurs, une check-list écrite avant chaque ordre, et des décisions prises à l’avance (« si le prix clôture sous X, je sors ») plutôt qu’en direct. Chaque décision déjà prise est une décision que votre cerveau fatigué n’aura pas à prendre.',
      ],
      en: [
        'Working memory is limited: you can only hold a few items at once. Six charts, four indicators, three markets and a news feed open together go well beyond that capacity. Past it, you no longer decide — you react to the last thing you saw.',
        'Typical errors of overload: forgetting to check the economic calendar, getting the position size wrong, mixing up two charts. They are not knowledge mistakes; they are attention mistakes, and they grow with fatigue and session length.',
        'Reducing load is a trading skill. Fewer markets followed, fewer indicators, a written checklist before every order, and decisions made in advance (“if price closes below X, I exit”) rather than live. Every decision already made is one your tired brain will not have to make.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Vous suivez 8 paires et 5 indicateurs. Vous avez fait deux erreurs de taille cette semaine. Premier changement ?',
        en: 'You follow 8 pairs and 5 indicators. You made two sizing errors this week. First change?',
      },
      options: {
        fr: ['Réduire à 2-3 marchés et ajouter une check-list', 'Ajouter un sixième indicateur', 'Trader plus vite pour tout couvrir'],
        en: ['Cut to 2-3 markets and add a checklist', 'Add a sixth indicator', 'Trade faster to cover everything'],
      },
      correct: 0,
      rationale: {
        fr: 'Des erreurs de taille sont des erreurs d’attention. Moins d’éléments à surveiller et une vérification écrite avant l’ordre s’attaquent à la cause.',
        en: 'Sizing errors are attention errors. Fewer things to watch and a written check before the order address the cause.',
      },
    },
    quiz: [
      {
        q: { fr: 'Une charge cognitive trop lourde provoque surtout :', en: 'Cognitive overload mostly causes:' },
        options: {
          fr: ['Des erreurs d’attention', 'Un meilleur jugement', 'Aucun effet'],
          en: ['Attention errors', 'Better judgement', 'No effect'],
        },
        correct: 0,
        rationale: {
          fr: 'On connaît la règle, mais on oublie de l’appliquer au moment voulu.',
          en: 'You know the rule, but forget to apply it at the right moment.',
        },
      },
      {
        q: { fr: 'Pourquoi décider à l’avance ?', en: 'Why decide in advance?' },
        options: {
          fr: ['Pour libérer l’attention pendant le trade', 'Pour trader plus', 'Parce que c’est obligatoire'],
          en: ['To free attention during the trade', 'To trade more', 'Because it is mandatory'],
        },
        correct: 0,
        rationale: {
          fr: 'Une règle « si… alors… » écrite à froid s’exécute sans délibération au moment où la pression est forte.',
          en: 'An “if… then…” rule written in advance executes without deliberation when pressure is high.',
        },
      },
      {
        q: { fr: 'Outil le plus simple contre la surcharge :', en: 'Simplest tool against overload:' },
        options: {
          fr: ['Une check-list avant chaque ordre', 'Un écran de plus', 'Un café de plus'],
          en: ['A checklist before each order', 'One more screen', 'One more coffee'],
        },
        correct: 0,
        rationale: {
          fr: 'Les pilotes et les chirurgiens l’utilisent pour la même raison : la mémoire flanche sous pression.',
          en: 'Pilots and surgeons use it for the same reason: memory falters under pressure.',
        },
      },
    ],
  },

  'psy-12': {
    intro: {
      fr: [
        'Le tilt, terme venu du poker, désigne l’état où les émotions ont pris le contrôle des décisions. Il s’installe presque toujours après une perte ressentie comme injuste — un stop touché de quelques pips, une annonce imprévue — et il se reconnaît mieux de l’extérieur que de l’intérieur.',
        'Signes observables : taille qui augmente après une perte, stop déplacé ou supprimé, trades pris hors de votre plan (autre marché, autre horaire, setup incomplet), ordres passés plus vite que d’habitude. Et des signes physiques : mâchoire serrée, respiration courte, envie de « récupérer » avant la fin de la journée.',
        'Le tilt ne se combat pas à la volonté, il se détecte avec une règle. Comptez vos écarts au plan pendant la session ; au deuxième écart, vous arrêtez pour la journée, quel que soit le résultat. Notez ensuite dans votre journal ce qui a précédé le premier écart : c’est là que se trouve votre déclencheur.',
      ],
      en: [
        'Tilt, a term borrowed from poker, is the state in which emotions have taken over decisions. It almost always sets in after a loss that feels unfair — a stop hit by a few pips, an unexpected release — and it is easier to recognise from outside than from inside.',
        'Observable signs: size increasing after a loss, a stop moved or removed, trades taken outside your plan (another market, another time, an incomplete setup), orders placed faster than usual. And physical signs: clenched jaw, short breath, the urge to “win it back” before the day ends.',
        'Tilt is not beaten by willpower; it is detected with a rule. Count your deviations from the plan during the session; at the second deviation you stop for the day, whatever the result. Then note in your journal what came before the first deviation: that is where your trigger lies.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Après une perte, vous avez déplacé un stop, puis pris un trade sur une paire que vous ne suivez pas. Selon la règle des deux écarts :',
        en: 'After a loss, you moved a stop, then took a trade on a pair you do not follow. Under the two-deviation rule:',
      },
      options: {
        fr: ['Arrêt pour la journée', 'Un dernier trade pour finir en positif', 'Continuer, les écarts étaient petits'],
        en: ['Stop for the day', 'One last trade to end positive', 'Carry on, the deviations were small'],
      },
      correct: 0,
      rationale: {
        fr: 'Deux écarts : la règle s’applique, sans négociation. « Un dernier trade pour finir en positif » est précisément la pensée typique du tilt.',
        en: 'Two deviations: the rule applies, no negotiation. “One last trade to end positive” is precisely the typical tilt thought.',
      },
    },
    quiz: [
      {
        q: { fr: 'Déclencheur le plus fréquent du tilt :', en: 'Most common tilt trigger:' },
        options: {
          fr: ['Une perte ressentie comme injuste', 'Une journée calme', 'Un gain prévu'],
          en: ['A loss that feels unfair', 'A calm day', 'A planned win'],
        },
        correct: 0,
        rationale: {
          fr: 'Le sentiment d’injustice pousse à vouloir « corriger » le résultat immédiatement.',
          en: 'The sense of unfairness drives the urge to “correct” the outcome immediately.',
        },
      },
      {
        q: { fr: 'Signe objectif de tilt :', en: 'Objective sign of tilt:' },
        options: {
          fr: ['Taille augmentée juste après une perte', 'Respect du plan', 'Pause planifiée'],
          en: ['Size increased right after a loss', 'Following the plan', 'A planned break'],
        },
        correct: 0,
        rationale: {
          fr: 'Augmenter la taille pour récupérer, c’est laisser la perte précédente décider du trade suivant.',
          en: 'Raising size to recover lets the previous loss decide the next trade.',
        },
      },
      {
        q: { fr: 'Comment combattre le tilt ?', en: 'How do you fight tilt?' },
        options: {
          fr: ['Une règle d’arrêt basée sur les écarts au plan', 'La volonté seule', 'Trader plus pour se changer les idées'],
          en: ['A stop rule based on plan deviations', 'Willpower alone', 'Trading more to take your mind off it'],
        },
        correct: 0,
        rationale: {
          fr: 'En plein tilt, le jugement est la première chose atteinte. Une règle décidée à froid ne dépend pas de lui.',
          en: 'In full tilt, judgement is the first thing affected. A rule set in advance does not depend on it.',
        },
      },
    ],
  },

  'psy-13': {
    intro: {
      fr: [
        'Une limite de perte journalière est un disjoncteur : au-delà d’un certain montant perdu dans la journée, vous arrêtez de trader jusqu’au lendemain. Beaucoup la fixent entre 2 et 3 fois leur risque par trade, par exemple 2 % du compte pour un risque de 1 % par trade ; une limite hebdomadaire complète le dispositif.',
        'Son rôle n’est pas de limiter les pertes « normales » — votre stop s’en charge — mais de couper la spirale. Les pires journées ne viennent presque jamais d’un seul trade ; elles viennent d’une série de décisions prises sous l’effet des pertes précédentes.',
        'La limite doit être écrite, chiffrée, et appliquée sans exception : atteinte, elle ferme la session, même si un « setup parfait » apparaît. Certaines plateformes permettent de la configurer techniquement ; si c’est le cas, faites-le. Une règle qui dépend de votre volonté au pire moment de la journée est une règle fragile.',
      ],
      en: [
        'A daily loss limit is a circuit breaker: past a certain amount lost in the day, you stop trading until tomorrow. Many set it at 2 to 3 times their per-trade risk, for example 2 % of the account for 1 % risk per trade; a weekly limit completes the system.',
        'Its role is not to limit “normal” losses — your stop does that — but to cut the spiral. The worst days almost never come from a single trade; they come from a series of decisions made under the influence of earlier losses.',
        'The limit must be written, quantified and applied without exception: once hit, it closes the session, even if a “perfect setup” appears. Some platforms let you set it technically; if yours does, do so. A rule that depends on your willpower at the worst moment of the day is a fragile rule.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Compte de 10 000 $, limite journalière 2 %. Pertes du jour : −120 $, puis −80 $. Que faites-vous ?',
        en: '$10,000 account, 2 % daily limit. Losses today: −$120, then −$80. What do you do?',
      },
      options: {
        fr: ['J’arrête : la limite de 200 $ est atteinte', 'Un dernier trade à taille double', 'Je continue, il reste de la marge'],
        en: ['Stop: the $200 limit is reached', 'One last trade at double size', 'Carry on, there is margin left'],
      },
      correct: 0,
      rationale: {
        fr: '2 % de 10 000 $ = 200 $. −120 − 80 = −200 $ : la limite est atteinte, la session est terminée.',
        en: '2 % of $10,000 = $200. −120 − 80 = −$200: the limit is reached, the session is over.',
      },
    },
    quiz: [
      {
        q: { fr: 'Rôle principal de la limite journalière :', en: 'Main role of the daily limit:' },
        options: {
          fr: ['Couper la spirale des décisions émotionnelles', 'Remplacer les stops', 'Augmenter les gains'],
          en: ['Cut the spiral of emotional decisions', 'Replace stops', 'Increase gains'],
        },
        correct: 0,
        rationale: {
          fr: 'Le stop limite un trade ; la limite journalière limite une journée qui dérape.',
          en: 'The stop limits a trade; the daily limit limits a day that is going off the rails.',
        },
      },
      {
        q: { fr: 'Limite atteinte, un setup parfait apparaît :', en: 'Limit reached, a perfect setup appears:' },
        options: { fr: ['Je ne le prends pas', 'Je le prends, il est parfait', 'Je le prends en petit'], en: ['I do not take it', 'I take it, it is perfect', 'I take it small'] },
        correct: 0,
        rationale: {
          fr: 'Un disjoncteur qu’on réarme « juste pour cette fois » ne protège plus rien.',
          en: 'A circuit breaker you reset “just this once” no longer protects anything.',
        },
      },
      {
        q: { fr: 'Meilleure façon d’appliquer la limite :', en: 'Best way to enforce the limit:' },
        options: {
          fr: ['La configurer techniquement si possible', 'Compter sur sa volonté', 'La fixer après la session'],
          en: ['Set it technically if possible', 'Rely on willpower', 'Set it after the session'],
        },
        correct: 0,
        rationale: {
          fr: 'Au moment où la limite est atteinte, votre volonté est au plus bas. Mieux vaut que la règle s’applique sans elle.',
          en: 'When the limit is hit, your willpower is at its lowest. Better that the rule applies without it.',
        },
      },
    ],
  },

  'psy-14': {
    intro: {
      fr: [
        'La répétition mentale est utilisée par les sportifs et les pilotes pour une raison simple : un scénario déjà vécu en pensée se déroule mieux en vrai. Pour un trader, elle se fait avant l’ouverture, en cinq minutes, graphique sous les yeux.',
        'La forme la plus efficace est le plan « si… alors… » : « si le prix revient sur 1.0850 et rejette, alors j’achète avec un stop sous 1.0830 ». Les recherches en psychologie sur ces intentions de mise en œuvre montrent qu’elles aident à passer à l’action au bon moment, parce que la décision est déjà associée à la situation.',
        'Répétez aussi le scénario perdant : « si le stop est touché, alors je note le trade et je ne rentre pas à nouveau avant une heure ». C’est la partie que presque tout le monde saute — et c’est celle qui évite le tilt. Visualiser un gain est agréable ; répéter une perte bien gérée est utile.',
      ],
      en: [
        'Mental rehearsal is used by athletes and pilots for a simple reason: a scenario already lived in thought plays out better for real. For a trader it happens before the open, in five minutes, chart in front of you.',
        'The most effective form is the “if… then…” plan: “if price returns to 1.0850 and rejects, then I buy with a stop under 1.0830”. Psychology research on these implementation intentions shows they help people act at the right moment, because the decision is already linked to the situation.',
        'Rehearse the losing scenario too: “if the stop is hit, then I log the trade and do not re-enter for an hour”. That is the part almost everyone skips — and it is the one that prevents tilt. Visualising a win feels good; rehearsing a well-handled loss is useful.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Quel plan « si… alors… » est le mieux formulé ?',
        en: 'Which “if… then…” plan is best written?',
      },
      options: {
        fr: [
          'Si le prix clôture sous 1.0830, alors je sors et je note le trade',
          'Si ça baisse, je verrai',
          'Si je sens que c’est le bon moment, j’achète',
        ],
        en: [
          'If price closes below 1.0830, then I exit and log the trade',
          'If it drops, I will see',
          'If I feel it is the right moment, I buy',
        ],
      },
      correct: 0,
      rationale: {
        fr: 'Une condition observable (une clôture sous un niveau) et une action précise. Les deux autres laissent la décision au moment où vous serez le moins lucide.',
        en: 'An observable condition (a close below a level) and a precise action. The other two leave the decision to the moment you will be least clear-headed.',
      },
    },
    quiz: [
      {
        q: { fr: 'Pourquoi répéter le scénario perdant ?', en: 'Why rehearse the losing scenario?' },
        options: {
          fr: ['Pour réagir calmement quand il arrive', 'Pour l’attirer', 'Ce n’est pas utile'],
          en: ['To react calmly when it happens', 'To attract it', 'It is not useful'],
        },
        correct: 0,
        rationale: {
          fr: 'Une perte déjà répétée ne surprend pas : la réponse prévue s’exécute à la place de l’émotion.',
          en: 'A rehearsed loss does not surprise you: the planned response runs instead of the emotion.',
        },
      },
      {
        q: { fr: 'Un bon plan « si… alors… » contient :', en: 'A good “if… then…” plan contains:' },
        options: {
          fr: ['Une condition observable et une action précise', 'Un ressenti', 'Une prévision de prix'],
          en: ['An observable condition and a precise action', 'A feeling', 'A price forecast'],
        },
        correct: 0,
        rationale: {
          fr: 'Si la condition ne peut pas être vérifiée sur le graphique, le plan ne peut pas être exécuté sans hésiter.',
          en: 'If the condition cannot be checked on the chart, the plan cannot be executed without hesitation.',
        },
      },
      {
        q: { fr: 'Quand faire la répétition mentale ?', en: 'When should you do mental rehearsal?' },
        options: { fr: ['Avant l’ouverture', 'Pendant un trade en perte', 'Jamais'], en: ['Before the open', 'During a losing trade', 'Never'] },
        correct: 0,
        rationale: {
          fr: 'Elle prépare les décisions ; pendant le trade, il ne reste qu’à les exécuter.',
          en: 'It prepares decisions; during the trade, all that is left is to execute them.',
        },
      },
    ],
  },

  'psy-15': {
    intro: {
      fr: [
        'Exercice : cinq entrées de journal. Pour chacune, demandez-vous si elle respecte le format en trois lignes de la leçon 10 — la décision prise, l’émotion ressentie au moment du clic, la phrase à reprendre la prochaine fois.',
        'Entrée 1 : « Perte. Le marché est manipulé. » Entrée 2 : « Achat EUR/USD sur rejet de 1.0850 conforme au plan. Calme, un peu d’impatience avant l’entrée. La prochaine fois : attendre la clôture, comme aujourd’hui. » Entrée 3 : « +240 $ ! Super journée. » Entrée 4 : « Vendu trop tôt. » Entrée 5 : « Pris une vente hors plan après une perte. Colère. La prochaine fois : pause d’une heure après tout stop touché. »',
        'Remarquez que l’entrée 5 décrit une erreur — et qu’elle est pourtant excellente. Un journal utile n’est pas un journal de gains : c’est celui dont on peut tirer une règle. Relisez vos propres dernières entrées avec cette grille.',
      ],
      en: [
        'Drill: five journal entries. For each one, ask whether it follows the three-line format from lesson 10 — the decision taken, the emotion felt at the click, the sentence to bring back next time.',
        'Entry 1: “Loss. The market is rigged.” Entry 2: “Bought EUR/USD on a rejection of 1.0850 per the plan. Calm, a little impatient before entry. Next time: wait for the close, like today.” Entry 3: “+$240! Great day.” Entry 4: “Sold too early.” Entry 5: “Took an off-plan short after a loss. Anger. Next time: one-hour break after any stop hit.”',
        'Notice that entry 5 describes a mistake — and yet it is excellent. A useful journal is not a record of wins: it is one you can draw a rule from. Reread your own latest entries through this lens.',
      ],
    },
    drill: {
      prompt: { fr: 'Quelles entrées respectent le format complet ?', en: 'Which entries follow the full format?' },
      options: { fr: ['2 et 5', '3 seulement', '1 et 4'], en: ['2 and 5', '3 only', '1 and 4'] },
      correct: 0,
      rationale: {
        fr: 'Les entrées 2 et 5 contiennent la décision, l’émotion et une phrase pour la prochaine fois. Les autres décrivent un résultat ou un jugement, sans rien d’exploitable.',
        en: 'Entries 2 and 5 contain the decision, the emotion and a sentence for next time. The others describe an outcome or a judgement, with nothing actionable.',
      },
    },
    quiz: [
      {
        q: { fr: 'Ce qui manque à l’entrée 4 (« Vendu trop tôt ») :', en: 'What entry 4 (“Sold too early”) lacks:' },
        options: {
          fr: ['L’émotion et la phrase pour la prochaine fois', 'Le montant', 'Rien'],
          en: ['The emotion and the next-time sentence', 'The amount', 'Nothing'],
        },
        correct: 0,
        rationale: {
          fr: 'Pourquoi avoir vendu tôt — peur ? — et que faire la prochaine fois ? Sans ces deux lignes, l’erreur se répétera.',
          en: 'Why sell early — fear? — and what to do next time? Without those two lines, the mistake will repeat.',
        },
      },
      {
        q: { fr: 'Le problème de l’entrée 1 :', en: 'The problem with entry 1:' },
        options: {
          fr: ['Elle rejette la responsabilité à l’extérieur', 'Elle est trop longue', 'Elle parle d’émotion'],
          en: ['It pushes responsibility outside', 'It is too long', 'It mentions emotion'],
        },
        correct: 0,
        rationale: {
          fr: 'On ne contrôle pas le marché ; on contrôle ses décisions. Une entrée qui accuse le marché ne peut rien améliorer.',
          en: 'You do not control the market; you control your decisions. An entry that blames the market cannot improve anything.',
        },
      },
      {
        q: { fr: 'Pourquoi l’entrée 5 est-elle excellente malgré l’erreur ?', en: 'Why is entry 5 excellent despite the mistake?' },
        options: {
          fr: ['Elle produit une règle concrète', 'Parce qu’elle parle d’une vente', 'Elle ne l’est pas'],
          en: ['It produces a concrete rule', 'Because it mentions a short', 'It is not'],
        },
        correct: 0,
        rationale: {
          fr: '« Pause d’une heure après tout stop touché » peut s’appliquer dès demain. C’est tout l’objet du journal.',
          en: '“One-hour break after any stop hit” can be applied from tomorrow. That is the whole point of the journal.',
        },
      },
    ],
  },

  'psy-16': {
    intro: {
      fr: [
        'Point de contrôle psychologie. Les acquis de cette piste tiennent en une idée : vos décisions se dégradent de façon prévisible — sous la fatigue, après une perte, après un gain, sous surcharge — et on ne corrige pas une dégradation prévisible avec de la volonté, mais avec des règles.',
        'Vos règles à ce stade : une check-list avant chaque ordre, la règle des deux écarts contre le tilt, une limite de perte journalière chiffrée, des plans « si… alors… » répétés avant l’ouverture, et un journal en trois lignes qui transforme chaque erreur en règle.',
        'Exercice avant la dernière piste : écrivez sur une page votre plan de trading complet — marchés, horaires, setups, risque par trade, limite journalière, règles d’arrêt. La piste Marchés réels part de ce document. Si vous ne pouvez pas l’écrire, vous n’êtes pas encore prêt à engager de l’argent réel, et c’est une information précieuse.',
      ],
      en: [
        'Psychology checkpoint. This track comes down to one idea: your decisions degrade in predictable ways — under fatigue, after a loss, after a win, under overload — and you do not fix a predictable degradation with willpower, but with rules.',
        'Your rules at this stage: a checklist before every order, the two-deviation rule against tilt, a quantified daily loss limit, “if… then…” plans rehearsed before the open, and a three-line journal that turns every mistake into a rule.',
        'Drill before the final track: write your complete trading plan on one page — markets, hours, setups, risk per trade, daily limit, stop rules. The Live markets track starts from this document. If you cannot write it, you are not ready to commit real money yet, and that is valuable information.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Vous ne parvenez pas à écrire votre plan sur une page. Conclusion ?',
        en: 'You cannot write your plan on one page. Conclusion?',
      },
      options: {
        fr: ['Rester en démo et clarifier le plan', 'Passer en réel pour apprendre sur le tas', 'Copier le plan d’un autre'],
        en: ['Stay on demo and clarify the plan', 'Go live to learn on the job', 'Copy someone else’s plan'],
      },
      correct: 0,
      rationale: {
        fr: 'Un plan qu’on ne peut pas écrire ne peut pas être suivi. Le réel ajoute la pression émotionnelle — il ne clarifie rien.',
        en: 'A plan you cannot write down cannot be followed. Live trading adds emotional pressure — it clarifies nothing.',
      },
    },
    quiz: [
      {
        q: { fr: 'Contre une dégradation prévisible des décisions :', en: 'Against a predictable decline in decisions:' },
        options: { fr: ['Des règles écrites', 'La volonté', 'La chance'], en: ['Written rules', 'Willpower', 'Luck'] },
        correct: 0,
        rationale: {
          fr: 'Les règles s’appliquent même quand votre jugement est altéré — c’est tout leur intérêt.',
          en: 'Rules apply even when your judgement is impaired — that is their whole point.',
        },
      },
      {
        q: { fr: 'La règle des deux écarts sert à :', en: 'The two-deviation rule serves to:' },
        options: { fr: ['Détecter et arrêter le tilt', 'Doubler les gains', 'Choisir un marché'], en: ['Detect and stop tilt', 'Double gains', 'Pick a market'] },
        correct: 0,
        rationale: {
          fr: 'Elle remplace un jugement impossible en pleine émotion par un comptage simple.',
          en: 'It replaces a judgement that is impossible in the heat of emotion with a simple count.',
        },
      },
      {
        q: { fr: 'Le document de départ de la piste Marchés réels :', en: 'The starting document of the Live markets track:' },
        options: {
          fr: ['Votre plan de trading d’une page', 'Un relevé bancaire', 'Une liste de signaux'],
          en: ['Your one-page trading plan', 'A bank statement', 'A list of signals'],
        },
        correct: 0,
        rationale: {
          fr: 'Tout ce qui suit consiste à appliquer ce plan en réel, à le mesurer et à l’ajuster.',
          en: 'Everything that follows is about applying that plan live, measuring it and adjusting it.',
        },
      },
    ],
  },
};
