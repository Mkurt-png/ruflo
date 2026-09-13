import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Structured data is the one place where a claim is *asserted* to Google
// rather than merely written on a page. Two defects lived here.
//
// 1. `foundingDate: '2025'`. The first commit in this repository is dated
//    2026-06-08 and nknowtrade.com was registered 2026-09-06 — checked
//    against the git log and the registry, not remembered. Nothing was
//    founded in 2025. It is the same class of invented fact that was removed
//    from the pages, surviving in the machine-readable layer where nobody
//    reads it.
//
// 2. Two `Organization` blocks on the home page: the layout's, complete with
//    address, founder and three contact points — and a second, thinner one
//    from HomeJsonLd with none of that. A parser reading both sees two
//    entities claiming to be the same site, the second contradicting the
//    first by omission.

const DIR = __dirname;
const files = readdirSync(DIR).filter((f) => f.endsWith('JsonLd.tsx'));
const src = (f: string) => readFileSync(resolve(DIR, f), 'utf8');

/**
 * Organization blocks that stand on their own, as opposed to the ones nested
 * inside a `publisher:` / `provider:` / `author:` key — those are references
 * to an entity, not fresh declarations of one.
 */
function topLevelOrganizations(source: string): number {
  const lines = source.split('\n');
  return lines.filter((line, i) => {
    if (!line.includes("'@type': 'Organization'")) return false;
    const opener = lines[i - 1] ?? '';
    return !/\b(publisher|provider|author|brand)\s*:\s*\{/.test(opener);
  }).length;
}

describe('the operator is one entity, stated once', () => {
  it('has exactly one component that declares a top-level Organization', () => {
    // A nested publisher/provider/author is a reference, not a declaration.
    // A top-level one is a declaration, and there must be a single source.
    const declaring = files.filter((f) => topLevelOrganizations(src(f)) > 0);
    expect(declaring).toEqual(['OrganizationJsonLd.tsx']);
  });

  it('gives that declaration a stable @id', () => {
    expect(src('OrganizationJsonLd.tsx')).toMatch(/'@id': `\$\{SITE_URL\}\/#organization`/);
  });

  it('makes every other mention point at that @id instead of restating it', () => {
    for (const f of files) {
      if (f === 'OrganizationJsonLd.tsx') continue;
      const s = src(f);
      const mentions = (s.match(/'@type': 'Organization'/g) ?? []).length;
      const refs = (s.match(/\/#organization`/g) ?? []).length;
      // Every mention carries a reference. A file may hold a reference and no
      // mention (HomeJsonLd points `provider` straight at the @id); it must
      // never hold a mention with no reference.
      expect(refs, `${f}: ${mentions} Organization mention(s), ${refs} @id reference(s)`).toBeGreaterThanOrEqual(mentions);
    }
  });

  it('does not re-emit an Organization on the home page', () => {
    // The layout already mounts one there.
    expect(topLevelOrganizations(src('HomeJsonLd.tsx'))).toBe(0);
  });
});

describe('dates asserted to Google are true', () => {
  it('does not claim a founding date earlier than the project exists', () => {
    const m = src('OrganizationJsonLd.tsx').match(/foundingDate: '(\d{4})'/);
    expect(m, 'no foundingDate found').not.toBeNull();
    // First commit: 2026-06-08. Domain registered: 2026-09-06.
    expect(Number(m![1])).toBeGreaterThanOrEqual(2026);
  });
});
