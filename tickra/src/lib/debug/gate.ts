// TICKRA-FIX(security): central debug-endpoint authorisation.
// Every /api/debug/* route should pass through this gate. Two ways to pass:
//   1. We're NOT on Vercel production (preview, dev, etc.).
//   2. The request carries `x-debug-token: <process.env.DEBUG_TOKEN>`.
// Without one of these, the route refuses to run.
//
// This closes off:
//   - Anyone hitting /api/debug/ai to burn the Anthropic budget.
//   - Anyone hitting /api/debug/sendmail to spam victims through our domain.
//   - Anyone enumerating /api/debug/session to fingerprint logged-in users.

export type DebugGateResult = { ok: true } | { ok: false; reason: 'forbidden' };

export function isDebugAuthorised(req: Request): DebugGateResult {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { ok: true };
  }
  const token = process.env.DEBUG_TOKEN;
  if (!token) return { ok: false, reason: 'forbidden' };
  const got = req.headers.get('x-debug-token');
  if (got === token) return { ok: true };
  return { ok: false, reason: 'forbidden' };
}
