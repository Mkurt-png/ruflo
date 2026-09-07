import { describe, it, expect } from 'vitest';
import { buildMetadata, pageSeo } from './seo';

// The root layout's metadata is inherited by every page that does not override
// a given field. A canonical URL there is therefore a canonical URL on all ~470
// pages — and it pointed at the locale home page, telling Google the entire
// site was a duplicate of two URLs.

describe('buildMetadata (root layout)', () => {
  it('declares no canonical, so pages stay self-canonical', () => {
    for (const locale of ['fr', 'en'] as const) {
      const meta = buildMetadata(locale);
      expect(meta.alternates?.canonical).toBeUndefined();
    }
  });

  it('declares no absolute openGraph url, for the same reason', () => {
    for (const locale of ['fr', 'en'] as const) {
      expect(buildMetadata(locale).openGraph).not.toHaveProperty('url');
    }
  });

  it('still sets metadataBase so relative URLs resolve', () => {
    expect(buildMetadata('fr').metadataBase).toBeInstanceOf(URL);
  });
});

describe('pageSeo', () => {
  it('points a page at itself, not at the home page', () => {
    expect(pageSeo('fr', '/pricing').alternates?.canonical).toBe('/fr/pricing');
    expect(pageSeo('en', '/learn/forex-basics').alternates?.canonical).toBe(
      '/en/learn/forex-basics',
    );
  });

  it('pairs the two locales at the same path', () => {
    const langs = pageSeo('en', '/about').alternates?.languages;
    expect(langs).toEqual({ fr: '/fr/about', en: '/en/about' });
  });

  it('handles the locale home page', () => {
    expect(pageSeo('fr').alternates?.canonical).toBe('/fr');
  });

  it('tolerates a path given without a leading slash', () => {
    expect(pageSeo('fr', 'pricing').alternates?.canonical).toBe('/fr/pricing');
  });
});
