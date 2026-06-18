import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';
import type { Level } from '@/lib/curriculum/data';

// Schema.org LearningResource — the right type for a single curriculum
// lesson nested under a Course (the track). Google can surface lessons
// individually in education-rich-result panels, and LLM crawlers get a
// clean signal that this is structured learning material, not arbitrary
// blog content.

const LEVEL_LABEL: Record<Level, string> = {
  foundations: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  mastery: 'Expert',
};

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
  /** Parent track's level. Maps to Schema.org educationalLevel. */
  trackLevel?: Level;
};

export function LearningResourceJsonLd({
  trackSlug,
  trackTitle,
  lessonSlug,
  title,
  description,
  locale,
  timeRequired = 'PT10M',
  trackLevel,
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
    // Per-track level when supplied (foundations → Beginner, etc.).
    // Falls back to the broad 'Beginner to Advanced' when the caller
    // hasn't supplied a level — same default as before so existing
    // callers don't regress while new ones can specialise.
    educationalLevel: trackLevel ? LEVEL_LABEL[trackLevel] : 'Beginner to Advanced',
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
    // isAccessibleForFree intentionally omitted. Declaring `false`
    // without the Schema.org-required paywalled-content selectors
    // (hasPart with cssSelector) makes Google's Article validator
    // reject the whole resource. Leaving the field absent is the
    // safest default until per-lesson entitlement is mapped to a
    // proper paywall hasPart graph.
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
