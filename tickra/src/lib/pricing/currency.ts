// Show every visitor a price in their own currency.
//
// Two layers have to agree, or the customer sees one price on the pricing page
// and a different one on Stripe's checkout — the fastest way to lose a sale:
//
//   1. This module decides which currency to DISPLAY, from the visitor's
//      country (Vercel's `x-vercel-ip-country` header).
//   2. /api/checkout passes that same currency to Stripe, which charges from
//      the Price's `currency_options`.
//
// Amounts are set per currency rather than converted from a base. A live FX
// rate turns 14.99 CAD into "9,73 €", which reads as a machine translation of
// a price rather than a price. Each currency gets a figure chosen to look
// deliberate in its own market.
//
// Amounts are in MINOR units (cents), the same unit Stripe uses, so there is
// never a rounding step between what is shown and what is charged.

/** Currencies we quote in. Lowercase to match Stripe's own casing. */
export const CURRENCIES = ['eur', 'usd', 'cad'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Fallback when the visitor's country is unknown or unsupported. */
export const DEFAULT_CURRENCY: Currency = 'eur';

export function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value);
}

// Eurozone plus the rest of the EU/EEA. Non-euro EU members (PL, SE, CZ…) are
// included deliberately: quoting them in euros is normal and expected, and is
// far better than defaulting them to US dollars.
const EUR_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'IS', 'LI', 'NO', 'CH', 'MC', 'AD', 'SM', 'VA', 'GP', 'MQ', 'GF', 'RE',
  'YT', 'PM', 'BL', 'MF',
]);

const CAD_COUNTRIES = new Set(['CA']);

/**
 * The currency to quote a visitor from `country` (an ISO 3166-1 alpha-2 code).
 * Anything outside the EU/EEA and Canada is quoted in US dollars, the usual
 * default for international customers — except an unknown country, which falls
 * back to euros because that is the company's home market.
 */
export function currencyForCountry(country: string | null | undefined): Currency {
  if (!country) return DEFAULT_CURRENCY;
  const code = country.trim().toUpperCase();
  if (code.length !== 2) return DEFAULT_CURRENCY;
  if (EUR_COUNTRIES.has(code)) return 'eur';
  if (CAD_COUNTRIES.has(code)) return 'cad';
  return 'usd';
}

/** Reads the visitor's country from the proxy headers Vercel sets. */
export function countryFromHeaders(headers: {
  get: (name: string) => string | null;
}): string | null {
  return headers.get('x-vercel-ip-country');
}

export type PlanPrices = {
  /** Pro, billed monthly — charged every month. */
  proMonthly: number;
  /** Pro, billed annually — the amount charged once per year. */
  proAnnualTotal: number;
  /** Pro annual expressed per month, for the "/ month, billed annually" line. */
  proAnnualPerMonth: number;
  /** One-off lifetime purchase. */
  lifetime: number;
};

/**
 * Price points per currency, in minor units.
 *
 * These MUST match the amounts configured in Stripe's `currency_options` for
 * each Price, or the customer is charged something other than what was shown.
 * Change them here and in the Stripe Dashboard together.
 */
export const PRICES: Record<Currency, PlanPrices> = {
  eur: { proMonthly: 999, proAnnualTotal: 9588, proAnnualPerMonth: 799, lifetime: 12900 },
  usd: { proMonthly: 1099, proAnnualTotal: 10788, proAnnualPerMonth: 899, lifetime: 14900 },
  cad: { proMonthly: 1499, proAnnualTotal: 14388, proAnnualPerMonth: 1199, lifetime: 19900 },
};

/**
 * Format a minor-unit amount for display.
 *
 * Trailing ",00" is dropped so a round figure reads as "129 €" rather than
 * "129,00 €" — the way a price is actually written on a page.
 */
export function formatPrice(minorUnits: number, currency: Currency, locale: 'fr' | 'en'): string {
  const isWhole = minorUnits % 100 === 0;
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(minorUnits / 100);
}

/** How much the annual plan saves versus paying monthly, as a whole percent. */
export function annualSavingsPercent(prices: PlanPrices): number {
  const full = prices.proMonthly * 12;
  if (full <= 0) return 0;
  return Math.round(((full - prices.proAnnualTotal) / full) * 100);
}
