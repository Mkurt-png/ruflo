import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { normaliseEmail, emailLooksValid } from './email';

describe('normaliseEmail', () => {
  it('folds case', () => {
    expect(normaliseEmail('Hamza@Gmail.com')).toBe('hamza@gmail.com');
    expect(normaliseEmail('HAMZA@GMAIL.COM')).toBe('hamza@gmail.com');
  });

  it('trims surrounding whitespace, which mobile keyboards add', () => {
    expect(normaliseEmail('  hamza@gmail.com ')).toBe('hamza@gmail.com');
    expect(normaliseEmail('hamza@gmail.com\n')).toBe('hamza@gmail.com');
  });

  it('is idempotent — normalising twice changes nothing', () => {
    const once = normaliseEmail(' Hamza@Gmail.com ');
    expect(normaliseEmail(once)).toBe(once);
  });

  it('caps the length so a long string cannot be used as a key', () => {
    expect(normaliseEmail('a'.repeat(500) + '@x.com').length).toBe(200);
  });

  it('maps the casings of one address to one key', () => {
    const variants = ['a@b.com', 'A@b.com', 'a@B.COM', ' A@B.com '];
    expect(new Set(variants.map(normaliseEmail)).size).toBe(1);
  });
});

describe('emailLooksValid', () => {
  it('accepts ordinary addresses', () => {
    expect(emailLooksValid('hamza@gmail.com')).toBe(true);
    expect(emailLooksValid('a.b+tag@sub.example.co.uk')).toBe(true);
  });

  it('rejects what is obviously not one', () => {
    for (const bad of ['', 'hamza', 'hamza@', '@gmail.com', 'a b@c.com', 'a@b']) {
      expect(emailLooksValid(bad), bad).toBe(false);
    }
  });
});

// The whole point of normalising at the DB boundary is that no call site can
// forget. If a helper that takes an email skips it, one code path silently
// creates a second account for the same person again.
describe('the database layer normalises every address it is given', () => {
  const src = readFileSync(resolve(__dirname, '../db/queries.ts'), 'utf8');

  it('every exported helper taking an email normalises it', () => {
    const missing: string[] = [];
    // Match `export async function name(` through its opening brace, then the
    // first statement of the body.
    for (const m of src.matchAll(
      /export async function (\w+)\(([\s\S]*?)\)[^{]*\{\n((?:.*\n){0,6})/g,
    )) {
      const [, name, params, head] = m;
      if (!/\bemail:\s*string/.test(params)) continue;
      // Normalising must happen before the address is used as a key, so look
      // only at the top of the body — comments there are fine, a query is not.
      if (!/normaliseEmail\(\s*(?:args\.)?email\s*\)/.test(head)) missing.push(name);
    }
    expect(missing).toEqual([]);
  });
});
