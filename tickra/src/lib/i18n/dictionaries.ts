import 'server-only';
import type { Locale } from './config';

const dictionaries = {
  en: () => import('./locales/en').then((m) => m.default),
  fr: () => import('./locales/fr').then((m) => m.default),
} as const;

export const getDictionary = async (locale: Locale) => dictionaries[locale]();

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
