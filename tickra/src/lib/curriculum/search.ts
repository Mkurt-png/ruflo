// Build a flat searchable index of lesson titles + glossary terms.
// Used by the command palette to surface matches (e.g. "marubozu" finds the
// lesson that covers it).
//
// The index is computed once at module load (the data is static). We keep
// snippets short so the palette stays performant on every keystroke.
//
// SECURITY — this module is imported by client components, so everything it
// touches ships in a public JS chunk. It must therefore only ever read from
// `./data` (titles, track summaries) and `./glossary`, both of which are free
// marketing copy. It must NEVER import `./lesson-content`: that module holds
// the paid bodies, drill answers and quiz rationales for all 222 lessons, and
// importing it here published the entire paid curriculum — answer keys
// included — to anyone who opened DevTools. The server-side paywall in
// learn/[track]/[lesson]/page.tsx is correct; this import bypassed it.
// `no-paid-content-in-bundle.test.ts` fails the build if it comes back.

import { TRACKS } from './data';
import { GLOSSARY } from './glossary';

export type SearchDoc = {
  id: string;
  kind: 'lesson' | 'term';
  // The fields below are stored already lowercased for fast scoring.
  haystack: { fr: string; en: string };
  // Display fields preserved with original casing.
  label: { fr: string; en: string };
  snippet?: { fr: string; en: string };
  href: { fr: string; en: string };
  parent?: { fr: string; en: string }; // track or category
};

let cached: SearchDoc[] | null = null;

export function getSearchIndex(): SearchDoc[] {
  if (cached) return cached;
  const out: SearchDoc[] = [];

  for (const tr of TRACKS) {
    for (const l of tr.lessons) {
      const titleFr = `${String(l.index).padStart(2, '0')} · ${l.title.fr}`;
      const titleEn = `${String(l.index).padStart(2, '0')} · ${l.title.en}`;
      // The track summary is the public blurb already shown on /curriculum,
      // so it is safe to widen the haystack and to use as the snippet.
      const bodyFr = tr.summary.fr;
      const bodyEn = tr.summary.en;
      out.push({
        id: `l-${l.id}`,
        kind: 'lesson',
        haystack: {
          fr: (titleFr + ' ' + bodyFr + ' ' + tr.title.fr).toLowerCase(),
          en: (titleEn + ' ' + bodyEn + ' ' + tr.title.en).toLowerCase(),
        },
        label: { fr: titleFr, en: titleEn },
        snippet: { fr: trim(bodyFr, 120), en: trim(bodyEn, 120) },
        parent: { fr: tr.title.fr, en: tr.title.en },
        href: {
          fr: `/fr/learn/${tr.slug}/${l.slug}`,
          en: `/en/learn/${tr.slug}/${l.slug}`,
        },
      });
    }
  }

  for (const g of GLOSSARY) {
    out.push({
      id: `g-${g.term.en}`,
      kind: 'term',
      haystack: {
        fr: (g.term.fr + ' ' + g.definition.fr).toLowerCase(),
        en: (g.term.en + ' ' + g.definition.en).toLowerCase(),
      },
      label: g.term,
      snippet: { fr: trim(g.definition.fr, 120), en: trim(g.definition.en, 120) },
      href: { fr: '/fr/glossary', en: '/en/glossary' },
    });
  }

  cached = out;
  return out;
}

export function searchIndex(
  query: string,
  locale: 'fr' | 'en',
  limit = 8,
): SearchDoc[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const idx = getSearchIndex();
  const scored: { d: SearchDoc; score: number }[] = [];
  for (const d of idx) {
    const hay = d.haystack[locale];
    if (!hay.includes(q)) continue;
    let score = 10;
    if (d.label[locale].toLowerCase().includes(q)) score += 50;
    if (d.label[locale].toLowerCase().startsWith(q)) score += 30;
    if (d.kind === 'term') score += 5;
    scored.push({ d, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.d);
}

function trim(input: string, n: number): string {
  return input.length <= n ? input : input.slice(0, n - 1).trimEnd() + '…';
}
