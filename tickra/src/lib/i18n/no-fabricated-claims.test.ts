import { describe, it, expect } from 'vitest';
import fr from './locales/fr';
import en from './locales/en';
import { VOIX } from '@/lib/tickra/voix';

// The site sells a paid product, so copy that names people, employers or
// numbers is advertising. Several such claims shipped and none were true:
//
//   - three co-founders with named employers (Société Générale, BNP CIB,
//     Les Échos) who do not exist, plus the same two names again as hosts of
//     a twice-weekly live-session schedule sold as a Pro/Lifetime benefit
//   - "a curriculum tested on 12,000+ learners", with zero users
//   - three "interviews" with working traders, written rather than recorded,
//     on a page saying the editor records one a month
//
// These are the specific strings, so the test is blunt on purpose: it names
// what was found rather than trying to detect fabrication in general. Adding a
// real person here means adding them to the allow-list below, deliberately.

const DICTS = [
  ['fr', fr],
  ['en', en],
] as const;

/** Every string reachable from a dictionary, flattened. */
function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const v of value) strings(v, out);
  else if (value && typeof value === 'object') for (const v of Object.values(value)) strings(v, out);
  return out;
}

// People who were invented and must not reappear in shipped copy.
const INVENTED_PEOPLE = ['Marc Hauser', 'Inès Vidal', 'Tom Reyer'];

// Institutions that were named as employers of those invented people.
const BORROWED_INSTITUTIONS = ['Société Générale', 'BNP CIB', 'Les Échos'];

describe('no fabricated claims in shipped copy', () => {
  for (const [name, dict] of DICTS) {
    const all = strings(dict);

    it(`${name}: names no invented person`, () => {
      const found = INVENTED_PEOPLE.filter((p) => all.some((s) => s.includes(p)));
      expect(found).toEqual([]);
    });

    it(`${name}: claims no one else's institution as an employer`, () => {
      const found = BORROWED_INSTITUTIONS.filter((i) => all.some((s) => s.includes(i)));
      expect(found).toEqual([]);
    });

    it(`${name}: advertises no learner count we do not have`, () => {
      // "12,000+ learners" / "12 000+ apprenants", and any similar figure.
      const offenders = all.filter((s) =>
        /\d[\d\s,.]{2,}\+?\s*(learners|apprenants|students|élèves|traders formés)/i.test(s),
      );
      expect(offenders).toEqual([]);
    });

    it(`${name}: promises no live session that is not scheduled`, () => {
      // The schedule was removed; the array must stay empty until real
      // sessions exist, because the copy around it is a paid-tier promise.
      expect(dict.community.sessions).toEqual([]);
    });
  }

  it('publishes no interview that was not recorded', () => {
    // The page tells readers the editor records these. Written excerpts
    // presented as conversations are fabricated testimony; the shape stays so
    // a real interview drops in, but the list is empty until there is one.
    expect(VOIX).toEqual([]);
  });
});
