import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { ERRATA, groupByYear } from '@/lib/tickra/erratum';
import { editorialMeta } from '@/lib/seo/editorial-meta';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';

// /[locale]/erratum — L'Erratum. Public log of the editor's
// mistakes, grouped by year. Nothing is removed; the page only
// grows. If trust matters more than image, this page should exist.

export const revalidate = 3600;
export const metadata = editorialMeta({
  slug: 'erratum',
  title: 'L’Erratum',
  description:
    'Journal public des erreurs de Tickra : leçons corrigées, Criées mal posées, formules ajustées. Rien n’est effacé.',
});

const COPY = {
  fr: {
    eyebrow: 'L’Erratum — journal des fautes',
    head1: 'Ce que nous',
    head2: 'avons raté.',
    head3: 'Et corrigé en public.',
    intro:
      'Un site qui ne publie jamais ses erreurs en a deux fois plus : celles qu’il commet, et celles qu’il cache. L’Erratum garde la trace de toutes les nôtres. Nous y revenons quand il faut ; nous n’en retirons rien.',
    scope: {
      lesson: 'Leçon',
      criee: 'La Criée',
      lettre: 'La Lettre',
      methode: 'Méthode',
      site: 'Site',
    } as const,
    footer:
      'Cette page n’a pas de fin. Si vous repérez une erreur que nous n’avons pas signalée, écrivez-nous : nous l’ajouterons ici avant de la corriger ailleurs.',
  },
  en: {
    eyebrow: 'The Erratum — log of faults',
    head1: 'What we',
    head2: 'got wrong.',
    head3: 'And fixed in public.',
    intro:
      'A site that never publishes its errors has twice as many: the ones it makes, and the ones it hides. The Erratum keeps the trace of all of ours. We come back to it when we must; we remove nothing.',
    scope: {
      lesson: 'Lesson',
      criee: 'The Criée',
      lettre: 'The Letter',
      methode: 'Method',
      site: 'Site',
    } as const,
    footer:
      'This page has no end. If you spot an error we have not flagged, write to us: we will add it here before fixing it elsewhere.',
  },
} as const;

export default async function ErratumPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];
  const years = groupByYear(ERRATA);

  return (
    <>
      <EditorialJsonLd
        slug="erratum"
        title={locale === 'fr' ? 'L’Erratum' : 'The Erratum'}
        description={locale === 'fr'
          ? 'Journal public des erreurs de Tickra. Rien n’est effacé.'
          : 'Public log of Tickra’s mistakes. Nothing is erased.'}
        locale={locale}
      />
      <EditorialFrame
        dict={dict}
        locale={locale}
        eyebrow={t.eyebrow}
        status={`${ERRATA.length} ${locale === 'fr' ? 'entrées' : 'entries'}`}
        head={[t.head1, t.head2, t.head3]}
        intro={t.intro}
      >

        <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
          {years.map(({ year, items }) => (
            <div key={year} className="mt-16 first:mt-0">
              <div className="flex items-baseline gap-6 border-b border-black/15 pb-3">
                <span
                  className="font-display italic text-[#0E0E0E]/85 tabular-nums"
                  style={{ fontSize: 'clamp(28px, 3vw, 38px)' }}
                >
                  {year}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65 tabular-nums">
                  {items.length} {locale === 'fr' ? 'entrées' : 'entries'}
                </span>
              </div>

              <ol className="mt-10 space-y-14">
                {items.map((e, i) => (
                  <li key={e.id} className="grid grid-cols-[6ch_1fr] gap-x-6 items-baseline">
                    <span className="font-mono text-[10px] tracking-[0.18em] text-black/40 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 tabular-nums">
                          {e.date}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65">
                          · {t.scope[e.scope]}
                        </span>
                      </div>
                      <h3
                        className="mt-3 font-display italic text-[#0E0E0E]"
                        style={{ fontSize: 'clamp(22px, 2.4vw, 30px)', letterSpacing: '-0.015em', lineHeight: 1.1 }}
                      >
                        {e.title[locale]}
                      </h3>
                      <p
                        className="mt-3 font-display leading-relaxed text-[#0E0E0E]/80 max-w-[640px]"
                        style={{ fontSize: 'clamp(15px, 1.55vw, 18px)' }}
                      >
                        {e.body[locale]}
                      </p>
                    </div>
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
      </EditorialFrame>
    </>
  );
}
