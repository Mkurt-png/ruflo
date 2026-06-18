import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';

// AlmanachItemList — emits a Schema.org ItemList of every past
// Criée of the year. Each entry is a Question with the date it was
// posed and a link to the lesson that inspired it. Lets crawlers
// understand /almanach as a dated archive of editorial questions
// rather than a flat HTML list, and gives the entry-level dates
// Google needs to surface the page as a fresh archive.

export type AlmanachEntry = {
  date: string; // ISO date 'YYYY-MM-DD'
  question: string;
  lessonHref: string;
  trackTitle: string;
};

type Props = {
  entries: ReadonlyArray<AlmanachEntry>;
  locale: 'fr' | 'en';
  year: number;
};

export function AlmanachItemListJsonLd({ entries, locale, year }: Props) {
  const url = `${SITE_URL}/${locale}/almanach`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name:
      locale === 'fr'
        ? `L’Almanach Tickra ${year} — archive des Criées`
        : `The Tickra Almanac ${year} — Criée archive`,
    description:
      locale === 'fr'
        ? `Archive ${year} : ${entries.length} questions, une par jour, dans l’ordre où elles ont été posées.`
        : `${year} archive: ${entries.length} questions, one per day, in the order they were asked.`,
    url,
    numberOfItems: entries.length,
    // Page is presented newest-first, which Schema calls Descending.
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: entries.map((entry, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Question',
        name: entry.question,
        text: entry.question,
        dateCreated: entry.date,
        inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
        about: { '@type': 'Course', name: entry.trackTitle },
        url: `${SITE_URL}${entry.lessonHref}`,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
