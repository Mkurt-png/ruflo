import { describe, it, expect } from 'vitest';
import { translateArticleSlug } from '../slug-translation';
import fr from '@/lib/i18n/locales/fr';
import en from '@/lib/i18n/locales/en';

const FR_SLUGS = Object.keys(fr.editorialArticles.posts);
const EN_SLUGS = Object.keys(en.editorialArticles.posts);

describe('translateArticleSlug', () => {
  it('returns the input unchanged when from === to', () => {
    expect(translateArticleSlug('anything', 'fr', 'fr')).toBe('anything');
    expect(translateArticleSlug('anything', 'en', 'en')).toBe('anything');
  });

  it('falls back to the input slug for an unregistered slug', () => {
    // Never undefined — Google rejects a malformed hreflang map.
    expect(translateArticleSlug('not-a-real-slug', 'fr', 'en')).toBe('not-a-real-slug');
    expect(translateArticleSlug('not-a-real-slug', 'en', 'fr')).toBe('not-a-real-slug');
  });

  // The position-aligned map is only correct if both dictionaries keep
  // their posts in lock-step. These guard the SEO invariant: a drift would
  // silently emit hreflang alternates pointing at the wrong translation.
  it('keeps FR and EN post counts in parity', () => {
    expect(FR_SLUGS.length).toBe(EN_SLUGS.length);
    expect(FR_SLUGS.length).toBeGreaterThan(0);
  });

  it('round-trips every FR slug fr -> en -> fr', () => {
    for (const slug of FR_SLUGS) {
      const en2 = translateArticleSlug(slug, 'fr', 'en');
      expect(EN_SLUGS).toContain(en2);
      expect(translateArticleSlug(en2, 'en', 'fr')).toBe(slug);
    }
  });

  it('round-trips every EN slug en -> fr -> en', () => {
    for (const slug of EN_SLUGS) {
      const fr2 = translateArticleSlug(slug, 'en', 'fr');
      expect(FR_SLUGS).toContain(fr2);
      expect(translateArticleSlug(fr2, 'fr', 'en')).toBe(slug);
    }
  });
});
