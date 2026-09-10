// Single source of truth for the brand name.
//
// The name is a wordplay: k-NOW-Trade reads as both "know trade" and "now
// trade". The canonical casing keeps NOW in capitals so the second reading is
// visible in plain text too — the wordmark in components/brand/Logo.tsx does
// the same job typographically.
//
// The leading "n" matches the domain, nknowtrade.com. It is carried as its own
// part rather than merged into `lead` so the wordmark can keep the k separate:
// flattening the whole thing to "nknowtrade" would erase the k-NOW reading, and
// with it the reason the mark is built the way it is.
//
// Note: the operator's identity (see lib/legal/entity.ts) is deliberately NOT
// derived from this constant. Who runs the business is a legal fact, not
// branding.

export const BRAND_NAME = 'nkNOWTrade';

/** The parts of the wordmark, for surfaces that style them separately. */
export const BRAND_PARTS = { prefix: 'n', lead: 'k', now: 'NOW', tail: 'Trade' } as const;

/**
 * Domain the public contact addresses live on.
 *
 * Separate from NEXT_PUBLIC_SITE_URL because the two genuinely can differ —
 * mail can stay on one domain while the site moves to another, and during a
 * migration they will differ for as long as DNS verification takes.
 *
 * These addresses were hardcoded in 25 places across the legal pages, the
 * JSON-LD, the contact route and the mailer. Moving to a new domain meant
 * finding all of them; now it means setting one variable.
 */
// The fallback is the domain we actually own. It used to be `tickra.com`, a
// domain that is not ours — so any environment missing the variable published
// a contact address nobody reads, including inside the legally binding
// Mentions légales and on the From: header of every transactional email.
export const CONTACT_DOMAIN = process.env.NEXT_PUBLIC_CONTACT_DOMAIN ?? 'nknowtrade.com';

export const EMAIL = {
  support: `hello@${CONTACT_DOMAIN}`,
  press: `press@${CONTACT_DOMAIN}`,
  privacy: `privacy@${CONTACT_DOMAIN}`,
  partners: `partners@${CONTACT_DOMAIN}`,
} as const;
