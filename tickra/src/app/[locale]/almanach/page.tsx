import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { ReadNext } from '@/components/editorial/ReadNext';
import { Pull } from '@/components/editorial/Pull';
import { getCrieeForDate } from '@/lib/tickra/criee';

// /[locale]/almanach — the year's archive. One line per past Criée
// of the year-to-date. Editorial ledger, oldest at the bottom.
// Server component: each entry is just the deterministic compute of
// the daily card from the date seed.

import { editorialMeta } from '@/lib/seo/editorial-meta';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';
import { RoomBreadcrumb } from '@/components/seo/RoomBreadcrumb';

export const revalidate = 3600;
export const metadata = editorialMeta({
  slug: 'almanach',
  title: 'L’Almanach',
  description:
    'L’archive de l’année : une ligne par Criée passée, dans l’ordre où elles ont été posées.',
});

const COPY = {
  fr: {
    eyebrow: 'L’Almanach — archives de l’année',
    head1: 'Ce qui a',
    head2: 'été demandé.',
    head3: 'Une ligne par jour.',
    intro:
      'La Criée disparaît à minuit UTC ; ici elle reste. Une page par année, une ligne par jour, par ordre antéchronologique. Cliquer sur une question ouvre la leçon qui l’a inspirée.',
    todayTag: 'Aujourd’hui',
    footer:
      'L’Almanach se construit tout seul : aucune base, aucun cache. Chaque ligne est recalculée à la volée à partir du seed du jour.',
  },
  en: {
    eyebrow: 'The Almanac — this year’s archive',
    head1: 'What was',
    head2: 'asked.',
    head3: 'One line per day.',
    intro:
      'La Criée disappears at midnight UTC; here it stays. One page per year, one line per day, newest first. Click a question to open the lesson that inspired it.',
    todayTag: 'Today',
    footer:
      'The Almanac builds itself: no database, no cache. Each line is recomputed on the fly from the day’s seed.',
  },
} as const;

const MS_DAY = 86_400_000;

function startOfYearUTC(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
}

function daysSince(d: Date, ref: Date): number {
  return Math.floor((ref.getTime() - d.getTime()) / MS_DAY);
}

export default async function AlmanachPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  const now = new Date();
  const yearStart = startOfYearUTC(now);
  const todayKey = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
    .toISOString()
    .slice(0, 10);
  const days = daysSince(yearStart, now) + 1; // inclusive

  // Build the list newest-first.
  const entries = [] as ReturnType<typeof getCrieeForDate>[];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), 0, 1 + (days - 1 - i)));
    entries.push(getCrieeForDate(d));
  }

  return (
    <>
      <EditorialJsonLd
        slug="almanach"
        title={locale === 'fr' ? 'L’Almanach' : 'The Almanac'}
        description={locale === 'fr'
          ? 'L’archive de l’année : une ligne par Criée passée.'
          : 'The year’s archive: one line per past Criée.'}
        locale={locale}
      />
      <RoomBreadcrumb
        locale={locale}
        slug="almanach"
        title={{ fr: 'L’Almanach', en: 'The Almanac' }}
      />
      <EditorialFrame
        dict={dict}
        locale={locale}
        eyebrow={t.eyebrow}
        status={`${now.getUTCFullYear()} · ${entries.length} ${locale === 'fr' ? 'entrées' : 'entries'}`}
        head={[t.head1, t.head2, t.head3]}
        intro={t.intro}
      >

        <section className="mx-auto max-w-[920px] px-6 md:px-16">
          <Pull>
            {locale === 'fr'
              ? 'Une seule page par année. Une seule ligne par jour.'
              : 'One page per year. One line per day.'}
          </Pull>
        </section>

        <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
          <ol className="divide-y divide-black/12 border-y border-black/15">
            {entries.map((e) => {
              const isToday = e.date === todayKey;
              const d = new Date(e.date + 'T00:00:00Z');
              const dateLabel = d.toLocaleDateString(
                locale === 'fr' ? 'fr-FR' : 'en-GB',
                { day: '2-digit', month: 'short' },
              );
              return (
                <li key={e.date}>
                  <Link
                    href={`/${locale}/learn/${e.trackSlug}/${e.lessonSlug}`}
                    className="grid grid-cols-[10ch_1fr_auto] items-baseline gap-x-6 py-5 hover:bg-black/[0.02] -mx-3 px-3 transition-colors"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/55 tabular-nums">
                      {dateLabel}
                      {isToday && (
                        <span className="ml-2 text-black/85">· {t.todayTag}</span>
                      )}
                    </span>
                    <span
                      className={`font-display italic ${isToday ? 'text-[#0E0E0E]' : 'text-[#0E0E0E]/80'} text-balance`}
                      style={{ fontSize: 'clamp(15px, 1.55vw, 18px)' }}
                    >
                      {e.question[locale]}
                    </span>
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-black/40">
                      {e.source.trackTitle[locale]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>

          <footer className="mt-12 border-t border-black/15 pt-6">
            <p className="font-mono text-[10.5px] leading-relaxed text-black/65 max-w-[640px]">
              {t.footer}
            </p>
          </footer>
        </section>
        <ReadNext
          locale={locale}
          rooms={[
            {
              slug: 'criee',
              title: { fr: 'La Criée', en: 'The Criée' },
              caption: {
                fr: 'La question d’aujourd’hui — encore lisible.',
                en: 'Today’s question — still readable.',
              },
            },
            {
              slug: 'annuaire',
              title: { fr: 'L’Annuaire', en: 'The Index' },
              caption: {
                fr: 'L’index alphabétique de toutes les leçons.',
                en: 'The alphabetical index of every lesson.',
              },
            },
            {
              slug: 'recherche',
              title: { fr: 'La Recherche', en: 'The Search' },
              caption: {
                fr: 'Une boîte vide pour chercher partout.',
                en: 'An empty box to search anywhere.',
              },
            },
          ]}
        />
      </EditorialFrame>
    </>
  );
}
