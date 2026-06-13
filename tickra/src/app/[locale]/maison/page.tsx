import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';

// /[locale]/maison — La Maison. A single index of every editorial
// piece Tickra has built. The Navbar will stay slim; this page
// carries the full map. Organised by floor (rituals / readings /
// archives / manifestos) so the reader can find a calm room without
// scrolling through a menu.

import { editorialMeta } from '@/lib/seo/editorial-meta';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';

export const revalidate = 86400;
export const metadata = editorialMeta({
  slug: 'maison',
  title: 'La Maison',
  description:
    'Plan de la maison Tickra : toutes les pièces éditoriales sur une seule page. Rituels, lectures, archives, manifestes.',
});

type Room = {
  slug: string;
  title: { fr: string; en: string };
  caption: { fr: string; en: string };
  signed?: boolean;
};

type Wing = {
  id: 'rituels' | 'lectures' | 'archives' | 'manifestes' | 'outils' | 'attente';
  title: { fr: string; en: string };
  rooms: Room[];
};

const WINGS: Wing[] = [
  {
    id: 'rituels',
    title: { fr: 'Les rituels', en: 'The rituals' },
    rooms: [
      {
        slug: 'criee',
        title: { fr: 'La Criée', en: 'The Criée' },
        caption: {
          fr: 'Une question par jour, identique pour tout le monde, à minuit UTC.',
          en: 'One question a day, the same for everyone, at midnight UTC.',
        },
      },
      {
        slug: 'lettre',
        title: { fr: 'La Lettre du dimanche', en: 'The Sunday Letter' },
        caption: {
          fr: 'Le bilan hebdomadaire éditorial, calculé chez vous.',
          en: 'The weekly editorial digest, computed in your browser.',
        },
        signed: true,
      },
      {
        slug: 'veillee',
        title: { fr: 'La Veillée', en: 'The Vigil' },
        caption: {
          fr: 'Trente minutes, dimanche 21 h UTC, une phrase par minute, lue ensemble.',
          en: 'Thirty minutes, Sunday 21:00 UTC, one sentence per minute, read together.',
        },
      },
      {
        slug: 'rentree',
        title: { fr: 'Le Carnet d’absence', en: 'The Absence Register' },
        caption: {
          fr: 'Ce qui s’est passé sans vous. Calculé chez vous.',
          en: 'What happened without you. Computed in your browser.',
        },
        signed: true,
      },
    ],
  },
  {
    id: 'lectures',
    title: { fr: 'Les lectures', en: 'The readings' },
    rooms: [
      {
        slug: 'voix',
        title: { fr: 'Les Voix', en: 'The Voices' },
        caption: {
          fr: 'Un entretien mensuel anonyme avec un trader en activité.',
          en: 'One monthly anonymous interview with a working trader.',
        },
      },
      {
        slug: 'lexique',
        title: { fr: 'Le Lexique vivant', en: 'The Living Lexicon' },
        caption: {
          fr: 'Chaque mot d’une leçon s’ouvre sur sa définition, au clic.',
          en: 'Every word in a lesson opens to its definition, on click.',
        },
      },
      {
        slug: 'cercle',
        title: { fr: 'Le Cercle de relecture', en: 'The Reading Circle' },
        caption: {
          fr: 'Chaque semaine, la Lettre d’un autre lecteur. Sans messagerie, sans visage.',
          en: 'Each week, another reader’s Letter. No messaging, no face.',
        },
        signed: true,
      },
    ],
  },
  {
    id: 'archives',
    title: { fr: 'Les archives', en: 'The archives' },
    rooms: [
      {
        slug: 'almanach',
        title: { fr: 'L’Almanach', en: 'The Almanac' },
        caption: {
          fr: 'Toutes les Criées de l’année, antéchronologiques, sur une page.',
          en: 'Every Criée of the year, antechronological, on one page.',
        },
      },
      {
        slug: 'annuaire',
        title: { fr: 'L’Annuaire', en: 'The Index' },
        caption: {
          fr: 'L’index alphabétique de toutes les leçons publiées.',
          en: 'The alphabetical index of every lesson published.',
        },
      },
      {
        slug: 'recherche',
        title: { fr: 'La Recherche', en: 'The Search' },
        caption: {
          fr: 'Une boîte vide qui cherche dans les leçons, le glossaire et les pièces. Local.',
          en: 'An empty box that searches lessons, glossary and rooms. Local.',
        },
      },
      {
        slug: 'random',
        title: { fr: 'Une pièce au hasard', en: 'A room at random' },
        caption: {
          fr: 'Le tirage uniforme parmi les vingt-deux pièces, candor-stubs inclus.',
          en: 'A uniform draw among the twenty-two rooms, candor-stubs included.',
        },
      },
    ],
  },
  {
    id: 'manifestes',
    title: { fr: 'Les manifestes', en: 'The manifestos' },
    rooms: [
      {
        slug: 'refus',
        title: { fr: 'Le Refus', en: 'The Refusal' },
        caption: {
          fr: 'Dix choses que Tickra ne construira jamais. Permanent.',
          en: 'Ten things Tickra will never build. Permanent.',
        },
      },
      {
        slug: 'erratum',
        title: { fr: 'L’Erratum', en: 'The Erratum' },
        caption: {
          fr: 'Journal public des erreurs de l’éditeur. Rien n’est effacé.',
          en: 'Public log of the editor’s mistakes. Nothing is erased.',
        },
      },
      {
        slug: 'cote-inversee',
        title: { fr: 'La Cote inversée', en: 'The Inverted Score' },
        caption: {
          fr: 'L’éditeur publie sa propre Cote chaque mois, même formule.',
          en: 'The editor publishes their own Score monthly, same formula.',
        },
      },
      {
        slug: 'silence',
        title: { fr: 'Le Silence éditorial', en: 'The Editorial Silence' },
        caption: {
          fr: 'Les patterns d’UI bannis : pastilles, confettis, pop-ups de niveaux.',
          en: 'Banished UI patterns: red dots, confetti, level-up popups.',
        },
      },
      {
        slug: 'method',
        title: { fr: 'La Méthode', en: 'The Method' },
        caption: {
          fr: 'La formule de la Cote, à l’air libre, en quatre lignes.',
          en: 'The Score formula, in the open, in four lines.',
        },
      },
      {
        slug: 'etages',
        title: { fr: 'Les Étages', en: 'The Floors' },
        caption: {
          fr: 'Trois étages, pas trois colonnes. La maison plutôt que le tarif.',
          en: 'Three floors, not three columns. The house before the bill.',
        },
      },
    ],
  },
  {
    id: 'outils',
    title: { fr: 'Les outils calmes', en: 'The calm tools' },
    rooms: [
      {
        slug: 'survie',
        title: { fr: 'Le Calculateur de survie', en: 'The Survival Calculator' },
        caption: {
          fr: 'Taille de position, R, pertes jusqu’au demi-compte. Local.',
          en: 'Position size, R, losses to the half-account. Local.',
        },
      },
      {
        slug: 'journal',
        title: { fr: 'Le Journal et le Greffier', en: 'The Journal and the Registrar' },
        caption: {
          fr: 'Le carnet de trading, l’Autopsie, le Mur du silence.',
          en: 'The trading register, the Autopsy, the Wall of Silence.',
        },
        signed: true,
      },
    ],
  },
  {
    id: 'attente',
    title: { fr: 'En préparation', en: 'In preparation' },
    rooms: [
      {
        slug: 'bureau-partage',
        title: { fr: 'Le Bureau partagé', en: 'The Shared Desk' },
        caption: {
          fr: 'Publier une journée de journal en lecture seule. Protocole, sans serveur encore.',
          en: 'Publish a day of your journal read-only. Protocol, server pending.',
        },
      },
      {
        slug: 'edition-lifetime',
        title: { fr: 'L’Édition Lifetime', en: 'The Lifetime Edition' },
        caption: {
          fr: 'Le livret postal annuel des membres Lifetime. Brochure du sommaire.',
          en: 'The annual postal booklet for Lifetime members. Tentative contents.',
        },
      },
      {
        slug: 'institutionnel',
        title: { fr: 'L’Institutionnel', en: 'The Institutional' },
        caption: {
          fr: 'Tickra pour les desks et prop-firms. Sur conversation.',
          en: 'Tickra for desks and prop firms. On conversation.',
        },
      },
      {
        slug: 'mecenat',
        title: { fr: 'Le Mécénat', en: 'The Patronage' },
        caption: {
          fr: 'Offrir un mois Pro anonyme à un inconnu. Activation Stripe en attente.',
          en: 'Anonymously gift one Pro month to a stranger. Stripe activation pending.',
        },
      },
    ],
  },
];

const COPY = {
  fr: {
    eyebrow: 'La Maison — plan d’ensemble',
    head1: 'Le plan.',
    head2: 'D’une seule pièce.',
    head3: 'Une porte par lieu.',
    intro:
      'Tickra n’est pas un menu déroulant. C’est une maison. Voici le plan complet : les rituels au sud, les lectures au nord, les archives en sous-sol, les manifestes au mur du salon, les outils calmes près de la fenêtre. Vous entrez par où vous voulez.',
    signedNote: '· Connexion requise',
    footer:
      'Cette page sert de plan. Si vous cherchez une notion précise, l’Annuaire la liste par ordre alphabétique. Si vous voulez écrire, le Journal vous attend ; si vous voulez vous taire, La Veillée le dimanche.',
  },
  en: {
    eyebrow: 'The House — full plan',
    head1: 'The plan.',
    head2: 'In one room.',
    head3: 'One door per place.',
    intro:
      'Tickra is not a dropdown menu. It is a house. Here is the full plan: the rituals to the south, the readings to the north, the archives in the basement, the manifestos on the parlor wall, the calm tools near the window. You enter wherever you like.',
    signedNote: '· Sign-in required',
    footer:
      'This page serves as a plan. If you are looking for a specific notion, the Index lists them alphabetically. If you want to write, the Journal awaits; if you want to stay silent, La Veillée on Sunday.',
  },
} as const;

export default async function MaisonPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];
  const total = WINGS.reduce((n, w) => n + w.rooms.length, 0);

  return (
    <>
      <EditorialJsonLd
        slug="maison"
        title={locale === 'fr' ? 'La Maison' : 'The House'}
        description={locale === 'fr'
          ? 'Plan de la maison Tickra : toutes les pièces éditoriales sur une page.'
          : 'Plan of the Tickra house: every editorial room on one page.'}
        locale={locale}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Tickra', path: `/${locale}` },
          {
            name: locale === 'fr' ? 'La Maison' : 'The House',
            path: `/${locale}/maison`,
          },
        ]}
      />
      <EditorialFrame
        dict={dict}
        locale={locale}
        eyebrow={t.eyebrow}
        status={`${total} ${locale === 'fr' ? 'pièces · ' : 'rooms · '}${WINGS.length} ${locale === 'fr' ? 'ailes' : 'wings'}`}
        head={[t.head1, t.head2, t.head3]}
        intro={t.intro}
      >

        <section className="mx-auto max-w-[1100px] px-6 md:px-16 pb-32">
          <div className="grid gap-x-16 gap-y-16 md:grid-cols-2">
            {WINGS.map((wing) => (
              <section key={wing.id} aria-labelledby={`w-${wing.id}`}>
                <div className="flex items-baseline gap-4 border-b border-black/15 pb-3">
                  <h2
                    id={`w-${wing.id}`}
                    className="font-display italic text-[#0E0E0E]"
                    style={{ fontSize: 'clamp(24px, 2.6vw, 30px)', letterSpacing: '-0.018em' }}
                  >
                    {wing.title[locale]}
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65 tabular-nums">
                    {wing.rooms.length}
                  </span>
                </div>

                <ol className="mt-6 divide-y divide-black/12">
                  {wing.rooms.map((room) => (
                    <li key={room.slug}>
                      <Link
                        href={`/${locale}/${room.slug}`}
                        className="block py-4 hover:bg-black/[0.02] -mx-3 px-3 transition-colors"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <span
                            className="font-display italic text-[#0E0E0E]"
                            style={{ fontSize: 'clamp(17px, 1.8vw, 21px)', letterSpacing: '-0.015em' }}
                          >
                            {room.title[locale]}
                          </span>
                          {room.signed && (
                            <span className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-black/65">
                              {t.signedNote}
                            </span>
                          )}
                        </div>
                        <p
                          className="mt-1 font-display text-[#0E0E0E]/65 text-balance"
                          style={{ fontSize: 'clamp(14px, 1.4vw, 16.5px)', lineHeight: 1.4 }}
                        >
                          {room.caption[locale]}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>

          <footer className="mt-24 border-t border-black/15 pt-6">
            <p className="font-mono text-[10.5px] leading-relaxed text-black/65 max-w-[640px]">
              {t.footer}
            </p>
          </footer>
        </section>
      </EditorialFrame>
    </>
  );
}
