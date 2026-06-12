import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { TRACKS } from '@/lib/curriculum/data';

// /[locale]/annuaire — the phonebook. One alphabetical index of
// every lesson across every track, with the track label as the
// source line. Pure server render from the existing curriculum
// data. Useful as a memory palace and as a long-tail SEO map.

import { editorialMeta } from '@/lib/seo/editorial-meta';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';

export const revalidate = 3600;
export const metadata = editorialMeta({
  slug: 'annuaire',
  title: 'L’Annuaire',
  description:
    'L’index alphabétique de toutes les leçons publiées sur Tickra. Une seule page, navigable au clavier, faite pour être lue lentement.',
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
      <Navbar dict={dict} locale={locale} />
      <EditorialJsonLd
        slug="annuaire"
        title={locale === 'fr' ? 'L’Annuaire' : 'The Index'}
        description={locale === 'fr'
          ? 'L’index alphabétique de toutes les leçons publiées.'
          : 'The alphabetical index of every lesson published.'}
        locale={locale}
      />
      <main id="main" className="bg-[#F4F1EA] min-h-screen">
        <section
          className="relative px-6 md:px-16"
          style={{ paddingTop: 'clamp(120px, 16vh, 200px)', paddingBottom: 'clamp(48px, 8vh, 96px)' }}
        >
          <header className="flex items-baseline justify-between gap-6 border-b border-black/15 pb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
              {t.eyebrow}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/65 tabular-nums">
              {t.counts(rows.length, TRACKS.length)}
            </span>
          </header>

          <div className="mt-16 md:mt-24 max-w-[1100px]">
            <h1
              className="font-display italic font-light text-[#0E0E0E]"
              style={{ fontSize: 'clamp(40px, 6vw, 92px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}
            >
              {t.head1}
              <br />
              <span className="text-black/55">{t.head2}</span>
              <br />
              <span className="text-black/35">{t.head3}</span>
            </h1>
          </div>

          <p
            className="mt-16 max-w-[640px] font-display text-[#0E0E0E]/75 leading-relaxed"
            style={{ fontSize: 'clamp(17px, 1.7vw, 20px)' }}
          >
            {t.intro}
          </p>

          {/* Letter nav */}
          <nav aria-label="A-Z" className="mt-12 flex flex-wrap gap-x-3 gap-y-2 border-y border-black/15 py-3">
            {letters.map((l) => (
              <a
                key={l}
                href={`#letter-${l}`}
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-black/55 hover:text-black/90 tabular-nums"
              >
                {l}
              </a>
            ))}
          </nav>
        </section>

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
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
