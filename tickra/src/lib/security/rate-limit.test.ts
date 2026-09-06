import { describe, it, expect } from 'vitest';
import { clientIp } from './rate-limit';

const reqWith = (headers: Record<string, string>) =>
  new Request('https://tickra.app/api/auth/magic-link', { headers });

describe('clientIp', () => {
  it('takes the first hop of x-forwarded-for', () => {
    // Vercel appends proxies; the original client is first.
    const req = reqWith({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18, 150.172.238.178' });
    expect(clientIp(req)).toBe('203.0.113.7');
  });

  it('trims whitespace around the first hop', () => {
    expect(clientIp(reqWith({ 'x-forwarded-for': '  203.0.113.7 , 70.41.3.18' }))).toBe(
      '203.0.113.7',
    );
  });

  it('handles a single-value header', () => {
    expect(clientIp(reqWith({ 'x-forwarded-for': '203.0.113.7' }))).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip', () => {
    expect(clientIp(reqWith({ 'x-real-ip': '198.51.100.4' }))).toBe('198.51.100.4');
  });

  it('prefers x-forwarded-for over x-real-ip', () => {
    const req = reqWith({ 'x-forwarded-for': '203.0.113.7', 'x-real-ip': '198.51.100.4' });
    expect(clientIp(req)).toBe('203.0.113.7');
  });

  it('returns null when nothing trustworthy is present', () => {
    // Callers must skip the per-IP bucket rather than lump every visitor
    // into one shared key.
    expect(clientIp(reqWith({}))).toBeNull();
  });

  it('returns null for an empty forwarded header', () => {
    expect(clientIp(reqWith({ 'x-forwarded-for': '' }))).toBeNull();
  });
});
