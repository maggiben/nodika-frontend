import { describe, expect, test } from "vitest";

import { buildBreadcrumbItems } from "./breadcrumb-routes";

describe("buildBreadcrumbItems", () => {
  test("hides trail on Home", () => {
    expect(buildBreadcrumbItems("/es")).toBeNull();
    expect(buildBreadcrumbItems("/en")).toBeNull();
    expect(buildBreadcrumbItems("/es/")).toBeNull();
  });

  test("hides trail on public auth routes", () => {
    expect(buildBreadcrumbItems("/es/login")).toBeNull();
    expect(buildBreadcrumbItems("/en/register")).toBeNull();
    expect(buildBreadcrumbItems("/es/forgot-password")).toBeNull();
    expect(buildBreadcrumbItems("/es/reset-password")).toBeNull();
    expect(buildBreadcrumbItems("/es/verify-email")).toBeNull();
  });

  test("builds trail for top-level app pages", () => {
    expect(buildBreadcrumbItems("/es/upload")).toEqual([
      { labelKey: "breadcrumb.home", href: "/es" },
      { labelKey: "breadcrumb.upload" },
    ]);
    expect(buildBreadcrumbItems("/en/settings")).toEqual([
      { labelKey: "breadcrumb.home", href: "/en" },
      { labelKey: "breadcrumb.settings" },
    ]);
    expect(buildBreadcrumbItems("/es/staff")).toEqual([
      { labelKey: "breadcrumb.home", href: "/es" },
      { labelKey: "breadcrumb.staff" },
    ]);
  });

  test("builds nested org-chart trail without contact id", () => {
    expect(buildBreadcrumbItems("/es/staff/contact-42/org")).toEqual([
      { labelKey: "breadcrumb.home", href: "/es" },
      { labelKey: "breadcrumb.staff", href: "/es/staff" },
      { labelKey: "breadcrumb.org" },
    ]);
  });

  test("builds nested attendance trail without contact id", () => {
    expect(buildBreadcrumbItems("/es/staff/contact-42/attendance")).toEqual([
      { labelKey: "breadcrumb.home", href: "/es" },
      { labelKey: "breadcrumb.staff", href: "/es/staff" },
      { labelKey: "breadcrumb.attendance" },
    ]);
  });

  test("returns null for unknown paths", () => {
    expect(buildBreadcrumbItems("/es/unknown")).toBeNull();
    expect(buildBreadcrumbItems("/es/staff/only-id")).toBeNull();
  });
});
