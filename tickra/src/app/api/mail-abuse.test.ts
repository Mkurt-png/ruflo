import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Every unauthenticated route that makes Resend send mail shares one quota
// with sign-in. Exhaust it from any of them and nobody can receive a magic
// link. These are source-level guards: the handlers need a database and a
// mail provider to run, so the properties are checked where they are written.

const src = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');

describe('unauthenticated mail senders are throttled', () => {
  it.each(['newsletter/route.ts', 'contact/route.ts', 'auth/magic-link/route.ts'])('%s', (p) => {
    expect(src(p)).toMatch(/await rateLimit\(/);
  });
});

describe('newsletter unsubscribe link', () => {
  const s = src('newsletter/route.ts');
  it('carries a signed token — /api/unsubscribe accepts nothing else', () => {
    expect(s).toMatch(/api\/unsubscribe\?token=/);
    expect(s).not.toMatch(/api\/unsubscribe\?email=/);
    expect(s).toMatch(/signUnsubToken\(/);
  });
  it('is offered as one-click List-Unsubscribe', () => {
    expect(s).toMatch(/'List-Unsubscribe'/);
    expect(s).toMatch(/'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'/);
  });
});

describe('/api/unsubscribe', () => {
  const s = src('unsubscribe/route.ts');
  const get = s.slice(s.indexOf('export async function GET'), s.indexOf('export async function POST'));
  const post = s.slice(s.indexOf('export async function POST'));

  it('does not change anything on GET — mail scanners prefetch links', () => {
    expect(get).not.toMatch(/setDigestOptIn|unsubscribeFromAudience/);
    expect(get).toMatch(/method="POST"/);
  });
  it('unsubscribes from both lists on POST', () => {
    expect(post).toMatch(/setDigestOptIn\([^)]*false\)/);
    expect(post).toMatch(/unsubscribeFromAudience\(/);
  });
});

describe('contact form', () => {
  it('does not return the mail provider error to the visitor', () => {
    expect(src('contact/route.ts')).not.toMatch(/detail: result\.error/);
  });
});
