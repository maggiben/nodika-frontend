import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { AppNavbar } from "@/components/app-navbar";
import { AppTheme } from "@/components/app-theme";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { DictionaryProvider } from "@/i18n/dictionary-provider";
import { getDictionary } from "@/i18n/get-dictionary";
import { CORE_ACCESS_COOKIE } from "@/lib/core-auth";
import { HtmlLang } from "@/components/html-lang";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) {
    notFound();
  }
  const locale: Locale = localeParam;
  const dictionary = await getDictionary(locale);
  const authenticated = Boolean(
    (await cookies()).get(CORE_ACCESS_COOKIE)?.value,
  );

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <InitColorSchemeScript
        attribute="data-mui-color-scheme"
        defaultMode="system"
      />
      <AppTheme>
        <DictionaryProvider dictionary={dictionary} locale={locale}>
          <HtmlLang locale={locale} />
          <AppNavbar authenticated={authenticated} />
          {children}
        </DictionaryProvider>
      </AppTheme>
    </AppRouterCacheProvider>
  );
}
