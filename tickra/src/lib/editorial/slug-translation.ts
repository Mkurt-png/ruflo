import fr from '@/lib/i18n/locales/fr';
import en from '@/lib/i18n/locales/en';
import type { Locale } from '@/lib/i18n/config';

// Editorial article slugs differ across locales: the FR post lives
// at `/fr/editorial/lire-bougie-japonaise`, while the EN translation
// is at `/en/editorial/read-japanese-candle`. The two dictionaries
// keep their `posts` objects in the same order, so we can build a
// position-aligned translation map at module load.
//
// Used by the editorial-article generateMetadata to emit hreflang
// alternates that actually resolve, instead of pointing /en to a
// French slug that 404s.

const FR_SLUGS = Object.keys(fr.editorialArticles.posts);
const EN_SLUGS = Object.keys(en.editorialArticles.posts);

const FR_TO_EN = new Map<string, string>();
const EN_TO_FR = new Map<string, string>();

const min = Math.min(FR_SLUGS.length, EN_SLUGS.length);
for (let i = 0; i < min; i++) {
  FR_TO_EN.set(FR_SLUGS[i], EN_SLUGS[i]);
  EN_TO_FR.set(EN_SLUGS[i], FR_SLUGS[i]);
}

/** Returns the editorial slug in the target locale, falling back to the
 * input slug when no translation is registered (so the hreflang URL is
 * never undefined — Google would reject a malformed map). */
export function translateArticleSlug(
  slug: string,
  from: Locale,
  to: Locale,
): string {
  if (from === to) return slug;
  const map = from === 'fr' ? FR_TO_EN : EN_TO_FR;
  return map.get(slug) ?? slug;
}
