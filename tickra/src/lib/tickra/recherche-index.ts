// Build-time search index for /recherche. Aggregates three sources:
//   - editorial rooms (refus, lettre, voix, …) with their captions
//   - lessons (every TRACKS lesson, bilingual)
//   - glossary terms (with their FR + EN definitions)
//
// The index is small enough to ship in the page bundle as a constant.
// No fetch, no fuse.js, no fancy ranking — accent-insensitive lexical
// match against the haystack string, ordered by source priority then
// title.

import { TRACKS } from '@/lib/curriculum/data';
import { GLOSSARY } from '@/lib/curriculum/glossary';

export type SearchKind = 'piece' | 'lesson' | 'term';

export type SearchEntry = {
  kind: SearchKind;
  href: string;
  title: { fr: string; en: string };
  caption: { fr: string; en: string };
  haystack: { fr: string; en: string };
};

// Editorial rooms — kept in sync with /maison. Same slugs.
const ROOMS: Array<{
  slug: string;
  title: { fr: string; en: string };
  caption: { fr: string; en: string };
}> = [
  { slug: 'criee',          title: { fr: 'La Criée',                en: 'The Criée' },               caption: { fr: 'Une question par jour, identique pour tout le monde, à minuit UTC.', en: 'One question a day, the same for everyone, at midnight UTC.' } },
  { slug: 'lettre',         title: { fr: 'La Lettre du dimanche',   en: 'The Sunday Letter' },        caption: { fr: 'Bilan hebdomadaire éditorial calculé chez vous.',                    en: 'Weekly editorial digest computed in your browser.' } },
  { slug: 'veillee',        title: { fr: 'La Veillée',              en: 'The Vigil' },                caption: { fr: 'Dimanche 21 h UTC, une phrase par minute, lue ensemble.',            en: 'Sunday 21:00 UTC, one sentence per minute, read together.' } },
  { slug: 'voix',           title: { fr: 'Les Voix',                en: 'The Voices' },               caption: { fr: 'Entretiens mensuels anonymes avec des traders en activité.',         en: 'Monthly anonymous interviews with working traders.' } },
  { slug: 'lexique',        title: { fr: 'Le Lexique vivant',       en: 'The Living Lexicon' },       caption: { fr: 'Chaque mot d’une leçon s’ouvre sur sa définition, au clic.',         en: 'Every word in a lesson opens to its definition, on click.' } },
  { slug: 'cercle',         title: { fr: 'Le Cercle de relecture',  en: 'The Reading Circle' },       caption: { fr: 'Chaque semaine, la Lettre d’un autre lecteur, en silence.',           en: 'Each week, another reader’s Letter, in silence.' } },
  { slug: 'almanach',       title: { fr: 'L’Almanach',              en: 'The Almanac' },              caption: { fr: 'Toutes les Criées de l’année sur une page.',                          en: 'Every Criée of the year on one page.' } },
  { slug: 'annuaire',       title: { fr: 'L’Annuaire',              en: 'The Index' },                caption: { fr: 'L’index alphabétique de toutes les leçons publiées.',                 en: 'The alphabetical index of every lesson published.' } },
  { slug: 'refus',          title: { fr: 'Le Refus',                en: 'The Refusal' },              caption: { fr: 'Dix choses que Tickra ne construira jamais.',                         en: 'Ten things Tickra will never build.' } },
  { slug: 'erratum',        title: { fr: 'L’Erratum',               en: 'The Erratum' },              caption: { fr: 'Journal public des erreurs de l’éditeur. Rien n’est effacé.',         en: 'Public log of editor mistakes. Nothing erased.' } },
  { slug: 'cote-inversee',  title: { fr: 'La Cote inversée',        en: 'The Inverted Score' },       caption: { fr: 'L’éditeur publie sa propre Cote chaque mois, même formule.',          en: 'The editor publishes their own Score monthly, same formula.' } },
  { slug: 'silence',        title: { fr: 'Le Silence éditorial',    en: 'The Editorial Silence' },    caption: { fr: 'Les patterns d’UI bannis : pastilles, confettis, pop-ups.',           en: 'Banished UI patterns: red dots, confetti, popups.' } },
  { slug: 'method',         title: { fr: 'La Méthode',              en: 'The Method' },               caption: { fr: 'La formule de la Cote, à l’air libre, en quatre lignes.',             en: 'The Score formula, in the open, in four lines.' } },
  { slug: 'etages',         title: { fr: 'Les Étages',              en: 'The Floors' },               caption: { fr: 'Trois étages, pas trois colonnes. La maison plutôt que le tarif.',    en: 'Three floors, not three columns. The house before the bill.' } },
  { slug: 'survie',         title: { fr: 'Le Calculateur de survie',en: 'The Survival Calculator' },  caption: { fr: 'Taille de position, R, pertes jusqu’au demi-compte. Local.',          en: 'Position size, R, losses to the half-account. Local.' } },
  { slug: 'journal',        title: { fr: 'Le Journal',              en: 'The Journal' },              caption: { fr: 'Le carnet, le Greffier, l’Autopsie, le Mur du silence.',              en: 'The register, the Registrar, the Autopsy, the Wall of Silence.' } },
  { slug: 'maison',         title: { fr: 'La Maison',               en: 'The House' },                caption: { fr: 'Plan d’ensemble de toutes les pièces éditoriales.',                   en: 'Full plan of every editorial room.' } },
  { slug: 'bureau-partage', title: { fr: 'Le Bureau partagé',       en: 'The Shared Desk' },          caption: { fr: 'Publier une journée de journal en lecture seule. En préparation.',    en: 'Publish a day of your journal read-only. In preparation.' } },
  { slug: 'edition-lifetime',title:{ fr: 'L’Édition Lifetime',      en: 'The Lifetime Edition' },     caption: { fr: 'Livret postal annuel des membres Lifetime. En préparation.',          en: 'Annual mailed booklet for Lifetime members. In preparation.' } },
  { slug: 'institutionnel', title: { fr: 'L’Institutionnel',        en: 'The Institutional' },        caption: { fr: 'Tickra pour les desks et prop-firms. Sur conversation.',              en: 'Tickra for desks and prop firms. On conversation.' } },
  { slug: 'mecenat',        title: { fr: 'Le Mécénat',              en: 'The Patronage' },            caption: { fr: 'Offrir un mois Pro à un inconnu, anonymement.',                       en: 'Anonymously gift one Pro month to a stranger.' } },
];

function stripAccents(s: string): string {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function compose(...parts: string[]): string {
  return stripAccents(parts.join(' · '));
}

// Build the full index. Called once at module load on the server.
function buildIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  // Editorial rooms
  for (const r of ROOMS) {
    entries.push({
      kind: 'piece',
      href: `/__LOCALE__/${r.slug}`,
      title: r.title,
      caption: r.caption,
      haystack: {
        fr: compose(r.title.fr, r.caption.fr, r.slug),
        en: compose(r.title.en, r.caption.en, r.slug),
      },
    });
  }

  // Lessons
  for (const track of TRACKS) {
    for (const lesson of track.lessons) {
      entries.push({
        kind: 'lesson',
        href: `/__LOCALE__/learn/${track.slug}/${lesson.slug}`,
        title: lesson.title,
        caption: { fr: track.title.fr, en: track.title.en },
        haystack: {
          fr: compose(lesson.title.fr, track.title.fr, track.summary.fr),
          en: compose(lesson.title.en, track.title.en, track.summary.en),
        },
      });
    }
  }

  // Glossary terms
  for (const term of GLOSSARY) {
    entries.push({
      kind: 'term',
      href: `/__LOCALE__/glossary#${encodeURIComponent(term.term.fr)}`,
      title: term.term,
      caption: term.definition,
      haystack: {
        fr: compose(term.term.fr, term.definition.fr),
        en: compose(term.term.en, term.definition.en),
      },
    });
  }

  return entries;
}

export const SEARCH_INDEX: SearchEntry[] = buildIndex();

export function normalizeQuery(q: string): string {
  return stripAccents(q.trim());
}
