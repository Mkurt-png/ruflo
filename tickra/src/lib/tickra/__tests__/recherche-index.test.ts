import { describe, it, expect } from 'vitest';
import { SEARCH_INDEX, normalizeQuery } from '../recherche-index';

describe('normalizeQuery', () => {
  it('strips accents and lowercases so search is accent-insensitive', () => {
    expect(normalizeQuery('Créée')).toBe('creee');
    expect(normalizeQuery('CALCULÉ')).toBe('calcule');
    expect(normalizeQuery('Éditorial')).toBe('editorial');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeQuery('  refus  ')).toBe('refus');
  });

  it('leaves plain ascii untouched', () => {
    expect(normalizeQuery('journal')).toBe('journal');
  });
});

describe('SEARCH_INDEX', () => {
  it('builds a non-empty index covering all three kinds', () => {
    expect(SEARCH_INDEX.length).toBeGreaterThan(0);
    const kinds = new Set(SEARCH_INDEX.map((e) => e.kind));
    expect(kinds).toContain('piece');
    expect(kinds).toContain('lesson');
    expect(kinds).toContain('term');
  });

  it('stores haystacks already accent-stripped and lowercased', () => {
    for (const e of SEARCH_INDEX) {
      for (const loc of ['fr', 'en'] as const) {
        const h = e.haystack[loc];
        // No combining marks survive; no uppercase ascii.
        expect(h.normalize('NFKD')).not.toMatch(/[̀-ͯ]/);
        expect(h).toBe(h.toLowerCase());
      }
    }
  });

  it('keeps the locale placeholder in every href for client substitution', () => {
    expect(SEARCH_INDEX.every((e) => e.href.includes('__LOCALE__'))).toBe(true);
  });

  it('finds an editorial room by an accented query token', () => {
    const q = normalizeQuery('Créée'); // -> "creee", matches "criee"? no; use real room
    expect(q).toBe('creee');
    // "criee" room haystack contains the slug "criee"; an accent-free
    // query for it should be a substring of some haystack.
    const needle = normalizeQuery('criée'); // -> "criee"
    expect(SEARCH_INDEX.some((e) => e.haystack.fr.includes(needle))).toBe(true);
  });
});
