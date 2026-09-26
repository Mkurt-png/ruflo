import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';

// London-school: the cookie jar and the database are mocked; what is under
// test is how getSession combines the signature with the revocation list.
const cookieJar = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (k: string) => (cookieJar.has(k) ? { value: cookieJar.get(k) } : undefined) }),
}));

const rpc = vi.fn();
vi.mock('@/lib/db/supabase', () => ({
  isDbConfigured: () => true,
  getDb: async () => ({ rpc }),
}));

const {
  decodeSession,
  getSession,
  revokeSession,
  revokeAllSessions,
  hashToken,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} = await import('./session');

const SECRET = 'test-secret';
function mint(email: string, expiresAt: number, secret = SECRET): string {
  const payload = `${email}.${expiresAt}`;
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}
const now = 1_800_000_000;

describe('decodeSession', () => {
  it('accepts a well-signed, unexpired cookie and derives when it was issued', () => {
    const d = decodeSession(mint('a@x.com', now + 100), SECRET, now)!;
    expect(d.email).toBe('a@x.com');
    // Every issuer uses the same lifetime, so issue time is exact.
    expect(d.issuedAt).toBe(now + 100 - SESSION_TTL_SECONDS);
  });

  it('rejects a tampered payload, a wrong secret, expiry and garbage', () => {
    const good = mint('a@x.com', now + 100);
    const [, sig] = good.split('.');
    const forged = `${Buffer.from(`b@x.com.${now + 100}`).toString('base64url')}.${sig}`;
    expect(decodeSession(forged, SECRET, now)).toBeNull();
    expect(decodeSession(mint('a@x.com', now + 100, 'other'), SECRET, now)).toBeNull();
    expect(decodeSession(mint('a@x.com', now - 1), SECRET, now)).toBeNull();
    expect(decodeSession('nope', SECRET, now)).toBeNull();
    expect(decodeSession(undefined, SECRET, now)).toBeNull();
    expect(decodeSession(good, undefined, now)).toBeNull();
  });

  it('normalises the address carried by older cookies', () => {
    expect(decodeSession(mint('A@X.com', now + 100), SECRET, now)!.email).toBe('a@x.com');
  });

  it('identifies each cookie separately, so one device can be signed out alone', () => {
    const a = mint('a@x.com', now + 100);
    const b = mint('a@x.com', now + 101);
    expect(hashToken(a)).not.toBe(hashToken(b));
    expect(decodeSession(a, SECRET, now)!.tokenHash).toBe(hashToken(a));
  });
});

describe('getSession checks the revocation list', () => {
  beforeEach(() => {
    process.env.AUTH_SIGNING_SECRET = SECRET;
    cookieJar.clear();
    rpc.mockReset();
    cookieJar.set(SESSION_COOKIE, mint('a@x.com', Math.floor(Date.now() / 1000) + 3600));
  });

  it('returns the session when the database says it is still valid', async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    expect((await getSession())?.email).toBe('a@x.com');
    expect(rpc).toHaveBeenCalledWith('tickra_session_valid', expect.objectContaining({ p_email: 'a@x.com' }));
  });

  it('returns null for a revoked session even though the signature is fine', async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    expect(await getSession()).toBeNull();
  });

  it('allows the session when the check cannot run — no mass sign-out on a DB blip', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'function does not exist' } });
    expect((await getSession())?.email).toBe('a@x.com');
  });

  it('does not ask the database about a cookie that fails its signature', async () => {
    cookieJar.set(SESSION_COOKIE, mint('a@x.com', Math.floor(Date.now() / 1000) + 3600, 'wrong'));
    expect(await getSession()).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe('revocation helpers', () => {
  beforeEach(() => {
    process.env.AUTH_SIGNING_SECRET = SECRET;
    rpc.mockReset();
    rpc.mockResolvedValue({ data: null, error: null });
  });

  it('sign-out revokes exactly this cookie, until it would have expired anyway', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const cookie = mint('a@x.com', exp);
    await revokeSession(cookie);
    expect(rpc).toHaveBeenCalledWith('tickra_revoke_session', {
      p_token_hash: hashToken(cookie),
      p_expires_at: new Date(exp * 1000).toISOString(),
    });
  });

  it('sign-out with no valid cookie records nothing', async () => {
    await revokeSession('garbage');
    await revokeSession(undefined);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('account deletion revokes every session for the normalised address', async () => {
    expect(await revokeAllSessions(' A@X.com ')).toBe(true);
    expect(rpc).toHaveBeenCalledWith('tickra_revoke_all_sessions', { p_email: 'a@x.com' });
  });
});
