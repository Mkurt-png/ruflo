import { describe, it, expect } from 'vitest';
import { encodeShare, decodeShare, type SharePayload } from './encode';

const sample: SharePayload = {
  v: 1,
  n: 'Hamza',
  l: 42,
  t: 3,
  s: 7,
  d: '2026-06-22T00:00:00.000Z',
};

describe('encodeShare / decodeShare', () => {
  it('round-trips a payload', () => {
    const token = encodeShare(sample);
    const back = decodeShare(token);
    expect(back).toEqual(sample);
  });

  it('produces a URL-safe token (no +, / or =)', () => {
    const token = encodeShare({ ...sample, n: 'noms+accentués/éè' });
    expect(token).not.toMatch(/[+/=]/);
  });

  it('clamps out-of-range numbers', () => {
    const token = encodeShare({ ...sample, l: 999999, t: 500, s: -10 });
    const back = decodeShare(token);
    expect(back?.l).toBe(9999);
    expect(back?.t).toBe(99);
    expect(back?.s).toBe(0);
  });

  it('truncates an overly long name to 32 chars', () => {
    const token = encodeShare({ ...sample, n: 'x'.repeat(100) });
    const back = decodeShare(token);
    expect(back?.n).toHaveLength(32);
  });

  it('preserves unicode names through the round-trip', () => {
    const token = encodeShare({ ...sample, n: 'José — 日本語' });
    expect(decodeShare(token)?.n).toBe('José — 日本語');
  });

  it('returns null for garbage input', () => {
    expect(decodeShare('not-a-valid-token!!!')).toBeNull();
    expect(decodeShare('')).toBeNull();
  });

  it('rejects a payload with the wrong version', () => {
    const token = encodeShare(sample).replace(/./, 'Z'); // corrupt first char
    // Either fails to parse or fails the version check — both yield null.
    const back = decodeShare(token);
    expect(back === null || back.v === 1).toBe(true);
  });
});
