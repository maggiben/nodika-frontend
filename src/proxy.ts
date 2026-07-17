import { NextRequest, NextResponse } from "next/server";

import { defaultLocale, isLocale, LOCALE_COOKIE, locales } from "@/i18n/config";
import { CORE_ACCESS_COOKIE } from "@/lib/core-auth";

const PUBLIC_AUTH_SEGMENTS = new Set([
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "verify-email",
]);

function preferredLocale(request: NextRequest) {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale;
  }
  return defaultLocale;
}

export function isPublicAuthPath(pathname: string): boolean {
  for (const locale of locales) {
    const prefix = `/${locale}`;
    if (pathname === prefix || pathname === `${prefix}/`) {
      return false;
    }
    if (!pathname.startsWith(`${prefix}/`)) {
      continue;
    }
    const firstSegment = pathname.slice(prefix.length + 1).split("/")[0] ?? "";
    return PUBLIC_AUTH_SEGMENTS.has(firstSegment);
  }
  return false;
}

function localeFromPathname(pathname: string): string | null {
  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (pathnameHasLocale) {
    const locale = localeFromPathname(pathname) ?? preferredLocale(request);
    const hasAccess = Boolean(
      request.cookies.get(CORE_ACCESS_COOKIE)?.value,
    );

    if (!hasAccess && !isPublicAuthPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  const locale = preferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
