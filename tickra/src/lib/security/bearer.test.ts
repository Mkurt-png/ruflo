import { describe, it, expect } from 'vitest';
import { bearerMatches } from './bearer';

const req = (auth?: string) =>
  new Request('https://x/api/cron/y', auth ? { headers: { authorization: auth } } : {});

describe('bearerMatches', () => {
  it('accepts the exact bearer secret', () => {
    expect(bearerMatches(req('Bearer s3cret'), 's3cret')).toBe(true);
  });
  it('rejects a wrong, partial or missing header', () => {
    expect(bearerMatches(req('Bearer s3creT'), 's3cret')).toBe(false);
    expect(bearerMatches(req('Bearer s3cre'), 's3cret')).toBe(false);
    expect(bearerMatches(req('s3cret'), 's3cret')).toBe(false);
    expect(bearerMatches(req(), 's3cret')).toBe(false);
  });
  it('fails closed when no secret is configured', () => {
    // `Bearer undefined` must not be a working password.
    expect(bearerMatches(req('Bearer undefined'), undefined)).toBe(false);
    expect(bearerMatches(req('Bearer '), '')).toBe(false);
  });
});
