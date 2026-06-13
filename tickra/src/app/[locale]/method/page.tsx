import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { editorialMeta } from '@/lib/seo/editorial-meta';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { ReadNext } from '@/components/editorial/ReadNext';
import { Pull } from '@/components/editorial/Pull';

// /[locale]/method — Audit page for the Cote formula. Referenced
// from /cote-inversee. Editorial register, no math beyond what is
// needed. Four components, four lines, one note about how the
// reading is bounded.

export const revalidate = 86400;
export const metadata = editorialMeta({
  slug: 'method',
  title: 'La Méthode',
  description:
    'La formule de la Cote, à l’air libre : régularité, précision, honnêteté, révision. Chaque composante en une phrase.',
});

const COPY = {
  fr: {
    eyebrow: 'La Méthode — formule de la Cote, à l’air libre',
    head1: 'Quatre lignes.',
    head2: 'Une note.',
    head3: 'Aucun secret.',
    intro:
      'La Cote n’est pas un classement et n’est pas un grade. C’est la moyenne pondérée de quatre lectures de votre carnet. La voici, dans l’ordre où elle est calculée, avec sa fenêtre, son seuil de désactivation, et son arrondi.',
    parts: 'Composantes',
    weight: 'Poids',
    window: 'Fenêtre de lecture',
    cap: 'Plafond',
    cote: 'Cote finale',
    finalText:
      'La Cote est calculée à chaque chargement, arrondie au dixième. Elle peut baisser, et c’est voulu. Si vous trouvez une faute dans la formule, écrivez-nous — elle entrera dans /erratum avant d’être corrigée ici.',
    inversee: 'Voir aussi : La Cote inversée',
  },
  en: {
    eyebrow: 'The Method — Score formula, in the open',
    head1: 'Four lines.',
    head2: 'One note.',
    head3: 'No secret.',
    intro:
      'The Score is not a ranking and not a grade. It is the weighted average of four readings of your register. Here it is, in the order it is computed, with its window, threshold, and rounding.',
    parts: 'Components',
    weight: 'Weight',
    window: 'Reading window',
    cap: 'Cap',
    cote: 'Final Score',
    finalText:
      'The Score is computed on every load and rounded to the tenth. It can fall, by design. If you find a flaw in the formula, write to us — it will enter /erratum before being fixed here.',
    inversee: 'See also: The Inverted Score',
  },
} as const;

type Part = {
  key: string;
  name: { fr: string; en: string };
  weight: number;
  window: { fr: string; en: string };
  body: { fr: string; en: string };
};

const PARTS: Part[] = [
  {
    key: 'regularite',
    name: { fr: 'Régularité', en: 'Regularity' },
    weight: 0.30,
    window: { fr: '30 jours glissants', en: '30 rolling days' },
    body: {
      fr: 'Une leçon ouverte ou un trade noté compte pour ce jour. Le score est la fraction de jours actifs sur la fenêtre, plafonnée à 10.',
      en: 'A lesson opened or a trade logged counts for that day. The score is the fraction of active days over the window, capped at 10.',
    },
  },
  {
    key: 'precision',
    name: { fr: 'Précision', en: 'Precision' },
    weight: 0.25,
    window: { fr: '20 dernières clôtures', en: 'last 20 closes' },
    body: {
      fr: 'Win-rate net de fees pondéré par le R moyen. Une suite de petits gains tirés trop tôt fait baisser cette composante autant qu’une vraie perte.',
      en: 'Net-of-fees win rate weighted by average R. A sequence of small wins taken too early lowers this component as much as a true loss.',
    },
  },
  {
    key: 'honnete',
    name: { fr: 'Honnêteté', en: 'Honesty' },
    weight: 0.25,
    window: { fr: 'sur toute l’ardoise', en: 'across the whole slate' },
    body: {
      fr: 'Fraction de trades clôturés qui portent une note écrite. Aucun gain non commenté n’est ignoré : il est simplement non lu.',
      en: 'Fraction of closed trades that carry a written note. No unnoted win is ignored: it is simply unread.',
    },
  },
  {
    key: 'revision',
    name: { fr: 'Révision', en: 'Review' },
    weight: 0.20,
    window: { fr: '14 derniers jours', en: 'last 14 days' },
    body: {
      fr: 'Erreurs anciennes relues dans la fenêtre / erreurs en attente. Une relecture compte autant qu’une leçon neuve ; le métier le sait.',
      en: 'Old mistakes reviewed in the window / mistakes waiting. A reread counts as much as a new lesson; the craft knows it.',
    },
  },
];

const CAP = 10;

export default async function MethodPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  return (
    <>
      <EditorialJsonLd
        slug="method"
        title={locale === 'fr' ? 'La Méthode' : 'The Method'}
        description={locale === 'fr'
          ? 'La formule de la Cote, en quatre composantes.'
          : 'The Score formula, in four components.'}
        locale={locale}
      />
      <EditorialFrame
        dict={dict}
        locale={locale}
        eyebrow={t.eyebrow}
        status={`${locale === 'fr' ? 'Plafond' : 'Cap'} ${CAP.toFixed(1)}`}
        head={[t.head1, t.head2, t.head3]}
        intro={t.intro}
      >
        <section className="mx-auto max-w-[920px] px-6 md:px-16">
          <Pull>
            {locale === 'fr' ? 'La Cote peut baisser. C’est voulu.' : 'The Score can fall. By design.'}
          </Pull>
        </section>
        <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
          <ol className="space-y-14">
            {PARTS.map((p, i) => (
              <li
                key={p.key}
                className="border-t border-black/15 pt-10 first:border-0 first:pt-0"
              >
                <header className="flex items-baseline justify-between gap-6">
                  <div className="flex items-baseline gap-5">
                    <span className="font-mono text-[10px] tracking-[0.22em] text-black/35 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h2
                      className="font-display italic text-[#0E0E0E]"
                      style={{ fontSize: 'clamp(26px, 3vw, 36px)', letterSpacing: '-0.02em' }}
                    >
                      {p.name[locale]}
                    </h2>
                  </div>
                  <span className="font-mono text-[11px] tracking-[0.22em] text-black/55 tabular-nums">
                    {t.weight} · {Math.round(p.weight * 100)}%
                  </span>
                </header>
                <p
                  className="mt-5 font-display leading-relaxed text-[#0E0E0E]/80 max-w-[640px]"
                  style={{ fontSize: 'clamp(16px, 1.65vw, 19px)' }}
                >
                  {p.body[locale]}
                </p>
                <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-black/55">
                  {t.window} · {p.window[locale]}
                </p>
              </li>
            ))}

            <li className="border-t border-black/15 pt-10">
              <header className="flex items-baseline justify-between gap-6">
                <h2
                  className="font-display italic text-[#0E0E0E]"
                  style={{ fontSize: 'clamp(26px, 3vw, 36px)', letterSpacing: '-0.02em' }}
                >
                  {t.cote}
                </h2>
                <span className="font-mono text-[11px] tracking-[0.22em] text-black/55 tabular-nums">
                  Σ · 30/25/25/20
                </span>
              </header>
              <p
                className="mt-5 font-mono text-[12px] text-[#0E0E0E]/85 tabular-nums whitespace-pre"
              >
                {'cote = 0.30·rg + 0.25·pr + 0.25·hn + 0.20·rv,  borné à 10.0'}
              </p>
              <p
                className="mt-5 font-display leading-relaxed text-[#0E0E0E]/80 max-w-[640px]"
                style={{ fontSize: 'clamp(16px, 1.65vw, 19px)' }}
              >
                {t.finalText}
              </p>
            </li>
          </ol>

          <footer className="mt-20 border-t border-black/15 pt-6 flex items-baseline justify-end">
            <Link
              href={`/${locale}/cote-inversee`}
              className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 hover:text-black/90"
            >
              {t.inversee} →
            </Link>
          </footer>
        </section>
        <ReadNext
          locale={locale}
          rooms={[
            {
              slug: 'cote-inversee',
              title: { fr: 'La Cote inversée', en: 'The Inverted Score' },
              caption: {
                fr: 'L’éditeur publie sa propre Cote chaque mois.',
                en: 'The editor publishes their own Score monthly.',
              },
            },
            {
              slug: 'erratum',
              title: { fr: 'L’Erratum', en: 'The Erratum' },
              caption: {
                fr: 'Les ajustements de formule sont consignés ici.',
                en: 'Formula adjustments are logged here.',
              },
            },
            {
              slug: 'refus',
              title: { fr: 'Le Refus', en: 'The Refusal' },
              caption: {
                fr: 'Ce que la Cote ne récompensera jamais.',
                en: 'What the Score will never reward.',
              },
            },
          ]}
        />
      </EditorialFrame>
    </>
  );
}
