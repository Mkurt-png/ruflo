import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { ReadNext } from '@/components/editorial/ReadNext';
import { Term } from '@/components/lexique/Term';
import { TermsInProse } from '@/components/lexique/TermsInProse';
import { GLOSSARY } from '@/lib/curriculum/glossary';

// /[locale]/lexique — Le Lexique vivant. Showcase of the inline
// definition affordance: any term wrapped in <Term> gains a faint
// dotted underline and reveals its glossary entry on click. The page
// is the entry-point and the proof; the actual usage lives wherever
// the editor places <Term> inside a lesson or an editorial page.

import { editorialMeta } from '@/lib/seo/editorial-meta';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';

export const revalidate = 3600;
export const metadata = editorialMeta({
  slug: 'lexique',
  title: 'Le Lexique vivant',
  description:
    'Chaque mot d’une leçon peut s’ouvrir : définition, et un lien vers le glossaire. Pas de tooltip qui flotte — un geste choisi.',
});

const COPY = {
  fr: {
    eyebrow: 'Le Lexique vivant — usage et mode d’emploi',
    head1: 'Un mot.',
    head2: 'Un geste.',
    head3: 'Pas de tooltip.',
    intro:
      'Tickra ne survole pas. Les termes soulignés en pointillés ne s’ouvrent qu’au clic, et seulement si le lecteur le demande. Voici comment ça se lit.',
    demoTitle: 'Lisez cette phrase pour voir l’effet',
    demoDoji: 'Quand on voit un',
    demoDojiTerm: 'doji',
    demoDojiAfter: ', on attend la confirmation. Le marché hésite ; nous attendons la phrase suivante.',
    demoBOS: 'Un',
    demoBOSTerm: 'break of structure',
    demoBOSAfter: 'n’est pas un signal d’entrée — c’est un changement de paragraphe que vous lirez à votre rythme.',
    demoSL: 'Le',
    demoSLTerm: 'stop-loss',
    demoSLAfter: 'est la phrase « je perds » écrite à l’avance. Sans elle, l’ordre n’est pas prêt.',
    usage: 'Comment l’éditeur s’en sert',
    usageBody:
      'Dans une page éditoriale ou une leçon, on importe le composant et on encapsule le mot. Le composant cherche la définition dans le glossaire ; s’il ne trouve rien, il rend le mot tel quel (jamais cassé).',
    counter: (n: number) => `${n} termes disponibles dans le glossaire.`,
    glossary: 'Voir l’index complet',
    footer:
      'Si un mot devrait être ouvrable et qu’il ne l’est pas encore, ajoutez-le au glossaire — il deviendra immédiatement actif partout où l’éditeur l’a encapsulé.',
  },
  en: {
    eyebrow: 'The Living Lexicon — usage and reading',
    head1: 'One word.',
    head2: 'One gesture.',
    head3: 'No tooltip.',
    intro:
      'Tickra does not hover. Dotted-underlined terms open only on click, and only when the reader asks. Here is how it reads.',
    demoTitle: 'Read this sentence to see the effect',
    demoDoji: 'When you see a',
    demoDojiTerm: 'doji',
    demoDojiAfter: ', wait for confirmation. The market hesitates; we wait for the next sentence.',
    demoBOS: 'A',
    demoBOSTerm: 'break of structure',
    demoBOSAfter: 'is not an entry signal — it is a paragraph change you read at your own pace.',
    demoSL: 'The',
    demoSLTerm: 'stop-loss',
    demoSLAfter: 'is the sentence "I lose" written in advance. Without it, the order is not ready.',
    usage: 'How the editor uses it',
    usageBody:
      'In an editorial page or a lesson, import the component and wrap the word. The component looks up the glossary; if it finds nothing, it renders the word as-is (never broken).',
    counter: (n: number) => `${n} terms available in the glossary.`,
    glossary: 'See the full index',
    footer:
      'If a word should be openable and is not yet, add it to the glossary — it will immediately become active anywhere the editor has wrapped it.',
  },
} as const;

export default async function LexiquePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  return (
    <>
      <EditorialJsonLd
        slug="lexique"
        title={locale === 'fr' ? 'Le Lexique vivant' : 'The Living Lexicon'}
        description={locale === 'fr'
          ? 'Chaque mot d’une leçon s’ouvre sur sa définition, au clic.'
          : 'Every word in a lesson opens to its definition, on click.'}
        locale={locale}
      />
      <EditorialFrame
        dict={dict}
        locale={locale}
        eyebrow={t.eyebrow}
        status={t.counter(GLOSSARY.length)}
        head={[t.head1, t.head2, t.head3]}
        intro={t.intro}
      >

        <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
          <div className="border-t border-black/15 pt-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65">
              {t.demoTitle}
            </p>

            <ol className="mt-8 space-y-8 max-w-[680px]">
              <li
                className="font-display text-[#0E0E0E]/85"
                style={{ fontSize: 'clamp(18px, 1.9vw, 22px)', lineHeight: 1.5 }}
              >
                {t.demoDoji}{' '}
                <Term locale={locale}>{t.demoDojiTerm}</Term>
                {t.demoDojiAfter}
              </li>
              <li
                className="font-display text-[#0E0E0E]/85"
                style={{ fontSize: 'clamp(18px, 1.9vw, 22px)', lineHeight: 1.5 }}
              >
                {t.demoBOS}{' '}
                <Term locale={locale}>{t.demoBOSTerm}</Term>{' '}
                {t.demoBOSAfter}
              </li>
              <li
                className="font-display text-[#0E0E0E]/85"
                style={{ fontSize: 'clamp(18px, 1.9vw, 22px)', lineHeight: 1.5 }}
              >
                {t.demoSL}{' '}
                <Term locale={locale}>{t.demoSLTerm}</Term>{' '}
                {t.demoSLAfter}
              </li>
            </ol>
          </div>

          <div className="mt-16 border-t border-black/15 pt-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65">
              {locale === 'fr' ? 'Sans encapsulation manuelle' : 'Without manual wrapping'}
            </p>
            <p
              className="mt-3 font-display leading-relaxed text-[#0E0E0E]/80 max-w-[680px]"
              style={{ fontSize: 'clamp(18px, 1.9vw, 22px)', lineHeight: 1.5 }}
            >
              <TermsInProse locale={locale}>
                {locale === 'fr'
                  ? 'Quand le doji apparaît près d’un support, la mèche du marteau pose la question : qui tient ? Le break of structure se trouve plus loin ; le stop-loss vit au-dessus de la dernière bougie.'
                  : 'When the doji appears near a support, the wick of the hammer asks: who holds? The break of structure is further out; the stop-loss sits above the last candle.'}
              </TermsInProse>
            </p>
            <p className="mt-3 font-mono text-[10.5px] text-black/55">
              {locale === 'fr'
                ? 'Les pointillés sont posés automatiquement par <TermsInProse>.'
                : 'Dotted underlines placed automatically by <TermsInProse>.'}
            </p>
          </div>

          <div className="mt-16 border-t border-black/15 pt-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65">
              {t.usage}
            </p>
            <p
              className="mt-3 font-display leading-relaxed text-[#0E0E0E]/80 max-w-[640px]"
              style={{ fontSize: 'clamp(16px, 1.65vw, 19px)' }}
            >
              {t.usageBody}
            </p>
            <pre className="mt-6 overflow-x-auto rounded-sm border border-black/15 bg-black/[0.03] p-4 font-mono text-[11.5px] leading-relaxed text-black/80">
{`import { Term } from '@/components/lexique/Term';

<p>
  The <Term locale="en">stop-loss</Term> is the sentence
  "I lose" written in advance.
</p>`}
            </pre>
          </div>

          <footer className="mt-24 border-t border-black/15 pt-6 flex items-baseline justify-between gap-4">
            <p className="font-mono text-[10.5px] leading-relaxed text-black/65 max-w-[480px]">
              {t.footer}
            </p>
            <Link
              href={`/${locale}/glossary`}
              className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 hover:text-black/90"
            >
              {t.glossary} →
            </Link>
          </footer>
        </section>
        <ReadNext
          locale={locale}
          rooms={[
            {
              slug: 'annuaire',
              title: { fr: 'L’Annuaire', en: 'The Index' },
              caption: {
                fr: 'L’index alphabétique des leçons.',
                en: 'The alphabetical lesson index.',
              },
            },
            {
              slug: 'recherche',
              title: { fr: 'La Recherche', en: 'The Search' },
              caption: {
                fr: 'Pour chercher dans les leçons et le glossaire.',
                en: 'To search lessons and the glossary.',
              },
            },
            {
              slug: 'method',
              title: { fr: 'La Méthode', en: 'The Method' },
              caption: {
                fr: 'Le mot Cote a sa propre fiche, ici.',
                en: 'The Score formula, defined.',
              },
            },
          ]}
        />
      </EditorialFrame>
    </>
  );
}
