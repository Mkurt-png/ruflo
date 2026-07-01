// TICKRA-PHASE-3: minimal, dependency-free RSS 2.0 builder. Pure and
// escaping-safe so it can be unit tested and reused by any feed route.

export type RssItem = {
  title: string;
  link: string;
  description: string;
  guid: string;
  pubDate?: Date;
};

export type RssOptions = {
  title: string;
  description: string;
  siteUrl: string;
  feedUrl: string;
  language: string;
  items: RssItem[];
};

export function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function item(i: RssItem): string {
  const parts = [
    `<title>${escapeXml(i.title)}</title>`,
    `<link>${escapeXml(i.link)}</link>`,
    `<guid isPermaLink="false">${escapeXml(i.guid)}</guid>`,
    `<description>${escapeXml(i.description)}</description>`,
  ];
  if (i.pubDate && !Number.isNaN(i.pubDate.getTime())) {
    parts.push(`<pubDate>${i.pubDate.toUTCString()}</pubDate>`);
  }
  return `<item>${parts.join('')}</item>`;
}

export function buildRss(opts: RssOptions): string {
  const channel = [
    `<title>${escapeXml(opts.title)}</title>`,
    `<link>${escapeXml(opts.siteUrl)}</link>`,
    `<description>${escapeXml(opts.description)}</description>`,
    `<language>${escapeXml(opts.language)}</language>`,
    `<atom:link href="${escapeXml(opts.feedUrl)}" rel="self" type="application/rss+xml"/>`,
    ...opts.items.map(item),
  ].join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>${channel}</channel></rss>`;
}
