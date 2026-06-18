import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { editorialPageMeta } from '@/lib/seo/editorial-meta';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';
import { RoomBreadcrumb } from '@/components/seo/RoomBreadcrumb';
import { SilenceItemListJsonLd } from '@/components/seo/SilenceItemListJsonLd';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { ReadNext } from '@/components/editorial/ReadNext';
import { Pull } from '@/components/editorial/Pull';

// /[locale]/silence — Le Silence éditorial. A second manifesto, this
// one about the UI itself. Lists every gamified pattern Tickra
// refuses to display: red dots, unread counts, congratulatory
// modals, badge animations, confetti, streak fireworks. Pairs with
// /refus (what we won't build) and /erratum (what we got wrong).

export const revalidate = 86400;
export const generateMetadata = editorialPageMeta({
  slug: 'silence',
  title: { fr: 'Le Silence éditorial', en: 'The Editorial Silence' },
  description: {
    fr: 'Les patterns d’UI que Tickra ne déploiera pas : points rouges, compteurs de notifications, confettis, badges flatteurs. La règle de l’interface.',
    en: 'UI patterns Tickra will not display: red dots, notification counters, confetti, flattering badges. The interface rule.',
  },
});

type Banished = {
  id: string;
  pattern: { fr: string; en: string };
  why: { fr: string; en: string };
  prose: { fr: string; en: string };
};

const BANISHED: Banished[] = [
  {
    id: 'red-dots',
    pattern: { fr: 'Les pastilles rouges', en: 'The red dots' },
    why: {
      fr: 'Une pastille rouge n’est pas une information : c’est un appel à finir une tâche que vous n’avez pas choisie.',
      en: 'A red dot is not information: it is a call to finish a task you did not choose.',
    },
    prose: {
      fr: 'À la place, on écrit : « trois choses vous attendent ». Vous décidez si vous voulez les ouvrir.',
      en: 'In its place, we write: "three things await you." You decide whether to open them.',
    },
  },
  {
    id: 'unread-counts',
    pattern: { fr: 'Les compteurs de non-lus', en: 'The unread counters' },
    why: {
      fr: 'Le « 47 » dans un cercle ne hiérarchise pas — il pèse. Et il pèse même quand vous fermez l’onglet.',
      en: 'The “47” in a circle does not prioritize — it weighs. And it weighs even when you close the tab.',
    },
    prose: {
      fr: 'On laisse la liste. Pas de chiffre, pas d’icône. Si vous n’avez pas lu, vous n’avez pas lu — c’est lisible sans annonce.',
      en: 'We leave the list. No number, no icon. If you have not read, you have not read — that is legible without announcement.',
    },
  },
  {
    id: 'confetti',
    pattern: { fr: 'Les confettis et les animations de félicitation', en: 'Confetti and congratulatory animations' },
    why: {
      fr: 'On ne fête pas un trade gagnant. Le métier le sait, et le métier ne fait pas la fête.',
      en: 'We do not celebrate a winning trade. The craft knows it, and the craft does not celebrate.',
    },
    prose: {
      fr: 'À la place, le journal note. La Cote bouge d’un dixième. C’est suffisant.',
      en: 'In its place, the journal records. The Score moves by a tenth. That is enough.',
    },
  },
  {
    id: 'streak-fireworks',
    pattern: { fr: 'Les feux d’artifice de streak', en: 'Streak fireworks' },
    why: {
      fr: 'Un streak qui explose en bande-annonce, c’est de la motivation à la chaleur. Elle retombe avec la première session manquée.',
      en: 'A streak that explodes into a trailer is heat-driven motivation. It collapses with the first missed session.',
    },
    prose: {
      fr: 'On écrit le chiffre sur le Bureau, en serif, sans relief. Le calendrier garde la trace ; c’est tout.',
      en: 'We write the number on the Desk, in serif, without flair. The calendar keeps the record; that is all.',
    },
  },
  {
    id: 'achievement-popups',
    pattern: { fr: 'Les pop-ups de succès débloqué', en: 'Achievement-unlocked pop-ups' },
    why: {
      fr: 'Un succès débloqué qui s’affiche par-dessus votre lecture vous fait perdre la phrase que vous étiez en train de finir.',
      en: 'An unlocked-achievement popup over your reading makes you lose the sentence you were finishing.',
    },
    prose: {
      fr: 'Les succès se consultent à leur étage. Aucune notification n’interrompt une page.',
      en: 'Achievements are read on their own floor. No notification interrupts a page.',
    },
  },
  {
    id: 'level-up',
    pattern: { fr: 'Les niveaux qui montent par paliers', en: 'Levels that go up in steps' },
    why: {
      fr: 'Devenir « niveau 7 » n’apprend rien à personne. La Cote est continue, granuleuse, et elle baisse aussi.',
      en: 'Becoming "level 7" teaches no one anything. The Score is continuous, granular, and goes down too.',
    },
    prose: {
      fr: 'Une note décimale, mise à jour à chaque trade, qui peut s’éroder en silence. C’est moins gratifiant ; c’est plus juste.',
      en: 'A decimal score, updated on every trade, which can erode in silence. Less rewarding; more accurate.',
    },
  },
  {
    id: 'social-proof',
    pattern: { fr: 'Le « 12 personnes regardent cette leçon en ce moment »', en: 'The "12 people are viewing this lesson now"' },
    why: {
      fr: 'La présence d’autres lecteurs n’ajoute rien à la leçon. Elle ajoute une pression sociale, c’est tout.',
      en: 'The presence of other readers adds nothing to the lesson. It adds social pressure, that is all.',
    },
    prose: {
      fr: 'Vous lisez seul. Vos compagnons sont sur la Veillée du dimanche, à l’heure dite. C’est mieux.',
      en: 'You read alone. Your companions are on the Sunday Vigil, at the chosen hour. It is better.',
    },
  },
  {
    id: 'progress-bars',
    pattern: { fr: 'Les barres de progression au-dessus de tout', en: 'Progress bars on top of everything' },
    why: {
      fr: 'Une barre de progression dit : « il reste 37 % à faire ». Elle ne dit pas si vous avez compris.',
      en: 'A progress bar says: "37% to go." It does not say whether you understood.',
    },
    prose: {
      fr: 'On affiche les leçons terminées, en mots, avec leur date. C’est ce que vous avez lu — pas ce qu’il vous reste à cocher.',
      en: 'We display finished lessons, in words, with their date. That is what you read — not what is left to check off.',
    },
  },
  {
    id: 'streak-shame',
    pattern: { fr: 'Les écrans de « ne perdez pas votre streak »', en: '"Do not lose your streak" screens' },
    why: {
      fr: 'La peur de perdre un streak n’est pas de la discipline : c’est une dette émotionnelle vendue comme un service.',
      en: 'Fear of losing a streak is not discipline: it is emotional debt sold as a service.',
    },
    prose: {
      fr: 'Quand le streak tombe, le Rituel de rentrée nomme la rupture et propose une leçon. Sans honte.',
      en: 'When the streak falls, the Return Ritual names the gap and offers a lesson. Without shame.',
    },
  },
  {
    id: 'gamified-onboarding',
    pattern: { fr: 'L’onboarding gamifié à coups d’étapes cochées', en: 'Gamified onboarding with checkmark steps' },
    why: {
      fr: 'Cocher des cases pour « débloquer » Tickra suggère qu’il y a un piège. Il n’y en a pas — la maison est ouverte.',
      en: 'Checking boxes to "unlock" Tickra suggests there is a trick. There is none — the house is open.',
    },
    prose: {
      fr: 'Le rez-de-chaussée est lisible sans rien remplir. Si vous voulez monter à l’atelier, vous montez ; sinon, vous lisez.',
      en: 'The ground floor is readable without filling anything. If you want to go up to the workshop, you go up; otherwise, you read.',
    },
  },
];

const COPY = {
  fr: {
    eyebrow: 'Le Silence éditorial — règle d’interface',
    head1: 'Ce que',
    head2: 'l’écran',
    head3: 'ne fera pas.',
    intro:
      'Le Refus dit ce que Tickra ne construira jamais. Le Silence éditorial dit comment Tickra ne vous parlera jamais. Les pastilles, les confettis, les pop-ups, les paliers : ils ont leur grammaire ailleurs. Ici, on écrit en lettres.',
    counters: (n: number) => `${n} patterns bannis. La liste s’allongera plutôt que de raccourcir.`,
    refusLink: 'Voir aussi : Le Refus',
    erratumLink: 'Et : L’Erratum',
    footer:
      'Si vous voyez une pastille rouge, un compteur ou un confetti quelque part sur Tickra, écrivez-nous. Ce sera consigné dans /erratum avant d’être retiré.',
    instead: 'À la place',
  },
  en: {
    eyebrow: 'The Editorial Silence — interface rule',
    head1: 'What the',
    head2: 'screen',
    head3: 'will not do.',
    intro:
      'The Refusal says what Tickra will never build. The Editorial Silence says how Tickra will never speak to you. Dots, confetti, popups, tiers: they have their grammar elsewhere. Here, we write in letters.',
    counters: (n: number) => `${n} banished patterns. The list will grow rather than shrink.`,
    refusLink: 'See also: The Refusal',
    erratumLink: 'And: The Erratum',
    footer:
      'If you see a red dot, a counter, or confetti anywhere on Tickra, write to us. It will be logged in /erratum before being removed.',
    instead: 'In its place',
  },
} as const;

export default async function SilencePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  return (
    <>
      <EditorialJsonLd
        slug="silence"
        title={locale === 'fr' ? 'Le Silence éditorial' : 'The Editorial Silence'}
        description={locale === 'fr'
          ? 'Les patterns d’UI que Tickra ne déploiera pas.'
          : 'UI patterns Tickra will not display.'}
        locale={locale}
      />
      <RoomBreadcrumb
        locale={locale}
        slug="silence"
        title={{ fr: 'Le Silence éditorial', en: 'The Editorial Silence' }}
      />
      <SilenceItemListJsonLd
        locale={locale}
        entries={BANISHED.map((b) => ({
          id: b.id,
          pattern: b.pattern[locale],
          why: b.why[locale],
          prose: b.prose[locale],
        }))}
      />
      <EditorialFrame
        dict={dict}
        locale={locale}
        eyebrow={t.eyebrow}
        status={t.counters(BANISHED.length)}
        head={[t.head1, t.head2, t.head3]}
        intro={t.intro}
      >
        <section className="mx-auto max-w-[920px] px-6 md:px-16">
          <Pull>
            {locale === 'fr' ? 'On écrit en lettres. Pas en pastilles.' : 'We write in letters. Not in dots.'}
          </Pull>
        </section>
        <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-16">
          <ol className="space-y-16">
            {BANISHED.map((b, i) => (
              <li
                key={b.id}
                id={b.id}
                className="grid grid-cols-[3ch_1fr] gap-x-8 items-baseline border-t border-black/15 pt-10 first:border-0 first:pt-0 scroll-mt-24"
              >
                <span className="font-mono text-[11px] tracking-[0.22em] text-black/35 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h2
                    className="font-display italic text-[#0E0E0E]"
                    style={{ fontSize: 'clamp(24px, 3vw, 34px)', letterSpacing: '-0.018em', lineHeight: 1.1 }}
                    aria-label={locale === 'fr' ? `Banni : ${b.pattern[locale]}` : `Banished: ${b.pattern[locale]}`}
                  >
                    <del className="decoration-black/25 decoration-1">{b.pattern[locale]}</del>
                  </h2>
                  <p
                    className="mt-5 font-display leading-relaxed text-[#0E0E0E]/80 max-w-[640px]"
                    style={{ fontSize: 'clamp(15px, 1.55vw, 18px)' }}
                  >
                    {b.why[locale]}
                  </p>
                  <div className="mt-5 border-l border-black/15 pl-5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65">
                      {t.instead}
                    </span>
                    <p
                      className="mt-2 font-display italic leading-relaxed text-[#0E0E0E]/80 max-w-[640px]"
                      style={{ fontSize: 'clamp(15px, 1.55vw, 18px)' }}
                    >
                      {b.prose[locale]}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
          <div className="border-t border-black/15 pt-10 flex flex-wrap items-baseline justify-between gap-4">
            <p className="font-mono text-[10.5px] leading-relaxed text-black/65 max-w-[480px]">
              {t.footer}
            </p>
            <div className="flex gap-6">
              <Link
                href={`/${locale}/refus`}
                className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 hover:text-black/90"
              >
                {t.refusLink} →
              </Link>
              <Link
                href={`/${locale}/erratum`}
                className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 hover:text-black/90"
              >
                {t.erratumLink} →
              </Link>
            </div>
          </div>
        </section>
        <ReadNext
          locale={locale}
          rooms={[
            {
              slug: 'refus',
              title: { fr: 'Le Refus', en: 'The Refusal' },
              caption: {
                fr: 'Les features mères de ces patterns. Bannies ailleurs.',
                en: 'The mother features of these patterns. Banned elsewhere.',
              },
            },
            {
              slug: 'method',
              title: { fr: 'La Méthode', en: 'The Method' },
              caption: {
                fr: 'La seule mesure qu’on accepte : la Cote, écrite à l’air libre.',
                en: 'The only metric we accept: the Score, in the open.',
              },
            },
            {
              slug: 'etages',
              title: { fr: 'Les Étages', en: 'The Floors' },
              caption: {
                fr: 'La maison plutôt que les colonnes. Le calme avant le tarif.',
                en: 'The house before the columns. Calm before the bill.',
              },
            },
          ]}
        />
      </EditorialFrame>
    </>
  );
}
