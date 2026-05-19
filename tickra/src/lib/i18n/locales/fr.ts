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
  theme: { light: 'Passer en thème clair', dark: 'Passer en thème sombre' },
  locale: { switch: 'Changer de langue' },
} as const;

export default fr;
