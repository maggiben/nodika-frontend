"use client";

import type { ReactNode } from "react";

import { AppTheme } from "@/components/app-theme";
import type { Locale } from "@/i18n/config";
import { DictionaryProvider } from "@/i18n/dictionary-provider";
import type { Dictionary } from "@/i18n/get-dictionary";
import en from "@/i18n/dictionaries/en.json";
import es from "@/i18n/dictionaries/es.json";

const dictionaries: Record<Locale, Dictionary> = { en, es };

export function TestI18n({
  children,
  locale = "es",
}: Readonly<{
  children: ReactNode;
  locale?: Locale;
}>) {
  return (
    <AppTheme>
      <DictionaryProvider dictionary={dictionaries[locale]} locale={locale}>
        {children}
      </DictionaryProvider>
    </AppTheme>
  );
}
