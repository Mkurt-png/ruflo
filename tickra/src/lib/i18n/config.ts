export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];
// Tickra is French-first — every editorial room is composed in FR and
// translated to EN. x-default already points at /fr; the runtime
// fallback should match so a visitor with no Accept-Language header
// lands on the primary tongue.
export const defaultLocale: Locale = 'fr';
export const LOCALE_COOKIE = 'tickra-locale';
export const THEME_COOKIE = 'tickra-theme';

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
