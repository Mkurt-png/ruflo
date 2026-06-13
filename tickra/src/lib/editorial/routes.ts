// The editorial cluster — every room of La Maison plus its protocol stubs.
// Used by layout overlays (mobile sticky CTA, AskTickra) to honour the
// /silence rule: no chat bubble, no popping pill on a reading page.
//
// When a new editorial room ships, add its slug here so the silence
// rule still covers it.
// /journal is intentionally absent: it's a private surface where the
// reader actively wants the AskTickra assistant to look at trades.
// Silence applies to reading rooms, not working rooms.
export const EDITORIAL_SEGMENTS: ReadonlySet<string> = new Set([
  'maison', 'criee', 'lettre', 'veillee', 'voix', 'lexique', 'cercle',
  'almanach', 'annuaire', 'recherche', 'rentree', 'random',
  'refus', 'erratum', 'silence', 'cote-inversee', 'method', 'etages',
  'survie', 'bureau-partage', 'edition-lifetime',
  'institutionnel', 'mecenat',
]);

/** True if pathname is /{locale}/{editorial-room}[/...]. */
export function isEditorialPath(pathname: string): boolean {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length < 2) return false;
  return EDITORIAL_SEGMENTS.has(segs[1]);
}
