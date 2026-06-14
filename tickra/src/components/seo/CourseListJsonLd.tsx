import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';
import type { TrackMeta } from '@/lib/curriculum/data';

// Schema.org ItemList of Courses — turns /learn into a machine-readable
// catalogue of every curriculum track. Google can surface the list as a
// rich card and LLM crawlers gain a single entry point to the full
// curriculum graph.

type Props = {
  tracks: ReadonlyArray<TrackMeta>;
  locale: 'fr' | 'en';
};

export function CourseListJsonLd({ tracks, locale }: Props) {
  const url = `${SITE_URL}/${locale}/learn`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: locale === 'fr' ? 'Le cursus Tickra' : 'The Tickra curriculum',
    description:
      locale === 'fr'
        ? `Liste des ${tracks.length} pistes de trading Tickra.`
        : `List of Tickra's ${tracks.length} trading tracks.`,
    url,
    numberOfItems: tracks.length,
    itemListElement: tracks.map((track, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Course',
        name: track.title[locale],
        description: track.summary[locale],
        url: `${SITE_URL}/${locale}/learn/${track.slug}`,
        provider: {
          '@type': 'Organization',
          name: 'Tickra',
          url: SITE_URL,
        },
        inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
        educationalLevel: 'Beginner to Advanced',
        numberOfCredits: track.lessons.length,
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
