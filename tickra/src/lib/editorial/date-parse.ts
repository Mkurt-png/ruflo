// Editorial article dates are stored per-locale as human display
// strings ("18 mai 2026" / "May 18, 2026") so the page renders them
// idiomatically. Schema.org's datePublished and OpenGraph's
// article:published_time both require ISO 8601, which Google's
// Article rich-result validator silently rejects when malformed.
//
// This parser converts either locale's display string into ISO. It
// stays narrow on purpose — only the months that appear in editorial
// dates, no full localisation library.

const FR_MONTHS: Record<string, number> = {
  janvier: 1, février: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, août: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12,
};

const EN_MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

/** Parses "18 mai 2026" or "May 18, 2026" into "2026-05-18". Returns
 * undefined when the input doesn't match either shape — callers
 * should fall back to omitting datePublished rather than emitting an
 * obviously wrong date. */
export function parseEditorialDate(display: string): string | undefined {
  const clean = display.toLowerCase().replace(/,/g, '').trim();
  // FR: "18 mai 2026"
  const fr = clean.match(/^(\d{1,2})\s+([a-zàâçéèêëîïôûùüÿñæœ]+)\s+(\d{4})$/);
  if (fr) {
    const day = Number(fr[1]);
    const month = FR_MONTHS[fr[2]];
    const year = Number(fr[3]);
    if (month) return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  // EN: "may 18 2026"
  const en = clean.match(/^([a-z]+)\s+(\d{1,2})\s+(\d{4})$/);
  if (en) {
    const month = EN_MONTHS[en[1]];
    const day = Number(en[2]);
    const year = Number(en[3]);
    if (month) return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return undefined;
}
