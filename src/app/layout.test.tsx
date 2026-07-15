// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import RootLayout from "./layout";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist-sans" }),
  Geist_Mono: () => ({ variable: "geist-mono" }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

vi.mock("@/components/app-navbar", () => ({
  AppNavbar: ({ authenticated }: { authenticated: boolean }) => (
    <div>App navbar {authenticated ? "signed-in" : "signed-out"}</div>
  ),
}));

describe("RootLayout", () => {
  test("wraps route content in the themed document shell with navbar", async () => {
    render(await RootLayout({ children: <p>Route content</p> }));

    expect(screen.getByText("Route content")).toBeInTheDocument();
    expect(screen.getByText("App navbar signed-out")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.className).toContain("geist-sans");
    expect(document.documentElement.className).toContain("geist-mono");
  });
});
