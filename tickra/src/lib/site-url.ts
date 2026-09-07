// Single source of truth for the canonical site URL.
// Set NEXT_PUBLIC_SITE_URL in Vercel to swap to the custom domain later
// without touching the code.
//
// ⚠️  Changing this changes the WebAuthn relying-party ID (lib/auth/passkeys
//     derives it from here). A passkey is cryptographically bound to the
//     domain it was created under, so every existing passkey stops working on
//     a new domain and has to be re-registered. Nobody is locked out — magic
//     link and Google sign-in are unaffected — but warn users before moving,
//     or move while the user count is still small.
//
// The fallback is the LAUNCH domain, not the old preview host. This value is
// baked into robots.txt, every sitemap entry, every canonical URL, every OG
// share-card address and every link in every transactional email — so a stale
// fallback silently publishes the wrong domain everywhere the moment
// NEXT_PUBLIC_SITE_URL is missing from an environment, with no error to notice.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nknowtrade.com'
).replace(/\/+$/, '');

export { BRAND_NAME as SITE_NAME } from '@/lib/brand';
