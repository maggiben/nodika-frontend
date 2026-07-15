export const locales = ["es", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

export const LOCALE_COOKIE = "nordika.locale";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
