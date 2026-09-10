// FR ↔ EN slug pairs for the editorial articles.
//
// Every other route on the site has the same path in both languages, so the
// locale switcher could just swap segment 1. Editorial articles do not — the
// slugs are translated — so swapping the locale on /fr/editorial/journal-de-
// trading produced /en/editorial/journal-de-trading, which does not exist and
// hits notFound(). Five of the seven articles 404'd that way; only the two with
// identical slugs survived.

export const EDITORIAL_SLUGS: ReadonlyArray<{ fr: string; en: string }> = [
  { fr: 'lire-bougie-japonaise', en: 'read-japanese-candle' },
  { fr: 'esperance-mathematique-trading', en: 'expectancy-trading' },
  { fr: 'risk-of-ruin', en: 'risk-of-ruin' },
  { fr: 'supports-resistances-illusion', en: 'support-resistance-illusion' },
  { fr: 'journal-de-trading', en: 'trading-journal' },
  { fr: 'fomo-revenge-trading', en: 'fomo-revenge-trading' },
  { fr: 'analyse-multi-timeframe', en: 'multi-timeframe-analysis' },
];

/** The same article's slug in the other locale, or null if it is not one. */
export function translateEditorialSlug(
  slug: string,
  to: 'fr' | 'en',
): string | null {
  const from = to === 'fr' ? 'en' : 'fr';
  const pair = EDITORIAL_SLUGS.find((p) => p[from] === slug);
  return pair ? pair[to] : null;
}

/**
 * Rewrite a full pathname for another locale.
 *
 * Handles the plain case (swap the locale segment) and the editorial case
 * (swap the locale segment AND translate the slug).
 */
export function localisePath(pathname: string, to: 'fr' | 'en'): string {
  const segments = pathname.split('/');
  if (segments.length < 2) return `/${to}`;
  segments[1] = to;
  // /<locale>/editorial/<slug>
  if (segments[2] === 'editorial' && segments[3]) {
    const translated = translateEditorialSlug(segments[3], to);
    // An unknown slug is left alone rather than guessed at — better a 404 the
    // author can see than a silent redirect to the wrong article.
    if (translated) segments[3] = translated;
  }
  return segments.join('/') || `/${to}`;
}
