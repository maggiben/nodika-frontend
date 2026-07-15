import type { Locale } from "@/i18n/config";
import type en from "@/i18n/dictionaries/en.json";

export type Dictionary = typeof en;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  es: () =>
    import("@/i18n/dictionaries/es.json").then((module) => module.default),
  en: () =>
    import("@/i18n/dictionaries/en.json").then((module) => module.default),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
