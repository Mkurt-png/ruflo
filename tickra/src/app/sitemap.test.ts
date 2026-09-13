import { describe, it, expect } from 'vitest';
import sitemap from './sitemap';
import { TRACKS, lessonGlobalIndex } from '@/lib/curriculum/data';
import { isSeeded } from '@/lib/curriculum/lesson-content';
import { isLessonUnlocked, FREE_LESSON_LIMIT } from '@/lib/curriculum/entitlement';

// The sitemap is a claim: "these pages are worth indexing."
//
// It listed 316 lesson URLs that a crawler cannot read. Fetched anonymously —
// which is the only way a crawler ever fetches — a locked lesson returns about
// 1,300 characters, nearly all navigation, plus "Leçon réservée à nkNOWTrade
// Pro". Measured on production, not assumed.
//
// Three hundred near-identical pages repeating the same nine words is the shape
// Google reads as thin content. The cost is not that they fail to rank: it is
// crawl budget spent on emptiness by a domain barely a week old, and a worse
// judgement of the site as a whole — including the free lessons and the
// editorial articles, which are the pages that actually have something in them.

const entries = sitemap();
const urls = entries.map((e) => e.url);

/** Every lesson, with what a crawler would find on it. */
const lessons = TRACKS.flatMap((track) =>
  track.lessons.map((lesson) => ({
    url: `/learn/${track.slug}/${lesson.slug}`,
    seeded: isSeeded(lesson.id),
    free: isLessonUnlocked(lessonGlobalIndex(track.slug, lesson.slug), 'free'),
  })),
);

describe('sitemap lists only pages a crawler can read', () => {
  it('includes the free, written lessons', () => {
    const free = lessons.filter((l) => l.seeded && l.free);
    expect(free.length).toBe(FREE_LESSON_LIMIT);
    for (const l of free) {
      expect(urls.some((u) => u.endsWith(`/fr${l.url}`)), `fr ${l.url}`).toBe(true);
      expect(urls.some((u) => u.endsWith(`/en${l.url}`)), `en ${l.url}`).toBe(true);
    }
  });

  it('excludes every paywalled lesson', () => {
    const locked = lessons.filter((l) => !l.free);
    expect(locked.length).toBeGreaterThan(200); // the bulk of the curriculum
    const leaked = locked.filter((l) => urls.some((u) => u.endsWith(l.url)));
    expect(leaked.map((l) => l.url)).toEqual([]);
  });

  it('excludes every unwritten lesson, free or not', () => {
    const unwritten = lessons.filter((l) => !l.seeded);
    const leaked = unwritten.filter((l) => urls.some((u) => u.endsWith(l.url)));
    expect(leaked.map((l) => l.url)).toEqual([]);
  });

  it('still lists the track pages, which are readable', () => {
    for (const track of TRACKS) {
      expect(
        urls.some((u) => u.endsWith(`/fr/learn/${track.slug}`)),
        track.slug,
      ).toBe(true);
    }
  });

  it('still lists every editorial article', () => {
    // These are the pages the long-tail strategy rests on.
    expect(urls.filter((u) => u.includes('/editorial/')).length).toBeGreaterThanOrEqual(14);
  });

  it('lists nothing that robots.txt disallows', () => {
    // Advertising a URL while forbidding it is a contradiction a crawler reports.
    for (const path of ['/api/', '/welcome', '/share/', '/verify/', '/signin']) {
      expect(urls.filter((u) => u.includes(path)), path).toEqual([]);
    }
  });

  it('every entry is an absolute URL on the canonical host', () => {
    for (const u of urls) expect(u.startsWith('https://'), u).toBe(true);
  });
});
