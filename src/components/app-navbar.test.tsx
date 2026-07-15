// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { clearStoredSnapshotJson } from "@/lib/snapshot-storage";
import { TestI18n } from "@/test-utils/test-i18n";
import { AppNavbar } from "./app-navbar";

const refresh = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
  usePathname: () => "/es",
}));

afterEach(() => {
  cleanup();
  refresh.mockReset();
  push.mockReset();
  clearStoredSnapshotJson();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("AppNavbar", () => {
  test("shows sign-in and registration links when unauthenticated", () => {
    render(
      <TestI18n>
        <AppNavbar authenticated={false} />
      </TestI18n>,
    );

    expect(
      screen.getByRole("link", { name: "Iniciar sesión" }),
    ).toHaveAttribute("href", "/es/login");
    expect(screen.getByRole("link", { name: "Registrarse" })).toHaveAttribute(
      "href",
      "/es/register",
    );
    expect(
      screen.queryByRole("button", { name: "Abrir menú de cuenta" }),
    ).not.toBeInTheDocument();
  });

  test("shows email initials and a simplified account menu", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <AppNavbar authenticated userEmail="maria@example.com" />
      </TestI18n>,
    );

    expect(screen.getByText("MA")).toBeInTheDocument();
    expect(screen.queryByLabelText("Idioma")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir menú de cuenta" }),
    );
    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems[0]).toHaveTextContent("Subir snapshot");
    expect(menuItems[1]).toHaveTextContent("Configuración");
    expect(menuItems[2]).toHaveTextContent("Cerrar sesión");
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Subir snapshot" }),
    ).toHaveAttribute("href", "/es/upload");
    expect(
      screen.getByRole("menuitem", { name: "Configuración" }),
    ).toHaveAttribute("href", "/es/settings");
    expect(
      screen.queryByRole("menuitem", { name: "Tema oscuro" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: "Cerrar sesión" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
      });
    });
    expect(refresh).toHaveBeenCalled();
  });
});
