import { timingSafeEqual } from 'node:crypto';

/**
 * True when `Authorization: Bearer <secret>` matches `secret`, compared in
 * constant time. False — never open — when the secret is unset or empty.
 *
 * The cron routes compared with `===`, whose running time depends on how many
 * leading characters match; over enough requests that leaks the secret a
 * character at a time. Remote timing attacks against a serverless function
 * are noisy, but the fix costs nothing.
 */
export function bearerMatches(req: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  const header = req.headers.get('authorization') ?? '';
  const got = Buffer.from(header);
  const want = Buffer.from(`Bearer ${secret}`);
  // Length is not secret; timingSafeEqual throws when lengths differ.
  if (got.length !== want.length) return false;
  return timingSafeEqual(got, want);
}
