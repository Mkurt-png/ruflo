import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo/safe-jsonld';
import type { TrackMeta } from '@/lib/curriculum/data';
import type { Locale } from '@/lib/i18n/config';

// Course schema for a single track. Lets Google surface track pages as
// rich Course results and gives LLM crawlers a clear declaration of the
// curriculum object: name, description, provider, instructor, language.

const LEVEL_LABEL: Record<TrackMeta['level'], string> = {
  foundations: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  mastery: 'Expert',
};

export function CourseJsonLd({ track, locale }: { track: TrackMeta; locale: Locale }) {
  const url = `${SITE_URL}/${locale}/learn/${track.slug}`;
  const lang = locale === 'fr' ? 'fr-FR' : 'en-GB';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: track.title[locale],
    description: track.summary[locale],
    url,
    inLanguage: lang,
    provider: {
      '@type': 'Organization',
      name: 'Tickra',
      url: SITE_URL,
    },
    educationalLevel: LEVEL_LABEL[track.level],
    numberOfCredits: track.lessons.length,
    // Google's Course rich-result eligibility requires hasCourseInstance
    // with courseMode AND either courseWorkload or repeatFrequency.
    // We declare a self-paced online instance with a free offer so the
    // page can also surface in the Course carousel.
    hasCourseInstance: {
      '@type': 'CourseInstance',
      name: track.title[locale],
      courseMode: 'online',
      courseWorkload: `PT${Math.max(1, Math.round(track.lessons.length / 6))}H`,
      inLanguage: lang,
      url,
    },
    // Audience helps LLM/Google understand the target learner and is
    // surfaced in some education-vertical results.
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
    },
    learningResourceType: 'Course',
    isAccessibleForFree: true,
    teaches: track.lessons.slice(0, 8).map((l) => l.title[locale]),
    // syllabusSections lets crawlers enumerate the curriculum without
    // crawling every lesson page. Each lesson becomes a Syllabus entry
    // pointing back to its canonical URL.
    syllabusSections: track.lessons.map((l, i) => ({
      '@type': 'Syllabus',
      name: l.title[locale],
      position: i + 1,
      url: `${SITE_URL}/${locale}/learn/${track.slug}/${l.slug}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

