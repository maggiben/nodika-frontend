// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import RootLayout from "./layout";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist-sans" }),
  Geist_Mono: () => ({ variable: "geist-mono" }),
}));

describe("RootLayout", () => {
  test("wraps route content in the document shell", () => {
    render(
      RootLayout({
        children: <p>Route content</p>,
      }),
    );

    expect(screen.getByText("Route content")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("es");
    expect(document.documentElement.className).toContain("geist-sans");
    expect(document.documentElement.className).toContain("geist-mono");
  });
});
