// One canonical form for an email address, applied everywhere an address
// enters the system.
//
// Addresses were stored exactly as typed. `tickra_users.email` is the primary
// key everything hangs off — progress, plan, bookmarks, passkeys, Stripe
// customer link — so "Hamza@Gmail.com" and "hamza@gmail.com" were two separate
// accounts with two separate histories. Concretely:
//
//   - sign in with a capital, buy Pro, sign in later from a phone keyboard
//     that lowercases the first letter: free account, no purchase, no progress
//   - a passkey registered under one casing does not authenticate the other
//   - the Stripe webhook writes to whichever casing Stripe happened to store,
//     which is the one the CARD was entered with, not the one the account uses
//
// The local part of an address is case-sensitive per RFC 5321, but no mail
// provider anyone uses actually treats it that way, and every consumer service
// folds case for exactly this reason. Getting two accounts for one person is
// the far worse failure.

/**
 * Trim, lowercase, and cap the length of an address.
 *
 * Applied at the database boundary (every query in lib/db/queries takes its
 * email through here) AND at the auth entry points, so the signed magic-link
 * payload carries the same form the session and the user row will use.
 */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 200);
}

/** Shape check only — deliverability is proven by the link actually arriving. */
export function emailLooksValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
