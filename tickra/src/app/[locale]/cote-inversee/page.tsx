import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';

// /[locale]/cote-inversee — La Cote inversée. Once a month, the
// editor publishes their own composite score, computed with the same
// formula a reader's account would use, on the same sample window.
// Static editorial register, signed by date.

import { editorialMeta } from '@/lib/seo/editorial-meta';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';

export const revalidate = 3600;
export const metadata = editorialMeta({
  slug: 'cote-inversee',
  title: 'La Cote inversée',
  description:
    'Tous les mois, l’éditeur publie sa propre Cote, calculée avec la même formule que la vôtre. Transparence radicale.',
});

type Edition = {
  month: string; // ISO YYYY-MM
  score: number;
  delta: number;
  parts: { regularite: number; precision: number; honnete: number; revision: number };
  note: { fr: string; en: string };
};

// Each month the editor pushes one entry — most recent on top.
const EDITIONS: Edition[] = [
  {
    month: '2026-06',
    score: 6.8,
    delta: -0.4,
    parts: { regularite: 7.5, precision: 6.2, honnete: 7.1, revision: 6.4 },
    note: {
      fr: 'Mois qui s’est dégradé sur la fin : trois sessions ratées et deux révisions différées. La régularité tient, la précision baisse. Note honnête : j’ai écrit trop vite après deux gains, comme la leçon psy-04 l’avait prévu.',
      en: 'Month that worsened toward the end: three missed sessions and two postponed reviews. Regularity holds, precision drops. Honest note: I wrote too fast after two wins, just as lesson psy-04 warned.',
    },
  },
  {
    month: '2026-05',
    score: 7.2,
    delta: +0.5,
    parts: { regularite: 7.4, precision: 7.0, honnete: 7.3, revision: 7.0 },
    note: {
      fr: 'Mois calme, sans envolée. Le streak a tenu trente jours, la précision est revenue grâce à un sujet retenu (psy-02 lue trois fois). Rien à pavoiser : c’est le métier à son rythme.',
      en: 'Calm month, no fireworks. The streak held thirty days; precision returned thanks to one subject revisited (psy-02 read three times). Nothing to celebrate: the craft at its rhythm.',
    },
  },
  {
    month: '2026-04',
    score: 6.7,
    delta: -0.3,
    parts: { regularite: 6.9, precision: 6.5, honnete: 7.0, revision: 6.4 },
    note: {
      fr: 'Mois où j’ai oublié de relire deux erreurs anciennes. Je l’écris parce que la Cote ne ment pas — la composante révision a baissé en silence.',
      en: 'Month where I forgot to revisit two old mistakes. I write it because the Score does not lie — the review component slipped in silence.',
    },
  },
];

const COPY = {
  fr: {
    eyebrow: 'La Cote inversée — édition mensuelle',
    head1: 'Notre Cote.',
    head2: 'Publique.',
    head3: 'Même formule que la vôtre.',
    intro:
      'Tickra demande à ses lecteurs d’écrire ce qu’ils ratent. Il serait étrange de ne pas en faire autant. Chaque mois, je publie ici ma propre Cote, calculée avec la même formule, sur la même fenêtre. Aucune flatterie, aucun lissage. C’est ce que la formule rend.',
    score: 'Cote',
    delta: 'Variation',
    parts: 'Composantes',
    regularite: 'Régularité',
    precision: 'Précision',
    honnete: 'Honnêteté',
    revision: 'Révision',
    note: 'Note de l’éditeur',
    footer:
      'Vous pouvez vérifier la formule à la page /method. Si vous trouvez une erreur, écrivez-nous : elle entrera dans /erratum avant d’être corrigée ici.',
  },
  en: {
    eyebrow: 'The Inverted Score — monthly edition',
    head1: 'Our Score.',
    head2: 'In public.',
    head3: 'Same formula as yours.',
    intro:
      'Tickra asks readers to write what they miss. It would be strange not to do the same. Every month, I publish my own Score here, computed with the same formula, on the same window. No flattery, no smoothing. It is what the formula returns.',
    score: 'Score',
    delta: 'Change',
    parts: 'Components',
    regularite: 'Regularity',
    precision: 'Precision',
    honnete: 'Honesty',
    revision: 'Review',
    note: 'Editor’s note',
    footer:
      'You can audit the formula on /method. If you spot an error, write to us: it will enter /erratum before being fixed here.',
  },
} as const;

function formatMonth(iso: string, locale: Locale): string {
  const [y, m] = iso.split('-').map((s) => parseInt(s, 10));
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

export default async function CoteInverseePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <EditorialJsonLd
        slug="cote-inversee"
        title={locale === 'fr' ? 'La Cote inversée' : 'The Inverted Score'}
        description={locale === 'fr'
          ? 'L’éditeur publie sa propre Cote chaque mois, même formule.'
          : 'The editor publishes their own Score monthly, same formula.'}
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
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/65">
              {EDITIONS.length} {locale === 'fr' ? 'éditions' : 'editions'}
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
        </section>

        <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
          {EDITIONS.map((ed, i) => (
            <article
              key={ed.month}
              className="border-t border-black/15 pt-12 mt-16 first:mt-0 first:border-0 first:pt-0"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-4">
                <span
                  className="font-display italic text-[#0E0E0E]"
                  style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', letterSpacing: '-0.02em' }}
                >
                  {formatMonth(ed.month, locale)}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 tabular-nums">
                  {String(EDITIONS.length - i).padStart(2, '0')}
                </span>
              </header>

              <div className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-[200px_1fr] items-baseline">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65">
                    {t.score}
                  </p>
                  <p
                    className="mt-2 font-display text-[#0E0E0E] tabular-nums"
                    style={{ fontSize: 'clamp(48px, 6vw, 76px)', letterSpacing: '-0.03em', lineHeight: 0.95 }}
                  >
                    {ed.score.toFixed(1)}
                  </p>
                  <p
                    className={`mt-1 font-mono text-[11px] tabular-nums ${
                      ed.delta > 0 ? 'text-emerald-700' : ed.delta < 0 ? 'text-red-700' : 'text-black/55'
                    }`}
                  >
                    {ed.delta >= 0 ? '+' : ''}
                    {ed.delta.toFixed(1)} · {t.delta}
                  </p>
                </div>

                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65">
                    {t.parts}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 max-w-[420px]">
                    {(
                      [
                        ['regularite', ed.parts.regularite],
                        ['precision', ed.parts.precision],
                        ['honnete', ed.parts.honnete],
                        ['revision', ed.parts.revision],
                      ] as const
                    ).map(([key, value]) => (
                      <div key={key} className="flex items-baseline justify-between border-b border-black/12 pb-1">
                        <dt className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-black/55">
                          {t[key]}
                        </dt>
                        <dd className="font-display italic text-[#0E0E0E] tabular-nums">
                          {value.toFixed(1)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <div className="mt-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65">
                  {t.note}
                </p>
                <p
                  className="mt-3 font-display leading-relaxed text-[#0E0E0E]/85 max-w-[680px]"
                  style={{ fontSize: 'clamp(16px, 1.65vw, 19px)' }}
                >
                  {ed.note[locale]}
                </p>
              </div>
            </article>
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
