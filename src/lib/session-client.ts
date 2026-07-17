import { defaultLocale, isLocale, locales, type Locale } from "@/i18n/config";

const PUBLIC_AUTH_SEGMENTS = new Set([
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "verify-email",
]);

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

export function localeFromPathname(pathname: string): Locale {
  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return defaultLocale;
}

export function isHomePath(pathname: string, locale: string = localeFromPathname(pathname)): boolean {
  return pathname === `/${locale}` || pathname === `/${locale}/`;
}

export function loginPathForLocale(locale: Locale | string): string {
  const resolved = isLocale(locale) ? locale : defaultLocale;
  return `/${resolved}/login`;
}

/**
 * If `response` is a BFF 401 and the user is not already on a public auth page,
 * hard-navigate to the localized login page. Returns true when a redirect was started.
 */
export function redirectToLoginIfUnauthorized(response: Response): boolean {
  if (response.status !== 401) {
    return false;
  }
  if (typeof window === "undefined") {
    return false;
  }
  const { pathname } = window.location;
  if (isPublicAuthPath(pathname)) {
    return false;
  }
  const locale = localeFromPathname(pathname);
  window.location.assign(loginPathForLocale(locale));
  return true;
}

/** Same-origin fetch that redirects to login when the BFF returns 401. */
export async function fetchAuthed(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  redirectToLoginIfUnauthorized(response);
  return response;
}
