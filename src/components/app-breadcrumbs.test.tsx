// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { TestI18n } from "@/test-utils/test-i18n";
import { AppBreadcrumbs } from "./app-breadcrumbs";

const usePathname = vi.fn(() => "/es/staff");

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

afterEach(() => {
  cleanup();
  usePathname.mockReset();
  usePathname.mockReturnValue("/es/staff");
});

describe("AppBreadcrumbs", () => {
  test("renders ancestor links and current page text on staff", () => {
    usePathname.mockReturnValue("/es/staff");
    render(
      <TestI18n>
        <AppBreadcrumbs />
      </TestI18n>,
    );

    const nav = screen.getByRole("navigation", { name: "Ruta de navegación" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute(
      "href",
      "/es",
    );
    expect(
      screen.queryByRole("link", { name: "Equipo" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Equipo")).toBeInTheDocument();
  });

  test("renders Staff as a link on org chart", () => {
    usePathname.mockReturnValue("/es/staff/abc/org");
    render(
      <TestI18n>
        <AppBreadcrumbs />
      </TestI18n>,
    );

    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute(
      "href",
      "/es",
    );
    expect(screen.getByRole("link", { name: "Equipo" })).toHaveAttribute(
      "href",
      "/es/staff",
    );
    expect(screen.getByText("Organigrama")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Organigrama" }),
    ).not.toBeInTheDocument();
  });

  test("renders nothing on Home", () => {
    usePathname.mockReturnValue("/es");
    const { container } = render(
      <TestI18n>
        <AppBreadcrumbs />
      </TestI18n>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders nothing on auth routes", () => {
    usePathname.mockReturnValue("/es/login");
    const { container } = render(
      <TestI18n>
        <AppBreadcrumbs />
      </TestI18n>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
