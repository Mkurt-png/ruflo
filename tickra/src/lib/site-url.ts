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
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tickra1.vercel.app'
).replace(/\/+$/, '');

export { BRAND_NAME as SITE_NAME } from '@/lib/brand';
