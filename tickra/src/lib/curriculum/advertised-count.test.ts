import { describe, it, expect } from 'vitest';
import { TRACKS } from './data';
import { isSeeded } from './lesson-content';
import en from '@/lib/i18n/locales/en';
import fr from '@/lib/i18n/locales/fr';

// The pricing page sells a number of lessons. That number has to be the number
// of lessons a buyer can actually read.
//
// It said 222 — every lesson in `data.ts`, including 64 that render a "Coming
// soon" card, four whole advanced tracks among them. Those advanced tracks are
// precisely what someone upgrades for, so the gap was not a rounding error; it
// was the product.
//
// This test fails whenever the written total moves, which is the point: writing
// new lessons should force the advertised figure to be updated with them.

const written = TRACKS.flatMap((t) => t.lessons).filter((l) => isSeeded(l.id)).length;
const planned = TRACKS.flatMap((t) => t.lessons).length;

describe('advertised lesson counts match reality', () => {
  it('reports the counts, for the record', () => {
    expect(written).toBeGreaterThan(0);
    expect(planned).toBeGreaterThanOrEqual(written);
  });

  it('never advertises more lessons than are written', () => {
    for (const [name, dict] of [
      ['en', en],
      ['fr', fr],
    ] as const) {
      const claims = [
        dict.pricing.compare.rows.find((r) =>
          /Lessons unlocked|Leçons débloquées/.test(r.label),
        ),
      ].filter(Boolean);
      expect(claims.length, `${name}: comparison row not found`).toBe(1);
      const row = claims[0]!;
      // "158 / 158", "4 / 158", "158 / 158 + future" — every denominator here
      // is the size of what a paying reader gets.
      for (const cell of [row.free, row.pro, row.lifetime]) {
        for (const m of String(cell).matchAll(/(\d+)/g)) {
          expect(
            Number(m[1]),
            `${name}: "${cell}" advertises more than the ${written} written lessons`,
          ).toBeLessThanOrEqual(written);
        }
      }
    }
  });

  it('the hero stat is the written count, not the planned one', () => {
    for (const [name, dict] of [
      ['en', en],
      ['fr', fr],
    ] as const) {
      const stat = dict.hero.stats.find((s) => /Lessons|Leçons/.test(s.label));
      expect(stat, `${name}: lesson stat not found`).toBeTruthy();
      expect(Number(stat!.value), name).toBe(written);
    }
  });
});
