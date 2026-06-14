import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';

// Schema.org LearningResource — the right type for a single curriculum
// lesson nested under a Course (the track). Google can surface lessons
// individually in education-rich-result panels, and LLM crawlers get a
// clean signal that this is structured learning material, not arbitrary
// blog content.

type Props = {
  /** Slug of the parent track. Used to build the inCourse URL pointer. */
  trackSlug: string;
  /** Human-readable parent track title. */
  trackTitle: string;
  /** Slug of this lesson. */
  lessonSlug: string;
  /** Human-readable lesson title. */
  title: string;
  /** Lesson description / summary. */
  description: string;
  locale: 'fr' | 'en';
  /** Optional estimated time in ISO-8601 duration. Defaults to 10 minutes. */
  timeRequired?: string;
};

export function LearningResourceJsonLd({
  trackSlug,
  trackTitle,
  lessonSlug,
  title,
  description,
  locale,
  timeRequired = 'PT10M',
}: Props) {
  const url = `${SITE_URL}/${locale}/learn/${trackSlug}/${lessonSlug}`;
  const courseUrl = `${SITE_URL}/${locale}/learn/${trackSlug}`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: title,
    description,
    url,
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-GB',
    learningResourceType: locale === 'fr' ? 'Leçon' : 'Lesson',
    educationalLevel: 'Beginner to Advanced',
    timeRequired,
    isPartOf: {
      '@type': 'Course',
      name: trackTitle,
      url: courseUrl,
    },
    provider: {
      '@type': 'Organization',
      name: 'Tickra',
      url: SITE_URL,
    },
    isAccessibleForFree: false,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
