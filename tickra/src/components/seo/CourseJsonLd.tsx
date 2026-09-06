import { SITE_URL } from '@/lib/site-url';
import type { TrackMeta } from '@/lib/curriculum/data';
import type { Locale } from '@/lib/i18n/config';

// Course schema for a single track. Lets Google surface track pages as
// rich Course results and gives LLM crawlers a clear declaration of the
// curriculum object: name, description, provider, instructor, language.

export function CourseJsonLd({ track, locale }: { track: TrackMeta; locale: Locale }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: track.title[locale],
    description: track.summary[locale],
    url: `${SITE_URL}/${locale}/learn/${track.slug}`,
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-US',
    provider: {
      '@type': 'Organization',
      name: 'kNOWTrade',
      url: SITE_URL,
    },
    educationalLevel: 'beginner to advanced',
    numberOfCredits: track.lessons.length,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: `PT${Math.max(1, Math.round(track.lessons.length / 6))}H`,
    },
    teaches: track.lessons.slice(0, 8).map((l) => l.title[locale]),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default CourseJsonLd;
