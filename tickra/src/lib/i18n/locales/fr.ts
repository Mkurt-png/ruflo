const fr = {
  nav: {
    method: 'Méthode',
    curriculum: 'Parcours',
    pricing: 'Tarifs',
    signIn: 'Connexion',
    getStarted: 'Commencer',
  },
  hero: {
    eyebrow: 'Un parcours structuré · Depuis la bougie 1',
    title: ['Commencez à la bougie 1.', 'Atteignez le niveau institutionnel.'],
    titleEm: 'institutionnel',
    body: "Tickra enseigne les marchés comme les salles de marché les apprennent — figure par figure, risque par risque, décision par décision. Des leçons de dix minutes, des vrais graphiques, zéro tape‑à‑l'œil.",
    primaryCta: 'Passer le test de niveau',
    secondaryCta: 'Voir une leçon type',
    chartCaption: 'EUR/USD · 1H · 24 dernières séances',
    stats: [
      { value: '127', label: 'Leçons structurées' },
      { value: '11', label: 'Pistes de maîtrise' },
      { value: '10 min', label: 'Engagement quotidien' },
    ],
  },
  method: {
    eyebrow: 'La méthode',
    title: 'Trois étapes. Aucun détour.',
    body: "La plupart des formations vendent des heures. Nous vendons un chemin. Le vôtre commence par un calibrage, tient en dix minutes par jour, et se termine face à un vrai graphique.",
    steps: [
      {
        index: '01',
        title: 'Calibrez votre point de départ',
        body: 'Un test de six questions lit ce que vous savez déjà et vous oriente vers le bon module. Sans condescendance, sans faux départ.',
      },
      {
        index: '02',
        title: 'Entraînez‑vous dix minutes par jour',
        body: "Une leçon, un quiz, un exercice sur graphique, une révision. Les streaks récompensent la régularité ; les vies protègent l'attention. Rien n'est sauté, un bloc à la fois.",
      },
      {
        index: '03',
        title: 'Passez au graphique réel',
        body: "Quand les figures deviennent réflexes, vous quittez les exercices pour les marchés réels — TradingView intégré, décisions journalisées, revue post‑trade.",
      },
    ],
  },
  bento: {
    eyebrow: 'Le produit',
    title: 'Un atelier, pas une bibliothèque.',
    body: 'Chaque leçon est construite autour de ce que vous faites, pas de ce que vous regardez.',
    items: {
      charts: {
        title: 'Vrais graphiques, dessinés en direct.',
        body: "Chaque leçon s'ouvre sur le graphique qu'elle enseigne. Trendlines, Fibonacci, zones d'offre — pratiqués sur de vraies séances historiques.",
      },
      streak: {
        title: 'Des streaks qui respectent votre temps.',
        body: 'Dix minutes comptent. Un jour manqué, un freeze conserve la série. Tickra récompense la régularité, pas le surmenage.',
      },
      library: {
        title: '127 modules, onze pistes.',
        body: "Des bougies japonaises aux régimes de volatilité. Chaque module se termine par un point de contrôle qui peut être manqué — et repassé.",
      },
      risk: {
        title: "Le risque d'abord. Toujours.",
        body: 'Taille de position, placement du stop, espérance. On enseigne le risque avant les figures, parce que perdre lentement est tout le métier.',
      },
      journal: {
        title: 'Décisions, journalisées.',
        body: 'Chaque exercice capture votre raisonnement. Après dix séances, Tickra fait remonter les schémas de vos propres erreurs.',
      },
      tv: {
        title: 'TradingView, en natif.',
        body: "Le moteur graphique en lequel vous avez déjà confiance, intégré à chaque leçon. Mêmes outils de dessin, mêmes données, zéro changement de contexte.",
      },
    },
  },
  metrics: {
    eyebrow: 'Sur le terrain',
    title: 'Apprenants. Leçons. Honnêteté.',
    body: 'Pas de captures de paper trading, pas de rendements fabriqués. Les seuls chiffres que nous publions sont ceux sur lesquels une plateforme pédagogique doit être jugée.',
    items: [
      { value: '12 400+', label: 'Apprenants actifs' },
      { value: '92 %', label: 'Terminent le test de niveau' },
      { value: '4,8 / 5', label: 'Note moyenne par leçon' },
      { value: '67', label: 'Pays atteints' },
    ],
    footnote: 'Chiffres auto‑déclarés, mai 2026. Mise à jour mensuelle.',
  },
  pricing: {
    eyebrow: 'Tarifs',
    title: 'Choisissez votre niveau de sérieux.',
    body: "Pas de jeu d'essai gratuit. Commencez gratuitement, passez payant quand le streak prouve votre engagement.",
    plans: [
      {
        id: 'free',
        name: 'Gratuit',
        price: '0 €',
        cadence: 'pour toujours',
        tagline: 'Pour la première semaine de curiosité.',
        cta: 'Commencer gratuitement',
        features: [
          'Test de niveau inclus',
          '12 premières leçons débloquées',
          '3 vies par jour',
          'Suivi des streaks',
          'Révisions de leçon avec pubs',
        ],
      },
      {
        id: 'pro',
        name: 'Pro',
        price: '14,99 €',
        cadence: '/ mois',
        tagline: 'Pour l’apprenant quotidien.',
        cta: 'Passer Pro',
        highlighted: true,
        features: [
          'Les 127 leçons débloquées',
          'Vies illimitées, zéro pub',
          'Choisissez n’importe quel module',
          'TradingView Pro intégré',
          'Journal de décisions et revue post‑trade',
          'Annulable à tout moment',
        ],
      },
      {
        id: 'lifetime',
        name: 'À vie',
        price: '199 €',
        cadence: 'une fois',
        tagline: 'Pour les engagés.',
        cta: 'Acheter une fois',
        features: [
          'Tout ce qui est dans Pro',
          'Tous les futurs modules inclus',
          'Cohorte privée d’apprenants',
          'Garantie satisfait ou remboursé 14 jours',
        ],
      },
    ],
  },
  faq: {
    eyebrow: 'Questions',
    title: 'Réponses honnêtes.',
    items: [
      {
        q: "Faut‑il un compte chez un courtier pour commencer ?",
        a: "Non. Les soixante premières leçons se déroulent entièrement dans Tickra sur des données historiques. Vous n'avez besoin d'un courtier que lorsque vous décidez de passer à l'exécution réelle — et nous vous accompagnons pour le choisir.",
      },
      {
        q: 'Tickra est‑il un service de signaux ?',
        a: "Non. Nous ne publions ni entrées, ni sorties, ni recommandations. Tickra est une plateforme d'apprentissage — les trades sont les vôtres, le raisonnement est le vôtre, la responsabilité est la vôtre.",
      },
      {
        q: 'Combien de temps avant de trader en réel ?',
        a: "La plupart des apprenants Pro atteignent le module Gestion du Risque en 4 à 6 semaines. Faut‑il alors trader en réel ? C'est une autre question — Tickra refuse de la précipiter.",
      },
      {
        q: 'Puis‑je annuler à tout moment ?',
        a: "Oui. Pro est facturé au mois, annulable en deux clics. L'offre À vie est couverte par une garantie satisfait ou remboursé de 14 jours, sans ping‑pong d'e‑mails.",
      },
      {
        q: 'Garantissez‑vous des profits ?',
        a: "Aucun pédagogue sérieux ne le fait. Nous garantissons un cursus, une communauté, et les mêmes exercices que les desks professionnels utilisent pour former leurs juniors. Le reste, c'est le marché.",
      },
    ],
  },
  cta: {
    eyebrow: 'Commencer',
    title: 'Lisez votre première bougie aujourd’hui.',
    body: 'Six questions, quatre‑vingt‑dix secondes. Tickra trouve où vous en êtes et programme la leçon une.',
    primary: 'Passer le test de niveau',
    secondary: 'Voir les tarifs',
  },
  footer: {
    tagline: 'Un cursus de trading, conçu comme un artisanat.',
    columns: [
      {
        title: 'Produit',
        links: [
          { label: 'Méthode', href: '#method' },
          { label: 'Parcours', href: '#curriculum' },
          { label: 'Tarifs', href: '/pricing' },
          { label: 'Journal des versions', href: '/changelog' },
        ],
      },
      {
        title: 'Société',
        links: [
          { label: 'À propos', href: '/about' },
          { label: 'Éditorial', href: '/editorial' },
          { label: 'Contact', href: '/contact' },
        ],
      },
      {
        title: 'Légal',
        links: [
          { label: 'CGU', href: '/terms' },
          { label: 'Confidentialité', href: '/privacy' },
          { label: 'Avertissement risque', href: '/risk' },
        ],
      },
    ],
    risk:
      "Le trading comporte un risque substantiel de perte. Tickra est une plateforme éducative ; rien sur ce site ne constitue un conseil en investissement.",
    copyright: '© 2026 Tickra. Tous droits réservés.',
  },
  theme: { light: 'Passer en thème clair', dark: 'Passer en thème sombre' },
  locale: { switch: 'Changer de langue' },
} as const;

export default fr;
