import { describe, it, expect } from 'vitest';
import { searchIndex, getSearchIndex } from '../search';

describe('searchIndex', () => {
  it('returns nothing for queries shorter than two characters', () => {
    expect(searchIndex('', 'en')).toEqual([]);
    expect(searchIndex('a', 'en')).toEqual([]);
    expect(searchIndex(' x ', 'en')).toEqual([]); // trims to 1 char
  });

  it('respects the result limit', () => {
    const r = searchIndex('a ', 'en', 3); // common letter, trims to "a"? -> len 1
    expect(r.length).toBeLessThanOrEqual(3);
    const r2 = searchIndex('the', 'en', 5);
    expect(r2.length).toBeLessThanOrEqual(5);
  });

  it('only returns docs whose haystack actually contains the query', () => {
    const q = 'risk';
    for (const d of searchIndex(q, 'en', 50)) {
      expect(d.haystack.en.includes(q)).toBe(true);
    }
  });

  it('is case-insensitive', () => {
    const lower = searchIndex('risk', 'en', 20).map((d) => d.id);
    const upper = searchIndex('RISK', 'en', 20).map((d) => d.id);
    expect(upper).toEqual(lower);
  });

  it('ranks label matches above body-only matches', () => {
    // For any query, a returned doc whose label contains it must never sort
    // below a returned doc whose label does not (the scoring invariant).
    const q = 'risk';
    const res = searchIndex(q, 'en', 50);
    const labelMatch = (d: (typeof res)[number]) => d.label.en.toLowerCase().includes(q);
    let seenNonLabel = false;
    for (const d of res) {
      if (!labelMatch(d)) seenNonLabel = true;
      else expect(seenNonLabel).toBe(false); // a label match appeared after a non-label match
    }
  });

  it('is deterministic for the same query', () => {
    expect(searchIndex('candle', 'en', 10).map((d) => d.id)).toEqual(
      searchIndex('candle', 'en', 10).map((d) => d.id),
    );
  });

  it('caches a stable index instance', () => {
    expect(getSearchIndex()).toBe(getSearchIndex());
  });
});
