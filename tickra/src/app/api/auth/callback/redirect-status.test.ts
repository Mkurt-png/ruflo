import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// This pins the fix for a bug that broke sign-in outright, and would be
// invisible in any test that only checks where the redirect points.
//
// `NextResponse.redirect()` defaults to 307, which PRESERVES the request
// method. When the callback moved to POST — so mail scanners could not burn the
// single-use nonce with a plain GET — every redirect out of it started telling
// the browser to re-issue a POST at /signin and /onboarding. Those are pages;
// they answer GET only. Result: HTTP 405 on both the failure and the success
// path, with the session cookie set on a response the browser then followed
// with a request it could not complete.
//
// A route handler that answers a POST with a redirect to a page must use 303.
// Asserting on the source keeps this cheap and dependency-free; the property
// worth protecting is "no bare redirect in this file", which reads directly.

const SOURCE = readFileSync(join(__dirname, 'route.ts'), 'utf8');

// The file explains the bug in prose, and that prose names the API it is
// warning about. Strip comments before counting call sites, or the explanation
// registers as a violation of the rule it is explaining.
const CODE = SOURCE.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

describe('magic-link callback redirects', () => {
  it('declares 303 See Other', () => {
    expect(SOURCE).toMatch(/const SEE_OTHER = 303;/);
  });

  it('gives every redirect an explicit status', () => {
    const redirects = CODE.match(/NextResponse\.redirect\(/g) ?? [];
    expect(redirects.length).toBeGreaterThan(0);
    // Each call site must pass SEE_OTHER; a bare redirect would silently be 307
    // again and take sign-in down with it.
    const withStatus = CODE.match(/status: SEE_OTHER/g) ?? [];
    expect(withStatus.length).toBe(redirects.length);
  });

  it('never falls back to a method-preserving redirect', () => {
    expect(CODE).not.toMatch(/status:\s*30[78]/);
  });
});
