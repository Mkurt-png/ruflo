import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

// getSession became async when revocation was added. A caller that forgets
// `await` gets a Promise — and a Promise is always truthy, so
// `if (!session) return 401` would let EVERY request through, signed in or
// not. TypeScript catches the `.email` read that usually follows, but not a
// bare truthiness check. This scans for any call that is not awaited.
//
// And revocation derives a cookie's issue time as expiresAt − the session
// lifetime, which is only right if every issuer uses the same lifetime.

const SRC = resolve(__dirname, '../..');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [p] : [];
  });
}
const files = walk(SRC).map((p) => ({ path: relative(SRC, p), text: readFileSync(p, 'utf8') }));

describe('session callers', () => {
  it('await every getSession() call', () => {
    const bad = files.flatMap(({ path, text }) =>
      text.split('\n').flatMap((line, i) =>
        /\bgetSession\(\)/.test(line) &&
        !/await getSession\(\)/.test(line) &&
        !/^\s*(\/\/|\*)/.test(line)
          ? [`${path}:${i + 1}: ${line.trim()}`]
          : [],
      ),
    );
    expect(bad).toEqual([]);
  });

  it('issue session cookies with the shared SESSION_TTL_SECONDS only', () => {
    const issuers = files.filter(({ text }) =>
      /cookies\.set\((COOKIE_NAME|SESSION_COOKIE),\s*(sessionValue|value|cookie\.value)/.test(text),
    );
    expect(issuers.length).toBeGreaterThanOrEqual(3); // magic link, Google, passkey
    for (const { path, text } of issuers) {
      expect(text, path).toMatch(/SESSION_TTL_SECONDS/);
      expect(text, path).not.toMatch(/60 \* 60 \* 24 \* 7/);
    }
  });
});
