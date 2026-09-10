import { describe, it, expect } from 'vitest';
import { editorialMeta } from './editorial-meta';
import { buildMetadata } from '@/lib/seo';
import { BRAND_NAME } from '@/lib/brand';

const sample = {
  slug: 'criee',
  title: { fr: 'La Criée', en: 'The Criée' },
  description: { fr: 'Une question par jour.', en: 'One question a day.' },
};

describe('editorialMeta', () => {
  it('leaves the brand suffix to the layout template', () => {
    // The root layout sets `title: { template: '%s · nkNOWTrade' }` and Next
    // applies it to any plain-string title a page returns. Appending the brand
    // here too produced "The Criée · nkNOWTrade · nkNOWTrade" in the tab and in
    // search results, on all sixteen editorial rooms. Only visible in rendered
    // HTML, because the template lives in another file.
    const template = buildMetadata('fr').title;
    expect(template).toMatchObject({ template: `%s · ${BRAND_NAME}` });

    for (const locale of ['fr', 'en'] as const) {
      const title = editorialMeta({ ...sample, locale }).title as string;
      expect(title).not.toContain(BRAND_NAME);
      expect(title).toBe(sample.title[locale]);
    }
  });

  it('titles and describes the page in the requested locale', () => {
    expect(editorialMeta({ ...sample, locale: 'en' }).title).toBe('The Criée');
    expect(editorialMeta({ ...sample, locale: 'fr' }).title).toBe('La Criée');
    expect(editorialMeta({ ...sample, locale: 'en' }).description).toBe('One question a day.');
  });

  it('canonicalises to the locale being rendered, not always to /fr', () => {
    // Callers used `export const metadata = editorialMeta(...)`, a constant
    // evaluated once with the default locale, so /en/<slug> canonicalised to
    // /fr/<slug> and could never be indexed.
    expect(editorialMeta({ ...sample, locale: 'en' }).alternates?.canonical).toContain('/en/criee');
    expect(editorialMeta({ ...sample, locale: 'fr' }).alternates?.canonical).toContain('/fr/criee');
  });

  it('still carries the brand on the OpenGraph title, which takes no template', () => {
    const og = editorialMeta({ ...sample, locale: 'en' }).openGraph;
    expect(og).toMatchObject({ siteName: BRAND_NAME, title: 'The Criée' });
  });

  it('accepts a plain string for copy that is the same in both locales', () => {
    const meta = editorialMeta({ slug: 'x', title: 'Colophon', description: 'd', locale: 'en' });
    expect(meta.title).toBe('Colophon');
  });
});
