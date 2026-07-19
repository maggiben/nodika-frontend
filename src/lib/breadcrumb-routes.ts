import { isLocale, type Locale } from "@/i18n/config";

const PUBLIC_AUTH_SEGMENTS = new Set([
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "verify-email",
]);

export type BreadcrumbItem = {
  labelKey: string;
  href?: string;
};

function pathSegmentsAfterLocale(pathname: string): {
  locale: Locale;
  segments: string[];
} | null {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0];
  if (!first || !isLocale(first)) {
    return null;
  }
  return { locale: first, segments: parts.slice(1) };
}

/**
 * Builds breadcrumb items for a locale-prefixed pathname.
 * Returns null when the trail should be hidden (Home or public auth routes).
 */
export function buildBreadcrumbItems(
  pathname: string,
  locale: Locale = "es",
): BreadcrumbItem[] | null {
  const parsed = pathSegmentsAfterLocale(pathname);
  if (!parsed) {
    return null;
  }

  const activeLocale = parsed.locale || locale;
  const { segments } = parsed;
  const homeHref = `/${activeLocale}`;

  if (segments.length === 0) {
    return null;
  }

  const first = segments[0] ?? "";
  if (PUBLIC_AUTH_SEGMENTS.has(first)) {
    return null;
  }

  const home: BreadcrumbItem = {
    labelKey: "breadcrumb.home",
    href: homeHref,
  };

  if (first === "upload" && segments.length === 1) {
    return [home, { labelKey: "breadcrumb.upload" }];
  }

  if (first === "settings" && segments.length === 1) {
    return [home, { labelKey: "breadcrumb.settings" }];
  }

  if (first === "staff") {
    if (segments.length === 1) {
      return [home, { labelKey: "breadcrumb.staff" }];
    }

    // /staff/[contactId]/org|attendance — skip the contact id crumb
    if (segments.length === 3 && segments[2] === "org") {
      return [
        home,
        { labelKey: "breadcrumb.staff", href: `${homeHref}/staff` },
        { labelKey: "breadcrumb.org" },
      ];
    }
    if (segments.length === 3 && segments[2] === "attendance") {
      return [
        home,
        { labelKey: "breadcrumb.staff", href: `${homeHref}/staff` },
        { labelKey: "breadcrumb.attendance" },
      ];
    }
  }

  return null;
}
