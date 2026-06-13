import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { ReadNext } from '@/components/editorial/ReadNext';
import { Pull } from '@/components/editorial/Pull';

// /[locale]/etages — L'Étage Pro. Re-narrates Tickra's three tiers
// as floors of a building rather than columns of a pricing card.
// Pure editorial register, links the reader down toward /pricing
// only at the end. The story of the building, before the bill.

import { editorialMeta } from '@/lib/seo/editorial-meta';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';

export const revalidate = 86400;
export const metadata = editorialMeta({
  slug: 'etages',
  title: 'Les Étages',
  description:
    'Trois étages, pas trois colonnes : le rez-de-chaussée gratuit, l’atelier Pro, le bureau Lifetime. La pricing card, à la fin.',
});

type Etage = {
  level: number;
  name: { fr: string; en: string };
  role: { fr: string; en: string };
  rooms: { fr: string[]; en: string[] };
  ambience: { fr: string; en: string };
};

const ETAGES: Etage[] = [
  {
    level: 0,
    name: { fr: 'Le rez-de-chaussée', en: 'The ground floor' },
    role: { fr: 'Entrée libre', en: 'Free entry' },
    rooms: {
      fr: [
        'Les leçons publiques (toutes les leçons-vitrines).',
        'L’éditorial : Le Refus, L’Erratum, Les Voix, La Cote inversée.',
        'La Criée du jour, lue à la même heure pour tout le monde.',
        'L’Annuaire, l’Almanach et le Calculateur de survie.',
      ],
      en: [
        'Public lessons (every showcase lesson).',
        'Editorial: The Refusal, The Erratum, The Voices, The Inverted Score.',
        'Today’s Criée, read at the same hour by everyone.',
        'The Index, the Almanac and the Survival Calculator.',
      ],
    },
    ambience: {
      fr: 'On peut traverser cet étage des heures sans s’abonner. C’est voulu : ce qui compte vraiment doit être lisible avant qu’on demande quoi que ce soit.',
      en: 'You can spend hours on this floor without subscribing. That is intentional: what really matters must be readable before we ask anything.',
    },
  },
  {
    level: 1,
    name: { fr: 'L’atelier', en: 'The workshop' },
    role: { fr: 'Étage Pro', en: 'The Pro floor' },
    rooms: {
      fr: [
        'Le journal de trading complet, avec la courbe d’equity et le Greffier.',
        'L’Autopsie et la Lettre du dimanche, branchées sur votre carnet.',
        'Le Mur du silence, qui ferme le bureau après une mauvaise séquence.',
        'Le Rituel de rentrée et le Bureau du jour.',
      ],
      en: [
        'The full trading journal, with the equity curve and the Registrar.',
        'The Autopsy and the Sunday Letter, wired to your register.',
        'The Wall of Silence, which closes the bureau after a bad streak.',
        'The Return Ritual and the Daily Desk.',
      ],
    },
    ambience: {
      fr: 'C’est ici qu’on écrit. L’atelier est sobre, calme, sans tableau d’honneur. Le seul objet de gloire est votre carnet — et il ne sert qu’à vous.',
      en: 'This is where you write. The workshop is plain, calm, without honor boards. The only object of glory is your register — and it serves only you.',
    },
  },
  {
    level: 2,
    name: { fr: 'Le bureau de l’auteur', en: 'The author’s study' },
    role: { fr: 'Étage Lifetime', en: 'The Lifetime floor' },
    rooms: {
      fr: [
        'Tout l’atelier, sans renouvellement à signer.',
        'L’édition annuelle imprimée, envoyée par la poste — un livret de votre année.',
        'L’accès aux brouillons : les leçons en chantier, lisibles avant publication.',
        'Une heure de conversation annuelle avec l’éditeur, si vous la voulez.',
      ],
      en: [
        'Everything in the workshop, with no renewal to sign.',
        'The annual printed edition mailed worldwide — a booklet of your year.',
        'Access to drafts: lessons-in-progress, readable before publication.',
        'One hour of yearly conversation with the editor, if you want it.',
      ],
    },
    ambience: {
      fr: 'On y monte rarement. La porte reste entrouverte pour ceux qui veulent rester. La fidélité s’y achète une seule fois et se rend en silence.',
      en: 'Few come up here. The door stays ajar for those who want to stay. Loyalty is paid once, in silence.',
    },
  },
];

const COPY = {
  fr: {
    eyebrow: 'Les Étages — la maison plutôt que les colonnes',
    head1: 'Trois étages.',
    head2: 'Pas trois colonnes.',
    head3: 'Une seule maison.',
    intro:
      'La plupart des sites de trading affichent trois colonnes côte à côte, à hauteur d’œil, avec des cases à cocher. Tickra préfère une maison : on entre par le rez-de-chaussée, on monte si on veut, on redescend quand on veut. Voici l’organisation, étage par étage.',
    pricingCta: 'Voir le détail tarifaire',
    footer:
      'Ce sont les étages, pas les prix. Pour les chiffres, descendez à la page /pricing — elle ne porte que l’addition, jamais l’histoire.',
  },
  en: {
    eyebrow: 'The Floors — a house, not three columns',
    head1: 'Three floors.',
    head2: 'Not three columns.',
    head3: 'One house.',
    intro:
      'Most trading sites display three columns side by side, at eye level, with checkboxes. Tickra prefers a house: you enter on the ground floor, you go up if you want, you come back down when you want. Here is the organization, floor by floor.',
    pricingCta: 'See the pricing detail',
    footer:
      'These are the floors, not the prices. For the numbers, go down to /pricing — that page carries the bill, never the story.',
  },
} as const;

export default async function EtagesPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  return (
    <>
      <EditorialJsonLd
        slug="etages"
        title={locale === 'fr' ? 'Les Étages' : 'The Floors'}
        description={locale === 'fr'
          ? 'Trois étages, pas trois colonnes. La maison plutôt que le tarif.'
          : 'Three floors, not three columns. The house before the bill.'}
        locale={locale}
      />
      <EditorialFrame
        dict={dict}
        locale={locale}
        eyebrow={t.eyebrow}
        status={`${ETAGES.length} ${locale === 'fr' ? 'étages' : 'floors'}`}
        head={[t.head1, t.head2, t.head3]}
        intro={t.intro}
      >
        <section className="mx-auto max-w-[920px] px-6 md:px-16">
          <Pull>
            {locale === 'fr' ? 'La maison plutôt que les colonnes.' : 'The house, not the columns.'}
          </Pull>
        </section>

        <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
          {[...ETAGES].reverse().map((e, i) => (
            <article
              key={e.level}
              className="border-t border-black/15 pt-12 mt-16 first:mt-0 first:border-0 first:pt-0"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65 tabular-nums">
                    {locale === 'fr' ? 'Étage' : 'Floor'} {e.level === 0 ? '0' : `+${e.level}`} · {e.role[locale]}
                  </span>
                  <h2
                    className="mt-3 font-display italic text-[#0E0E0E]"
                    style={{ fontSize: 'clamp(32px, 4vw, 50px)', letterSpacing: '-0.025em' }}
                  >
                    {e.name[locale]}
                  </h2>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 tabular-nums">
                  {String(ETAGES.length - i).padStart(2, '0')}
                </span>
              </header>

              <ul className="mt-8 space-y-3 max-w-[680px]">
                {e.rooms[locale].map((line, idx) => (
                  <li
                    key={idx}
                    className="grid grid-cols-[2ch_1fr] items-baseline gap-x-5"
                  >
                    <span className="font-mono text-[10px] tracking-[0.22em] text-black/35 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span
                      className="font-display text-[#0E0E0E]/85"
                      style={{ fontSize: 'clamp(16px, 1.65vw, 19px)' }}
                    >
                      {line}
                    </span>
                  </li>
                ))}
              </ul>

              <p
                className="mt-8 font-display italic text-[#0E0E0E]/65 max-w-[640px]"
                style={{ fontSize: 'clamp(15px, 1.55vw, 18px)' }}
              >
                {e.ambience[locale]}
              </p>
            </article>
          ))}

          <div className="mt-24 border-t border-black/15 pt-10 flex items-baseline justify-between gap-6">
            <p className="font-mono text-[10.5px] leading-relaxed text-black/65 max-w-[480px]">
              {t.footer}
            </p>
            <Link
              href={`/${locale}/pricing`}
              className="inline-flex h-10 items-center rounded-full border border-black/70 px-5 font-mono text-[11px] uppercase tracking-[0.22em] text-[#0E0E0E] hover:bg-[#0E0E0E] hover:text-[#F4F1EA] transition-colors"
            >
              {t.pricingCta} →
            </Link>
          </div>
        </section>
        <ReadNext
          locale={locale}
          rooms={[
            {
              slug: 'refus',
              title: { fr: 'Le Refus', en: 'The Refusal' },
              caption: {
                fr: 'Ce que ces étages n’hébergeront jamais.',
                en: 'What these floors will never host.',
              },
            },
            {
              slug: 'silence',
              title: { fr: 'Le Silence éditorial', en: 'The Editorial Silence' },
              caption: {
                fr: 'L’UI commune aux trois étages, sans pastilles.',
                en: 'The shared UI across the three floors, without dots.',
              },
            },
            {
              slug: 'mecenat',
              title: { fr: 'Le Mécénat', en: 'The Patronage' },
              caption: {
                fr: 'Un autre étage, payé pour un inconnu.',
                en: 'Another floor, paid for a stranger.',
              },
            },
          ]}
        />
      </EditorialFrame>
    </>
  );
}
