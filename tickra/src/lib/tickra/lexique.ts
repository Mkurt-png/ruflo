// Lexique — accent-insensitive lookup over the existing GLOSSARY data.
// Used by the <Term> client component to resolve a word to its
// definition. The lookup is forgiving: it tries the raw key, then the
// normalized key (lowercased, accents stripped, trailing -s removed).

import { GLOSSARY, type GlossaryTerm } from '@/lib/curriculum/glossary';

function normalize(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/s$/, '');
}

let CACHE: Map<string, GlossaryTerm> | null = null;
function buildIndex(): Map<string, GlossaryTerm> {
  if (CACHE) return CACHE;
  const m = new Map<string, GlossaryTerm>();
  for (const entry of GLOSSARY) {
    for (const key of [entry.term.fr, entry.term.en]) {
      m.set(normalize(key), entry);
    }
  }
  CACHE = m;
  return m;
}

export function findGlossaryTerm(label: string, _locale: 'fr' | 'en'): GlossaryTerm | null {
  if (!label) return null;
  const idx = buildIndex();
  return idx.get(normalize(label)) ?? null;
}
