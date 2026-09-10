import { describe, it, expect } from 'vitest';
import { EDITORIAL_SLUGS, translateEditorialSlug, localisePath } from './editorial-slugs';
import fr from './locales/fr';
import en from './locales/en';

describe('editorial slug map', () => {
  it('covers every published article, in both directions', () => {
    const frSlugs = fr.editorial.posts.map((p) => p.slug).sort();
    const enSlugs = en.editorial.posts.map((p) => p.slug).sort();
    expect(EDITORIAL_SLUGS.map((p) => p.fr).sort()).toEqual(frSlugs);
    expect(EDITORIAL_SLUGS.map((p) => p.en).sort()).toEqual(enSlugs);
  });

  it('every mapped slug resolves to a real article body', () => {
    const frPosts: Record<string, unknown> = fr.editorialArticles.posts;
    const enPosts: Record<string, unknown> = en.editorialArticles.posts;
    for (const pair of EDITORIAL_SLUGS) {
      expect(frPosts[pair.fr], `fr:${pair.fr}`).toBeTruthy();
      expect(enPosts[pair.en], `en:${pair.en}`).toBeTruthy();
    }
  });

  it('translates in both directions', () => {
    expect(translateEditorialSlug('journal-de-trading', 'en')).toBe('trading-journal');
    expect(translateEditorialSlug('trading-journal', 'fr')).toBe('journal-de-trading');
  });

  it('returns null for a slug it does not know', () => {
    expect(translateEditorialSlug('not-an-article', 'en')).toBeNull();
  });
});

describe('localisePath', () => {
  it('swaps the locale on an ordinary page', () => {
    expect(localisePath('/fr/pricing', 'en')).toBe('/en/pricing');
    expect(localisePath('/en/learn/forex-basics', 'fr')).toBe('/fr/learn/forex-basics');
  });

  it('translates the slug on an editorial article', () => {
    // This is the case that 404'd: five of seven articles have different slugs.
    expect(localisePath('/fr/editorial/journal-de-trading', 'en')).toBe(
      '/en/editorial/trading-journal',
    );
    expect(localisePath('/en/editorial/multi-timeframe-analysis', 'fr')).toBe(
      '/fr/editorial/analyse-multi-timeframe',
    );
  });

  it('leaves an article whose slug is identical in both locales alone', () => {
    expect(localisePath('/fr/editorial/risk-of-ruin', 'en')).toBe('/en/editorial/risk-of-ruin');
  });

  it('does not invent a translation for an unknown slug', () => {
    expect(localisePath('/fr/editorial/unknown', 'en')).toBe('/en/editorial/unknown');
  });

  it('handles the editorial index itself', () => {
    expect(localisePath('/fr/editorial', 'en')).toBe('/en/editorial');
  });

  it('handles the locale home page', () => {
    expect(localisePath('/fr', 'en')).toBe('/en');
  });
});
