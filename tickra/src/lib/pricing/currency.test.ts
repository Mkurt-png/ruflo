import { describe, it, expect } from 'vitest';
import {
  currencyForCountry,
  countryFromHeaders,
  formatPrice,
  annualSavingsPercent,
  isCurrency,
  PRICES,
  CURRENCIES,
  DEFAULT_CURRENCY,
} from './currency';

describe('currencyForCountry', () => {
  it('quotes the EU and EEA in euros', () => {
    for (const c of ['FR', 'DE', 'ES', 'IT', 'BE', 'PL', 'SE', 'NO', 'CH', 'IE']) {
      expect(currencyForCountry(c)).toBe('eur');
    }
  });

  it('quotes Canada in Canadian dollars', () => {
    expect(currencyForCountry('CA')).toBe('cad');
  });

  it('quotes the rest of the world in US dollars', () => {
    for (const c of ['US', 'GB', 'AU', 'JP', 'BR', 'MA', 'IN']) {
      expect(currencyForCountry(c)).toBe('usd');
    }
  });

  it('falls back to the international default when the country is unknown', () => {
    expect(currencyForCountry(null)).toBe(DEFAULT_CURRENCY);
    expect(currencyForCountry(undefined)).toBe(DEFAULT_CURRENCY);
    expect(currencyForCountry('')).toBe(DEFAULT_CURRENCY);
    // Not a 2-letter code — a proxy sending junk takes the same safe default.
    expect(currencyForCountry('FRA')).toBe(DEFAULT_CURRENCY);
    expect(currencyForCountry('X')).toBe(DEFAULT_CURRENCY);
  });

  it('is case and whitespace insensitive', () => {
    expect(currencyForCountry('fr')).toBe('eur');
    expect(currencyForCountry(' ca ')).toBe('cad');
  });
});

describe('countryFromHeaders', () => {
  it('reads the Vercel geo header', () => {
    const headers = { get: (n: string) => (n === 'x-vercel-ip-country' ? 'FR' : null) };
    expect(countryFromHeaders(headers)).toBe('FR');
  });

  it('returns null when the header is absent — local dev', () => {
    expect(countryFromHeaders({ get: () => null })).toBeNull();
  });
});

describe('isCurrency', () => {
  it('accepts only the supported set', () => {
    expect(isCurrency('eur')).toBe(true);
    expect(isCurrency('cad')).toBe(true);
    expect(isCurrency('EUR')).toBe(false);
    expect(isCurrency('gbp')).toBe(false);
    expect(isCurrency(null)).toBe(false);
    expect(isCurrency(999)).toBe(false);
  });
});

describe('formatPrice', () => {
  it('drops the decimals on a round amount', () => {
    expect(formatPrice(12900, 'eur', 'fr')).not.toMatch(/,00/);
    expect(formatPrice(14900, 'usd', 'en')).toBe('$149');
  });

  it('keeps the decimals on a non-round amount', () => {
    expect(formatPrice(999, 'eur', 'fr')).toMatch(/9,99/);
    expect(formatPrice(1099, 'usd', 'en')).toBe('$10.99');
  });

  it('uses the currency the caller asked for, not the locale default', () => {
    // A French-speaking Canadian sees Canadian dollars, in French formatting.
    expect(formatPrice(1499, 'cad', 'fr')).toMatch(/14,99/);
  });
});

describe('PRICES', () => {
  it('covers every supported currency', () => {
    for (const c of CURRENCIES) expect(PRICES[c]).toBeDefined();
  });

  it('makes the annual plan genuinely cheaper than paying monthly', () => {
    for (const c of CURRENCIES) {
      expect(PRICES[c].proAnnualTotal).toBeLessThan(PRICES[c].proMonthly * 12);
    }
  });

  it('keeps the advertised per-month annual figure consistent with the total', () => {
    for (const c of CURRENCIES) {
      expect(PRICES[c].proAnnualPerMonth * 12).toBe(PRICES[c].proAnnualTotal);
    }
  });

  it('prices lifetime above a year of Pro, or it cannibalises the subscription', () => {
    for (const c of CURRENCIES) {
      expect(PRICES[c].lifetime).toBeGreaterThan(PRICES[c].proAnnualTotal);
    }
  });
});

describe('annualSavingsPercent', () => {
  it('reports the real discount', () => {
    // 9.99 x 12 = 119.88 vs 95.88 → 20%.
    expect(annualSavingsPercent(PRICES.eur)).toBe(20);
  });

  it('is 0 rather than NaN when the monthly price is 0', () => {
    expect(
      annualSavingsPercent({ proMonthly: 0, proAnnualTotal: 0, proAnnualPerMonth: 0, lifetime: 0 }),
    ).toBe(0);
  });
});
