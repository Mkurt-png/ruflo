// Single source of truth for the brand name.
//
// The name is a wordplay: k-NOW-Trade reads as both "know trade" and "now
// trade". The canonical casing keeps NOW in capitals so the second reading is
// visible in plain text too — the wordmark in components/brand/Logo.tsx does
// the same job typographically.
//
// Note: the operator's identity (see lib/legal/entity.ts) is deliberately NOT
// derived from this constant. Who runs the business is a legal fact, not
// branding.

export const BRAND_NAME = 'kNOWTrade';

/** The three parts of the wordmark, for surfaces that style them separately. */
export const BRAND_PARTS = { lead: 'k', now: 'NOW', tail: 'Trade' } as const;

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
export const CONTACT_DOMAIN = process.env.NEXT_PUBLIC_CONTACT_DOMAIN ?? 'tickra.com';

export const EMAIL = {
  support: `hello@${CONTACT_DOMAIN}`,
  press: `press@${CONTACT_DOMAIN}`,
  privacy: `privacy@${CONTACT_DOMAIN}`,
  partners: `partners@${CONTACT_DOMAIN}`,
} as const;
