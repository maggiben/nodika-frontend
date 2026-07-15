// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import LocaleLayout, { generateStaticParams } from "./layout";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

vi.mock("@mui/material-nextjs/v16-appRouter", () => ({
  AppRouterCacheProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@mui/material/InitColorSchemeScript", () => ({
  default: () => null,
}));

vi.mock("@/components/app-navbar", () => ({
  AppNavbar: ({ authenticated }: { authenticated: boolean }) => (
    <div>App navbar {authenticated ? "signed-in" : "signed-out"}</div>
  ),
}));

vi.mock("@/components/html-lang", () => ({
  HtmlLang: () => null,
}));

describe("LocaleLayout", () => {
  test("generates Spanish and English params", () => {
    expect(generateStaticParams()).toEqual([
      { locale: "es" },
      { locale: "en" },
    ]);
  });

  test("renders themed shell for a valid locale", async () => {
    render(
      await LocaleLayout({
        children: <p>Localized content</p>,
        params: Promise.resolve({ locale: "es" }),
      }),
    );

    expect(screen.getByText("Localized content")).toBeInTheDocument();
    expect(screen.getByText("App navbar signed-out")).toBeInTheDocument();
  });

  test("rejects unsupported locales", async () => {
    await expect(
      LocaleLayout({
        children: <p>bad</p>,
        params: Promise.resolve({ locale: "fr" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
