// TICKRA-FIX(security): central debug-endpoint authorisation.
//
// Previous behaviour opened every /api/debug/* route whenever VERCEL_ENV was
// anything other than "production" — which meant **preview deployments were
// wide open**. Preview URLs are public (no Vercel SSO on this project), so
// anyone holding one could hit /api/debug/sendmail to send mail through our
// Resend domain, or /api/debug/ai to burn the model budget.
//
// New rule — one exception only:
//   1. Not running on Vercel at all (local `next dev`) → open, for convenience.
//   2. Any Vercel deployment, preview included → `x-debug-token: $DEBUG_TOKEN`
//      is required. No token configured means the routes stay shut.

import { timingSafeEqual } from 'node:crypto';

export type DebugGateResult = { ok: true } | { ok: false; reason: 'forbidden' };

function secureEquals(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  // Length is not secret here, and timingSafeEqual throws on a mismatch.
  if (A.length !== B.length) return false;
  return timingSafeEqual(A, B);
}

export function isDebugAuthorised(req: Request): DebugGateResult {
  // Local development only. On Vercel this variable is always set.
  if (!process.env.VERCEL) return { ok: true };

  const token = process.env.DEBUG_TOKEN;
  if (!token) return { ok: false, reason: 'forbidden' };

  const got = req.headers.get('x-debug-token');
  if (!got) return { ok: false, reason: 'forbidden' };

  return secureEquals(got, token) ? { ok: true } : { ok: false, reason: 'forbidden' };
}
