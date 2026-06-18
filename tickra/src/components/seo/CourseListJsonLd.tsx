import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';
import type { TrackMeta } from '@/lib/curriculum/data';
import { isSeeded } from '@/lib/curriculum/lesson-content';

const LEVEL_LABEL: Record<TrackMeta['level'], string> = {
  foundations: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  mastery: 'Expert',
};

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
        // Per-track educational level (was hardcoded to "Beginner to
        // Advanced" for every track, which made all 15 tracks look
        // identical to Google's Course indexer).
        educationalLevel: LEVEL_LABEL[track.level],
        // Count seeded lessons only; the unseeded placeholders are
        // robots:noindex and don't represent real course content.
        numberOfCredits: track.lessons.filter((l) => isSeeded(l.id)).length,
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
