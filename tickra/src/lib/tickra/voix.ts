// Les Voix — monthly interview series with anonymous working traders,
// recorded by the editor.
//
// TICKRA-FIX(honesty): this shipped with three seeded "interviews" — Marin in
// Marseille, Anna in Lyon, Ari in Tel-Aviv — carrying verbatim quotes, dates
// and trades, while the page told readers "once a month, the editor records an
// interview with a working trader". None of those conversations happened. This
// file's own header admitted as much ("only text excerpts are seeded so the
// series can exist before the first recording is published"), which is another
// way of saying the page presented invented testimony as reporting, on a site
// that sells a paid product. The three names were also three months stale for a
// monthly series, so the section read as abandoned on day one either way.
//
// The shape stays — audio URL, excerpts, signature — so a real interview drops
// straight in. The array is empty until there is one.

export type Voix = {
  id: string;
  date: string; // YYYY-MM-DD
  pseudonym: string;
  city: { fr: string; en: string };
  craft: { fr: string; en: string };
  audioUrl?: string;
  excerpts: { fr: string; en: string }[];
  signature: { fr: string; en: string };
};

export const VOIX: Voix[] = [];
