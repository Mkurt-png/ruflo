// L'Erratum — public log of mistakes Tickra has made.
// Static data, edited by the editor. Each entry stays here forever:
// nothing is silently corrected. If you want to know whether a site
// can be trusted, read its erratum before its manifesto.

export type ErratumEntry = {
  id: string;
  date: string; // ISO YYYY-MM-DD
  scope: 'lesson' | 'criee' | 'lettre' | 'methode' | 'site';
  title: { fr: string; en: string };
  body: { fr: string; en: string };
};

// Seeded with the first few corrections. The editor appends below;
// nothing is ever removed.
export const ERRATA: ErratumEntry[] = [
  {
    id: '2026-05-14-criee',
    date: '2026-05-14',
    scope: 'criee',
    title: {
      fr: 'La Criée du 14 mai était mal posée',
      en: 'The Criée of May 14 was poorly phrased',
    },
    body: {
      fr: 'La question demandait « la bonne réponse » alors qu’aucune n’existait sans contexte de session. Reformulée le 15 mai. Les réponses du 14 ont été préservées : c’est la question qui a fauté, pas vous.',
      en: 'The question asked for “the right answer” when none existed without session context. Rephrased on May 15. Answers from the 14th are preserved: the question was at fault, not the reader.',
    },
  },
  {
    id: '2026-04-02-lesson',
    date: '2026-04-02',
    scope: 'lesson',
    title: {
      fr: 'Leçon « psy-03 » — chiffre erroné sur la durée moyenne de tenue',
      en: 'Lesson “psy-03” — wrong figure on average hold time',
    },
    body: {
      fr: 'Le chiffre avancé (« 6 jours en moyenne ») provenait d’un échantillon trop court. Remplacé par « plage observée : 2 à 11 jours, sans moyenne stable ». La phrase est plus longue ; c’est le coût de l’honnêteté.',
      en: 'The figure given (“6 days on average”) came from a sample that was too short. Replaced with “observed range: 2 to 11 days, no stable mean.” The sentence is longer; that is the cost of honesty.',
    },
  },
  {
    id: '2026-03-21-site',
    date: '2026-03-21',
    scope: 'site',
    title: {
      fr: 'La progression d’un compte pouvait apparaître chez un autre lecteur',
      en: 'A reader’s progress could appear on another account',
    },
    body: {
      fr: 'Un défaut de scoping local faisait que la progression du premier compte connecté restait visible après une connexion à un second compte sur la même machine. Corrigé en hachant l’email signé dans chaque clé de stockage. Aucune donnée serveur n’était impactée.',
      en: 'A local scoping flaw left the first signed-in account’s progress visible after a second account signed in on the same machine. Fixed by hashing the signed-in email into every storage key. No server data was affected.',
    },
  },
  {
    id: '2026-02-09-lettre',
    date: '2026-02-09',
    scope: 'lettre',
    title: {
      fr: 'La Lettre du dimanche comptait deux fois certaines révisions',
      en: 'The Sunday Letter double-counted some reviews',
    },
    body: {
      fr: 'La section « Ce qui revient » comptait une erreur relue le dimanche comme « relue cette semaine » ET « due la semaine suivante ». Filtre ajusté ; les Lettres précédentes restent telles qu’elles ont été lues.',
      en: 'The “What returns” section was counting a mistake reviewed on Sunday as both “reviewed this week” and “due next week.” Filter adjusted; past Letters remain as they were read.',
    },
  },
  {
    id: '2026-01-30-methode',
    date: '2026-01-30',
    scope: 'methode',
    title: {
      fr: 'La formule de la Cote a été simplifiée — silencieusement, ce qui était une faute',
      en: 'The Score formula was simplified — silently, which was a fault',
    },
    body: {
      fr: 'Nous avions ajusté la pondération de la composante « régularité » sans le mentionner. La nouvelle formule est meilleure ; le silence ne l’était pas. Détails publiés sur la page méthode le 1ᵉʳ février.',
      en: 'We adjusted the weighting of the “regularity” component without saying so. The new formula is better; the silence was not. Details published on the method page on February 1.',
    },
  },
];

export function groupByYear(entries: ErratumEntry[]): { year: string; items: ErratumEntry[] }[] {
  const map = new Map<string, ErratumEntry[]>();
  for (const e of entries) {
    const y = e.date.slice(0, 4);
    if (!map.has(y)) map.set(y, []);
    map.get(y)!.push(e);
  }
  return [...map.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, items]) => ({
      year,
      items: items.sort((a, b) => b.date.localeCompare(a.date)),
    }));
}
