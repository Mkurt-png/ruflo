import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

// A page title is what shows in the browser tab and in the Google result. It
// has to be in the reader's language.
//
// `export const metadata = { title: '…' }` is a module constant — evaluated
// once, served on both /fr and /en. About thirty pages therefore showed French
// titles to English readers, and /leaderboard showed English to French ones.
// The fix is `generateMetadata({ params })`; this test stops the constant from
// coming back.

const APP = resolve(__dirname);
const LOCALE_DIR = join(APP, '[locale]');

function pages(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      pages(full, out);
      continue;
    }
    if (name === 'page.tsx') out.push(full);
  }
  return out;
}

const STATIC_TITLE = /export const metadata\b[\s\S]{0,400}?\btitle:\s*['"`]/;

describe('every localised page titles itself in the reader’s language', () => {
  it('no page under [locale] exports a static metadata title', () => {
    const offenders = pages(LOCALE_DIR)
      .filter((f) => STATIC_TITLE.test(readFileSync(f, 'utf8')))
      .map((f) => relative(APP, f));
    expect(offenders).toEqual([]);
  });

  it('pages that do title themselves branch on the locale', () => {
    const notBranching: string[] = [];
    for (const f of pages(LOCALE_DIR)) {
      const src = readFileSync(f, 'utf8');
      if (!/export (?:async )?function generateMetadata/.test(src)) continue;
      if (!/\btitle:/.test(src)) continue;
      // Either an inline ternary on locale, or a bilingual object handed to a
      // helper such as editorialMeta({ title: { fr, en } }).
      const branches =
        /locale === '(?:fr|en)'\s*\?/.test(src) ||
        /title:\s*\{[\s\S]{0,200}?\bfr:/.test(src) ||
        // Indexing a bilingual record by the locale, e.g.
        // `found.lesson.title[params.locale as Locale]`.
        /\[\s*(?:params\.)?locale\b/.test(src) ||
        /dict\./.test(src);
      if (!branches) notBranching.push(relative(APP, f));
    }
    expect(notBranching).toEqual([]);
  });
});
