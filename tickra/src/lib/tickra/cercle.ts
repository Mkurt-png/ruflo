// Le Cercle de relecture — appariement déterministe local.
//
// Tant que Tickra n'a pas de service de pairing serveur, le Cercle
// fonctionne en mode honnête : on dérive un pseudonyme à partir du
// hash de l'email signé et on apparie chaque lecteur à un partenaire
// fictif mais plausible, choisi dans une liste seedée. Le pairing
// change chaque semaine ISO. La Lettre du partenaire est une vraie
// lettre éditoriale, écrite à la main, présentée telle quelle.
//
// Quand le service serveur arrivera, on remplacera le partenaire
// fictif par un vrai lecteur tiré dans la file d'attente. Le
// composant côté lecteur n'aura pas à changer.

const FIRST_NAMES = [
  'Marin', 'Anna', 'Ari', 'Léa', 'Yannis', 'Clara', 'Noé',
  'Iris', 'Tomas', 'Sasha', 'Jules', 'Mira', 'Adrien', 'Naïma',
  'Émile', 'Sira', 'Joaquim', 'Maya', 'Hugo', 'Lucie',
];

const CITIES = [
  'Marseille', 'Lyon', 'Tel-Aviv', 'Lisbonne', 'Bruxelles',
  'Genève', 'Montréal', 'Tokyo', 'Berlin', 'Buenos Aires',
  'Athènes', 'Helsinki', 'Casablanca', 'Mexico', 'Tunis',
];

// 8 hand-written partner letters. The reader sees one of these every
// week, chosen deterministically from their email + the ISO week key.
// All letters are bilingual; the Cercle reads in the reader's locale.
const PARTNER_LETTERS: { fr: string[]; en: string[] }[] = [
  {
    fr: [
      'J’ai eu deux clôtures cette semaine, dont une où j’ai bougé mon stop. Je le note ici parce que je ne l’aurais pas écrit ailleurs.',
      'La leçon psy-03 me revient à chaque session. Je ne la relis pas — je la sais —, mais elle m’appelle.',
      'Le marché m’a moins parlé que d’habitude. C’est peut-être moi qui ai moins écouté.',
    ],
    en: [
      'I had two closes this week, one where I moved my stop. I note it here because I would not have written it elsewhere.',
      'Lesson psy-03 comes back at every session. I do not reread it — I know it — but it calls.',
      'The market spoke to me less than usual. Perhaps I listened less.',
    ],
  },
  {
    fr: [
      'Une seule leçon ouverte cette semaine, et c’était la plus dure. Bonne semaine quand même.',
      'J’ai relu une vieille erreur que je croyais comprise. Je ne l’avais pas comprise.',
      'Je vais essayer d’écrire avant d’ouvrir, comme la Lettre du dimanche dernier le rappelait.',
    ],
    en: [
      'Only one lesson opened this week, and it was the hardest. Good week all the same.',
      'I reread an old mistake I thought I understood. I had not understood it.',
      'I will try to write before opening, as last Sunday’s Letter reminded me.',
    ],
  },
  {
    fr: [
      'Mois où je trade peu ; le carnet le sait. Trois entrées seulement, deux relectures.',
      'La Cote est à 6.5, plus basse que je voudrais. Je ne touche pas à la formule pour qu’elle remonte ; je travaille.',
      'Bonne semaine à vous. Lisez ce qui vous reste avant d’ouvrir un graphique.',
    ],
    en: [
      'Month where I trade little; the register knows. Only three entries, two rereads.',
      'The Score is at 6.5, lower than I would like. I do not touch the formula to lift it; I work.',
      'Good week to you. Read what you have left before opening a chart.',
    ],
  },
  {
    fr: [
      'Première Lettre que j’écris pour quelqu’un d’autre que moi-même. C’est étrangement plus court.',
      'Je n’ai pas ouvert de trade cette semaine. La leçon, c’est qu’une semaine sans trade peut être une bonne semaine.',
      'Si vous lisez ceci, ne me souhaitez rien : la prochaine séance ouvrira d’elle-même.',
    ],
    en: [
      'First Letter I write for someone other than myself. Strangely shorter.',
      'I did not open a trade this week. The lesson is that a week without trades can be a good week.',
      'If you read this, wish me nothing: the next session will open on its own.',
    ],
  },
  {
    fr: [
      'J’ai noté un trade à 21 h alors que j’avais décidé d’arrêter à 20 h. Je l’écris pour ne pas l’oublier en bien.',
      'Le Greffier m’a dit que la moitié de mes pertes étaient nocturnes. Je m’y attendais ; le voir noir sur paille pèse.',
      'Cette semaine je referme à 20 h, pour de bon. La preuve sera dans le carnet, pas dans la décision.',
    ],
    en: [
      'I logged a trade at 21:00 when I had decided to stop at 20:00. I write it so I do not remember it kindly.',
      'The Registrar told me half my losses were nocturnal. I expected it; seeing it black on straw weighs.',
      'This week I close at 20:00, for real. The proof will be in the register, not in the decision.',
    ],
  },
  {
    fr: [
      'Streak à 12 jours. Je l’écris ici pour qu’il ne devienne pas une obligation.',
      'J’ai compris que je relisais toujours les mêmes leçons. J’ai ouvert une que j’évitais.',
      'À la semaine prochaine — ou pas, c’est selon la séance.',
    ],
    en: [
      'Streak at 12 days. I write it here so it does not become an obligation.',
      'I realized I always reread the same lessons. I opened one I had been avoiding.',
      'See you next week — or not, depending on the session.',
    ],
  },
  {
    fr: [
      'Bonne semaine, plate. Pas de gain remarquable, pas de perte qui pèse. C’est ce qui se rapproche le plus du métier.',
      'J’ai écrit dans mes notes : « rien à dire ». C’est aussi une note.',
      'Si vous avez quelque chose à dire cette semaine, dites-le dans votre Lettre — je la lirai.',
    ],
    en: [
      'Good, flat week. No remarkable gain, no loss that weighs. The closest thing to the craft.',
      'I wrote in my notes: "nothing to say." That is also a note.',
      'If you have something to say this week, say it in your Letter — I will read it.',
    ],
  },
  {
    fr: [
      'Première semaine où la Cote a baissé. J’ai eu envie de la cacher, je l’écris à la place.',
      'La leçon que je relis le plus en ce moment : psy-07.',
      'Bonne lecture à vous, et surtout : bonne lecture à votre propre semaine.',
    ],
    en: [
      'First week the Score went down. I wanted to hide it; I write it instead.',
      'The lesson I reread most right now: psy-07.',
      'Good reading to you, and above all: good reading of your own week.',
    ],
  },
];

// Salt prevents identical-email-across-deployments linkability and
// raises the brute-force bar against the small 300-bucket pseudonym
// space. djb2 stays — the pseudonym is editorial, not auth — but
// the salt anchors it to this app instance.
const CERCLE_SALT = process.env.NEXT_PUBLIC_CERCLE_SALT ?? 'tickra-cercle-v1';

function djb2(s: string): number {
  let h = 5381;
  const salted = CERCLE_SALT + s;
  for (let i = 0; i < salted.length; i++) h = ((h << 5) + h + salted.charCodeAt(i)) >>> 0;
  return h;
}

function pseudoFromHash(hash: number): { name: string; city: string } {
  return {
    name: FIRST_NAMES[hash % FIRST_NAMES.length],
    city: CITIES[Math.floor(hash / 17) % CITIES.length],
  };
}

function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export type CerclePair = {
  /** ISO week key, e.g. "2026-W24". */
  week: string;
  /** The reader's own pseudonym for this week. */
  me: { name: string; city: string };
  /** The partner's pseudonym. */
  partner: { name: string; city: string };
  /** The partner's letter — three to four prose lines. */
  letter: { fr: string[]; en: string[] };
};

export function pairFor(email: string | null, now: Date = new Date()): CerclePair {
  const week = isoWeekKey(now);
  const seedMe = djb2(email ?? 'anonymous');
  const seedPair = djb2(`${email ?? 'anonymous'}::${week}`);
  // Ensure the partner is not the same as the reader.
  let partnerSeed = seedPair;
  for (let i = 0; i < 8; i++) {
    if (partnerSeed % FIRST_NAMES.length !== seedMe % FIRST_NAMES.length) break;
    partnerSeed = djb2(`${partnerSeed}::salt`);
  }
  const me = pseudoFromHash(seedMe);
  const partner = pseudoFromHash(partnerSeed);
  const letter = PARTNER_LETTERS[partnerSeed % PARTNER_LETTERS.length];
  return { week, me, partner, letter };
}
