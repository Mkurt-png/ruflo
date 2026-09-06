// Single source of truth for the canonical site URL.
// Set NEXT_PUBLIC_SITE_URL in Vercel to swap to the custom domain later
// without touching the code.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tickra1.vercel.app'
).replace(/\/+$/, '');

export { BRAND_NAME as SITE_NAME } from '@/lib/brand';
