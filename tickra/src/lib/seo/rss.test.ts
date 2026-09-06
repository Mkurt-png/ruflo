import { describe, it, expect } from 'vitest';
import { buildRss, escapeXml, type RssItem } from './rss';

describe('escapeXml', () => {
  it('escapes the five XML special characters', () => {
    expect(escapeXml(`a & b < c > d " e ' f`)).toBe(
      'a &amp; b &lt; c &gt; d &quot; e &apos; f',
    );
  });
});

describe('buildRss', () => {
  const items: RssItem[] = [
    {
      title: 'How to read a candle',
      link: 'https://tickra.app/en/editorial/read-candle',
      description: 'Beyond red & green.',
      guid: 'read-candle',
      pubDate: new Date('2026-05-18T00:00:00Z'),
    },
  ];
  const xml = buildRss({
    title: 'Tickra Editorial',
    description: 'Essays',
    siteUrl: 'https://tickra.app/en',
    feedUrl: 'https://tickra.app/en/editorial/feed.xml',
    language: 'en',
    items,
  });

  it('produces a well-formed RSS 2.0 envelope', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<channel>');
    expect(xml).toContain('</channel></rss>');
  });

  it('includes the self atom:link', () => {
    expect(xml).toContain('rel="self"');
    expect(xml).toContain('https://tickra.app/en/editorial/feed.xml');
  });

  it('renders one <item> per entry with title, link and guid', () => {
    expect((xml.match(/<item>/g) || []).length).toBe(1);
    expect(xml).toContain('<title>How to read a candle</title>');
    expect(xml).toContain('<link>https://tickra.app/en/editorial/read-candle</link>');
    expect(xml).toContain('<guid isPermaLink="false">read-candle</guid>');
  });

  it('formats pubDate as an RFC-822 (UTC) string', () => {
    expect(xml).toContain('<pubDate>Mon, 18 May 2026 00:00:00 GMT</pubDate>');
  });

  it('escapes special characters in item content', () => {
    expect(xml).toContain('Beyond red &amp; green.');
  });

  it('omits pubDate when the date is invalid', () => {
    const out = buildRss({
      title: 't',
      description: 'd',
      siteUrl: 's',
      feedUrl: 'f',
      language: 'en',
      items: [{ title: 'x', link: 'l', description: 'd', guid: 'g', pubDate: new Date('not-a-date') }],
    });
    expect(out).not.toContain('<pubDate>');
  });
});
