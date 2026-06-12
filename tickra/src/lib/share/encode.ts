// Tiny encoder for shareable progress URLs. No DB, no auth — the payload is
// the URL. Encode is base64url over a compact JSON; values are clipped to
// reasonable ranges to keep tokens short.

export type SharePayload = {
  v: 1;
  n: string;       // display name (max 32)
  l: number;       // lessons done
  t: number;       // tracks done
  s: number;       // current streak
  d: string;       // ISO date of generation
};

export function encodeShare(payload: SharePayload): string {
  const safe: SharePayload = {
    v: 1,
    n: payload.n.slice(0, 32),
    l: Math.max(0, Math.min(9999, Math.round(payload.l))),
    t: Math.max(0, Math.min(99, Math.round(payload.t))),
    s: Math.max(0, Math.min(9999, Math.round(payload.s))),
    d: payload.d.slice(0, 25),
  };
  const json = JSON.stringify(safe);
  if (typeof window === 'undefined') {
    return Buffer.from(json).toString('base64url');
  }
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeShare(token: string): SharePayload | null {
  try {
    let json: string;
    if (typeof window === 'undefined') {
      json = Buffer.from(token, 'base64url').toString('utf8');
    } else {
      const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '==='.slice((b64.length + 3) % 4);
      json = decodeURIComponent(escape(atob(padded)));
    }
    const data = JSON.parse(json) as SharePayload;
    if (data.v !== 1) return null;
    if (typeof data.n !== 'string') return null;
    if (typeof data.l !== 'number' || typeof data.t !== 'number' || typeof data.s !== 'number') return null;
    return data;
  } catch {
    return null;
  }
}
