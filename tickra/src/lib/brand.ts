// Single source of truth for the brand name.
//
// The name is a wordplay: k-NOW-Trade reads as both "know trade" and "now
// trade". The canonical casing keeps NOW in capitals so the second reading is
// visible in plain text too — the wordmark in components/brand/Logo.tsx does
// the same job typographically.
//
// Note: the legal entity (Tickra SAS) and the tickra.com contact addresses are
// deliberately NOT derived from this constant. Those are registered facts, not
// branding, and are spelled out literally in the legal pages.

export const BRAND_NAME = 'kNOWTrade';

/** The three parts of the wordmark, for surfaces that style them separately. */
export const BRAND_PARTS = { lead: 'k', now: 'NOW', tail: 'Trade' } as const;
