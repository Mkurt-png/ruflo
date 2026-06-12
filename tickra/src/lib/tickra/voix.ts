// Les Voix — monthly interview series. Anonymous working traders,
// recorded by the editor. The data shape supports an audio URL and a
// transcript; for now only text excerpts are seeded so the series can
// exist before the first recording is published.

export type Voix = {
  id: string;
  date: string; // YYYY-MM-DD
  pseudonym: string;
  city: { fr: string; en: string };
  craft: { fr: string; en: string };
  audioUrl?: string;
  excerpts: { fr: string; en: string }[];
  signature: { fr: string; en: string };
};

export const VOIX: Voix[] = [
  {
    id: '2026-06-marin',
    date: '2026-06-02',
    pseudonym: 'Marin',
    city: { fr: 'Marseille', en: 'Marseille' },
    craft: { fr: 'Sept ans, marché des changes, comptes prop-firm.', en: 'Seven years, FX, prop-firm accounts.' },
    excerpts: [
      {
        fr: 'Les premières années, je notais mes trades sur une serviette. C’est probablement la décision qui m’a sauvé : pas d’écran, pas de tableau de bord, juste une serviette. Quand je l’ai perdue un matin, j’ai compris que je tenais à la trace plus qu’au résultat.',
        en: 'In the early years, I wrote my trades on a napkin. That was probably the decision that saved me: no screen, no dashboard, just a napkin. When I lost it one morning, I understood I cared about the record more than the result.',
      },
      {
        fr: 'Mon meilleur mois est arrivé après ma pire semaine. J’ai mis quatre jours à comprendre que la semaine était finie ; ce sont ces quatre jours qui ont coûté, pas les pertes.',
        en: 'My best month came after my worst week. It took me four days to understand the week was over; those four days are what cost, not the losses.',
      },
    ],
    signature: {
      fr: 'Le métier, c’est d’écrire avant d’ouvrir.',
      en: 'The craft is to write before opening.',
    },
  },
  {
    id: '2026-05-anna',
    date: '2026-05-04',
    pseudonym: 'Anna',
    city: { fr: 'Lyon', en: 'Lyon' },
    craft: { fr: 'Trois ans, indices, scalp matin.', en: 'Three years, indices, morning scalp.' },
    excerpts: [
      {
        fr: 'Je n’ai pas de stratégie au sens où on l’entend. J’ai trois pages écrites à la main, une par condition de marché, et je les relis chaque matin. Le « système », c’est la relecture — pas le contenu des pages.',
        en: 'I do not have a strategy in the usual sense. I have three handwritten pages, one per market condition, and I reread them every morning. The “system” is the rereading — not the content of the pages.',
      },
      {
        fr: 'Quand je vois un trader poster sa courbe d’equity sur les réseaux, je sais qu’il n’en est pas encore au métier. Le métier est trop silencieux pour s’afficher.',
        en: 'When I see a trader post their equity curve on social media, I know they have not yet reached the craft. The craft is too quiet to display itself.',
      },
    ],
    signature: {
      fr: 'On ne peut pas crier la patience.',
      en: 'You cannot shout patience.',
    },
  },
  {
    id: '2026-04-ari',
    date: '2026-04-08',
    pseudonym: 'Ari',
    city: { fr: 'Tel-Aviv', en: 'Tel Aviv' },
    craft: { fr: 'Onze ans, crypto, taille variable.', en: 'Eleven years, crypto, variable size.' },
    excerpts: [
      {
        fr: 'J’ai appris la discipline par accident : pendant six mois, mon broker plantait toutes les deux heures et je devais m’arrêter. Quand le bug a été corrigé, j’ai gardé l’arrêt. Mon meilleur outil de risk management a été un système instable.',
        en: 'I learned discipline by accident: for six months my broker crashed every two hours and I had to stop. When the bug was fixed, I kept the pause. My best risk-management tool was an unstable system.',
      },
    ],
    signature: {
      fr: 'La meilleure session est celle qu’on raccourcit.',
      en: 'The best session is the one you cut short.',
    },
  },
];
