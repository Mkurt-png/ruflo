import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { REFUSALS } from '@/lib/tickra/refus';
import { editorialMeta } from '@/lib/seo/editorial-meta';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { ReadNext } from '@/components/editorial/ReadNext';
import { Pull } from '@/components/editorial/Pull';

// /[locale]/refus — Le Refus. Ten things Tickra will never build.
// A manifesto by negation, in the editorial register. Static content,
// no logic, no progress — defines the brand by what it refuses.

export const revalidate = 86400;
export const metadata = editorialMeta({
  slug: 'refus',
  title: 'Le Refus',
  description:
    'Dix choses que Tickra ne construira jamais. Un manifeste par la négation, écrit pour lever toute ambiguïté.',
});

const COPY = {
  fr: {
    eyebrow: 'Le Refus — manifeste par négation',
    status: 'Permanent',
    head: ['Ce qu’on ne fera', 'jamais.', 'Dix choses, signées.'] as [string, string, string],
    intro:
      'Un site de trading se définit autant par ce qu’il refuse que par ce qu’il publie. Voici les dix lignes que Tickra ne franchira pas. Si une seule d’entre elles vous manque, vous êtes au mauvais endroit — et nous préférons que vous le sachiez maintenant.',
    footer:
      'Ce manifeste est public et permanent. Si nous y revenons un jour, ce sera ici, daté, en haut — sans communication, sans excuse, sans soldes.',
  },
  en: {
    eyebrow: 'The Refusal — manifesto by negation',
    status: 'Permanent',
    head: ['What we will', 'never build.', 'Ten lines, signed.'] as [string, string, string],
    intro:
      'A trading site is defined as much by what it refuses as by what it publishes. Here are the ten lines Tickra will not cross. If even one of them is something you need, you are in the wrong place — and we would rather you know now.',
    footer:
      'This manifesto is public and permanent. If we ever revisit it, it will be here, dated at the top — no announcement, no excuse, no sale.',
  },
} as const;

export default async function RefusPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  return (
    <>
      <EditorialJsonLd
        slug="refus"
        title={locale === 'fr' ? 'Le Refus' : 'The Refusal'}
        description={locale === 'fr'
          ? 'Dix choses que Tickra ne construira jamais. Un manifeste par la négation.'
          : 'Ten things Tickra will never build. A manifesto by negation.'}
        locale={locale}
      />
      <EditorialFrame
        dict={dict}
        locale={locale}
        eyebrow={t.eyebrow}
        status={t.status}
        head={t.head}
        intro={t.intro}
      >
        <section className="mx-auto max-w-[920px] px-6 md:px-16">
          <Pull>
            {locale === 'fr'
              ? 'Un site se définit autant par ce qu’il refuse que par ce qu’il publie.'
              : 'A site is defined as much by what it refuses as by what it publishes.'}
          </Pull>
        </section>
        <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
          <ol className="space-y-16">
            {REFUSALS.map((r, i) => (
              <li
                key={r.id}
                className="grid grid-cols-[3ch_1fr] gap-x-8 items-baseline border-t border-black/15 pt-10 first:border-0 first:pt-0"
              >
                <span className="font-mono text-[11px] tracking-[0.22em] text-black/35 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h2
                    className="font-display italic text-[#0E0E0E]"
                    style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
                  >
                    {r.title[locale]}
                  </h2>
                  <p
                    className="mt-5 font-display leading-relaxed text-[#0E0E0E]/80 max-w-[640px]"
                    style={{ fontSize: 'clamp(16px, 1.6vw, 19px)' }}
                  >
                    {r.why[locale]}
                  </p>
                </div>
              </li>
            ))}
          </ol>

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
              slug: 'silence',
              title: { fr: 'Le Silence éditorial', en: 'The Editorial Silence' },
              caption: {
                fr: 'Ce que l’interface ne fera pas — pendant qu’on y est.',
                en: 'What the interface will not do — while we are at it.',
              },
            },
            {
              slug: 'erratum',
              title: { fr: 'L’Erratum', en: 'The Erratum' },
              caption: {
                fr: 'Les lignes que nous avons franchies, et corrigées en public.',
                en: 'The lines we crossed, and corrected in public.',
              },
            },
            {
              slug: 'cote-inversee',
              title: { fr: 'La Cote inversée', en: 'The Inverted Score' },
              caption: {
                fr: 'L’éditeur qui se note avec la même formule que vous.',
                en: 'The editor scoring themselves with the reader’s formula.',
              },
            },
          ]}
        />
      </EditorialFrame>
    </>
  );
}
