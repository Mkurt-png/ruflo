import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { getCrieeForDate } from '@/lib/tickra/criee';

// /[locale]/almanach — the year's archive. One line per past Criée
// of the year-to-date. Editorial ledger, oldest at the bottom.
// Server component: each entry is just the deterministic compute of
// the daily card from the date seed.

import { editorialMeta } from '@/lib/seo/editorial-meta';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';

export const dynamic = 'force-dynamic';
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
      <Navbar dict={dict} locale={locale} />
      <EditorialJsonLd
        slug="almanach"
        title={locale === 'fr' ? 'L’Almanach' : 'The Almanac'}
        description={locale === 'fr'
          ? 'L’archive de l’année : une ligne par Criée passée.'
          : 'The year’s archive: one line per past Criée.'}
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
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/45 tabular-nums">
              {now.getUTCFullYear()} · {entries.length}{' '}
              {locale === 'fr' ? 'entrées' : 'entries'}
            </span>
          </header>

          <div className="mt-16 md:mt-24 max-w-[1100px]">
            <p
              className="font-display italic font-light text-[#0E0E0E]"
              style={{ fontSize: 'clamp(40px, 6vw, 92px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}
            >
              {t.head1}
              <br />
              <span className="text-black/55">{t.head2}</span>
              <br />
              <span className="text-black/35">{t.head3}</span>
            </p>
          </div>

          <p
            className="mt-16 max-w-[640px] font-display text-[#0E0E0E]/75 leading-relaxed"
            style={{ fontSize: 'clamp(17px, 1.7vw, 20px)' }}
          >
            {t.intro}
          </p>
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
            <p className="font-mono text-[10.5px] leading-relaxed text-black/45 max-w-[640px]">
              {t.footer}
            </p>
          </footer>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
