import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { ReadNext } from '@/components/editorial/ReadNext';
import { TRACKS } from '@/lib/curriculum/data';
import { isSeeded } from '@/lib/curriculum/lesson-content';

// /[locale]/annuaire — the phonebook. One alphabetical index of
// every lesson across every track, with the track label as the
// source line. Pure server render from the existing curriculum
// data. Useful as a memory palace and as a long-tail SEO map.

import { editorialPageMeta } from '@/lib/seo/editorial-meta';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';
import { RoomBreadcrumb } from '@/components/seo/RoomBreadcrumb';
import { AnnuaireItemListJsonLd } from '@/components/seo/AnnuaireItemListJsonLd';

export const revalidate = 3600;
export const generateMetadata = editorialPageMeta({
  slug: 'annuaire',
  title: { fr: 'L’Annuaire', en: 'The Index' },
  description: {
    fr: 'L’index alphabétique de toutes les leçons publiées sur Tickra. Une seule page, navigable au clavier, faite pour être lue lentement.',
    en: 'The alphabetical index of every lesson published on Tickra. One page, keyboard-navigable, made to be read slowly.',
  },
});

const COPY = {
  fr: {
    eyebrow: 'L’Annuaire — index alphabétique',
    head1: 'Tout ce qu’on',
    head2: 'a écrit.',
    head3: 'Sur une seule page.',
    intro:
      'L’Annuaire liste, par ordre alphabétique, chaque leçon publiée sur Tickra. Pas de filtres, pas de tags, pas de recommandations : une page sobre, faite pour être lue par sauts ou par balayage. C’est aussi la mémoire du site — si une notion n’apparaît pas ici, c’est qu’elle n’existe pas chez nous.',
    counts: (n: number, tracks: number) =>
      `${n} leçons sur ${tracks} pistes. Mise à jour automatique.`,
    footer:
      'Index recalculé à chaque chargement à partir du modèle curriculaire. Si vous repérez un doublon ou une faute, /erratum est l’endroit où nous le consignerons.',
  },
  en: {
    eyebrow: 'The Almanac — alphabetical index',
    head1: 'Everything we',
    head2: 'have written.',
    head3: 'On one page.',
    intro:
      'L’Annuaire lists, in alphabetical order, every lesson published on Tickra. No filters, no tags, no recommendations: a calm page, made to be read by leaps or by scanning. It is also the site’s memory — if a notion does not appear here, it does not exist in our work.',
    counts: (n: number, tracks: number) =>
      `${n} lessons across ${tracks} tracks. Updates automatically.`,
    footer:
      'Index is recomputed on every load from the curriculum model. If you spot a duplicate or a typo, /erratum is where we will log it.',
  },
} as const;

type Row = {
  letter: string;
  title: string;
  href: string;
  trackTitle: string;
  /** Lesson id; used to filter unseeded entries out of the
   * structured ItemList while keeping the visual index complete. */
  lessonId: string;
};

function buildRows(locale: Locale): Row[] {
  const rows: Row[] = [];
  for (const track of TRACKS) {
    for (const lesson of track.lessons) {
      const title = lesson.title[locale];
      const letter = title
        .normalize('NFKD')
        .replace(/[^\p{L}\p{N}]/gu, '')
        .charAt(0)
        .toUpperCase();
      rows.push({
        letter: letter || '·',
        title,
        href: `/${locale}/learn/${track.slug}/${lesson.slug}`,
        trackTitle: track.title[locale],
        lessonId: lesson.id,
      });
    }
  }
  rows.sort((a, b) => a.title.localeCompare(b.title, locale));
  return rows;
}

function groupByLetter(rows: Row[]): Map<string, Row[]> {
  const m = new Map<string, Row[]>();
  for (const r of rows) {
    if (!m.has(r.letter)) m.set(r.letter, []);
    m.get(r.letter)!.push(r);
  }
  return m;
}

export default async function AnnuairePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  const rows = buildRows(locale);
  const groups = groupByLetter(rows);
  const letters = [...groups.keys()].sort((a, b) => a.localeCompare(b, locale));

  return (
    <>
      <EditorialJsonLd
        slug="annuaire"
        title={locale === 'fr' ? 'L’Annuaire' : 'The Index'}
        description={locale === 'fr'
          ? 'L’index alphabétique de toutes les leçons publiées.'
          : 'The alphabetical index of every lesson published.'}
        locale={locale}
      />
      <RoomBreadcrumb
        locale={locale}
        slug="annuaire"
        title={{ fr: 'L’Annuaire', en: 'The Index' }}
      />
      <AnnuaireItemListJsonLd
        locale={locale}
        // Skip unseeded lessons: the destination page noindexes itself
        // until a real body lands, so listing them in the structured
        // catalogue would waste crawl budget on guaranteed-noindex
        // URLs. Visual rows below stay complete — readers see the
        // full curriculum, crawlers see only the indexable subset.
        entries={rows
          .filter((r) => isSeeded(r.lessonId))
          .map((r) => ({ title: r.title, href: r.href, trackTitle: r.trackTitle }))}
      />
      <EditorialFrame
        dict={dict}
        locale={locale}
        eyebrow={t.eyebrow}
        status={t.counts(rows.length, TRACKS.length)}
        head={[t.head1, t.head2, t.head3]}
        intro={t.intro}
      >

        <section className="mx-auto max-w-[1100px] px-6 md:px-16 pb-32">
          {letters.map((letter) => (
            <div key={letter} id={`letter-${letter}`} className="mt-16 first:mt-0 scroll-mt-24">
              <div className="flex items-baseline gap-6 border-b border-black/15 pb-3">
                <span
                  className="font-display italic text-[#0E0E0E]/85 tabular-nums"
                  style={{ fontSize: 'clamp(32px, 4vw, 50px)', letterSpacing: '-0.03em' }}
                >
                  {letter}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65 tabular-nums">
                  {groups.get(letter)!.length}
                </span>
              </div>

              <ol className="mt-6 divide-y divide-black/12">
                {groups.get(letter)!.map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 py-3 hover:bg-black/[0.02] -mx-3 px-3 transition-colors"
                    >
                      <span
                        className="font-display italic text-[#0E0E0E]/85 text-balance"
                        style={{ fontSize: 'clamp(16px, 1.65vw, 19px)' }}
                      >
                        {r.title}
                      </span>
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-black/40">
                        {r.trackTitle}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ))}

          <footer className="mt-24 border-t border-black/15 pt-6">
            <p className="font-mono text-[10.5px] leading-relaxed text-black/65 max-w-[640px]">
              {t.footer}
            </p>
          </footer>
        </section>
        <ReadNext
          locale={locale}
          rooms={[
            {
              slug: 'almanach',
              title: { fr: 'L’Almanach', en: 'The Almanac' },
              caption: {
                fr: 'Les Criées de l’année, sur une seule page.',
                en: 'The year’s Criées, on one page.',
              },
            },
            {
              slug: 'lexique',
              title: { fr: 'Le Lexique vivant', en: 'The Living Lexicon' },
              caption: {
                fr: 'Les mots qui s’ouvrent au clic.',
                en: 'Words that open on click.',
              },
            },
            {
              slug: 'recherche',
              title: { fr: 'La Recherche', en: 'The Search' },
              caption: {
                fr: 'Boîte vide qui parcourt tout.',
                en: 'Empty box across everything.',
              },
            },
          ]}
        />
      </EditorialFrame>
    </>
  );
}
