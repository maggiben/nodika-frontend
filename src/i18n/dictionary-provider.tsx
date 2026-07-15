"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatMessage, getMessage, type MessageValues } from "@/i18n/message";

type DictionaryContextValue = {
  locale: Locale;
  dictionary: Dictionary;
  t: (path: string, values?: MessageValues) => string;
};

const DictionaryContext = createContext<DictionaryContextValue | null>(null);

export function DictionaryProvider({
  locale,
  dictionary,
  children,
}: Readonly<{
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}>) {
  const value: DictionaryContextValue = {
    locale,
    dictionary,
    t: (path, values) => formatMessage(getMessage(dictionary, path), values),
  };

  return (
    <DictionaryContext.Provider value={value}>
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary() {
  const context = useContext(DictionaryContext);
  if (!context) {
    throw new Error("useDictionary must be used within DictionaryProvider");
  }
  return context;
}
