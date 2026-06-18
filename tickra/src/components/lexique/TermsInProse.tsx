// TermsInProse — scans a paragraph of plain text for known glossary
// terms and wraps the first occurrence of each with <Term>. The
// editor wraps a paragraph with this once; every recognized term
// becomes openable on click without manual <Term> per word.
//
// Server-friendly: pure function shape, returns an array of React
// nodes (strings + <Term> client islands). The longest terms match
// first so "break of structure" wins over "break".

import { GLOSSARY } from '@/lib/curriculum/glossary';
import { Term } from '@/components/lexique/Term';
import type { Locale } from '@/lib/i18n/config';

function stripAccents(s: string): string {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

type Match = {
  start: number;
  end: number;
  term: string;
};

function findFirstNonOverlapping(haystackLower: string, needles: string[]): Match[] {
  const matches: Match[] = [];
  const taken = new Array(haystackLower.length).fill(false);
  // Longest first so "break of structure" beats "break".
  const sorted = [...needles].sort((a, b) => b.length - a.length);
  for (const needle of sorted) {
    const idx = haystackLower.indexOf(needle);
    if (idx < 0) continue;
    // Word boundaries
    const before = idx === 0 ? ' ' : haystackLower[idx - 1];
    const after = idx + needle.length >= haystackLower.length ? ' ' : haystackLower[idx + needle.length];
    if (/[\p{L}\p{N}]/u.test(before) || /[\p{L}\p{N}]/u.test(after)) continue;
    if (taken[idx]) continue;
    // Mark span
    for (let k = idx; k < idx + needle.length; k++) taken[k] = true;
    matches.push({ start: idx, end: idx + needle.length, term: needle });
  }
  matches.sort((a, b) => a.start - b.start);
  return matches;
}

export function TermsInProse({
  children,
  locale = 'fr',
}: {
  children: string;
  locale?: Locale;
}) {
  const text = children;
  const haystackLower = stripAccents(text);
  // Match the term in the page's locale plus the other locale's
  // spelling: an English jargon word ("stop-loss") inside French
  // prose, or a French formal name ("biais d'ancrage") inside English
  // prose, both still get the popover.
  const other: Locale = locale === 'fr' ? 'en' : 'fr';
  const needles = GLOSSARY.flatMap((g) => [
    stripAccents(g.term[locale]),
    stripAccents(g.term[other]),
  ]).filter((s, i, a) => s.length >= 3 && a.indexOf(s) === i);
  const matches = findFirstNonOverlapping(haystackLower, needles);
  if (matches.length === 0) return <>{text}</>;

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (m.start > cursor) nodes.push(text.slice(cursor, m.start));
    const original = text.slice(m.start, m.end);
    nodes.push(
      <Term key={`t-${i}`} locale={locale} termKey={original}>
        {original}
      </Term>,
    );
    cursor = m.end;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}

export default TermsInProse;
