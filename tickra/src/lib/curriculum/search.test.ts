import { describe, it, expect } from 'vitest';
import { getSearchIndex, searchIndex } from './search';

describe('getSearchIndex', () => {
  it('indexes both lessons and glossary terms', () => {
    const idx = getSearchIndex();
    expect(idx.length).toBeGreaterThan(0);
    expect(idx.some((d) => d.kind === 'lesson')).toBe(true);
    expect(idx.some((d) => d.kind === 'term')).toBe(true);
  });

  it('stores localised hrefs for both locales', () => {
    const idx = getSearchIndex();
    for (const d of idx.slice(0, 20)) {
      expect(d.href.fr.startsWith('/fr/')).toBe(true);
      expect(d.href.en.startsWith('/en/')).toBe(true);
    }
  });
});

describe('searchIndex', () => {
  it('returns nothing for queries shorter than two characters', () => {
    expect(searchIndex('', 'en')).toEqual([]);
    expect(searchIndex('a', 'en')).toEqual([]);
  });

  it('finds matches for a common term', () => {
    const results = searchIndex('forex', 'en', 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('respects the result limit', () => {
    const results = searchIndex('a e', 'en', 3); // broad-ish query
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('is case-insensitive', () => {
    const lower = searchIndex('forex', 'en', 8).map((d) => d.id);
    const upper = searchIndex('FOREX', 'en', 8).map((d) => d.id);
    expect(upper).toEqual(lower);
  });

  it('ranks a title/term match above a body-only match', () => {
    // Whatever the top hit is, its label should contain the query when a
    // label match exists in the index.
    const q = 'pip';
    const results = searchIndex(q, 'en', 10);
    if (results.length > 1) {
      const top = results[0];
      const anyLabelMatch = results.some((r) => r.label.en.toLowerCase().includes(q));
      if (anyLabelMatch) {
        expect(top.label.en.toLowerCase()).toContain(q);
      }
    }
  });
});
