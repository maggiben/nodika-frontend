// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  clearStoredSnapshotJson,
  readProjectLibrary,
  upsertStoredProject,
} from "@/lib/snapshot-storage";
import { TestI18n } from "@/test-utils/test-i18n";
import { AppNavbar } from "./app-navbar";

const refresh = vi.fn();
const push = vi.fn();
const setMode = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
  usePathname: () => "/es",
}));

vi.mock("@mui/material/styles", async () => {
  const actual = await vi.importActual<typeof import("@mui/material/styles")>(
    "@mui/material/styles",
  );

  return {
    ...actual,
    useColorScheme: () => ({
      mode: "light",
      setMode,
    }),
  };
});

afterEach(() => {
  cleanup();
  refresh.mockReset();
  push.mockReset();
  setMode.mockReset();
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

  test("shows a project selector for stored projects", () => {
    upsertStoredProject(
      JSON.stringify({
        meta: { projectId: "proj_a", projectNombre: "Alpha Yard" },
      }),
    );
    upsertStoredProject(
      JSON.stringify({
        meta: { projectId: "proj_b", projectNombre: "Beta Pier" },
      }),
    );

    render(
      <TestI18n>
        <AppNavbar authenticated={false} />
      </TestI18n>,
    );

    const selector = screen.getByLabelText("Proyecto");
    expect(selector).toBeInTheDocument();
    expect(selector).toHaveTextContent("Beta Pier");
    fireEvent.mouseDown(selector);
    expect(
      screen.getByRole("option", { name: "Alpha Yard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Beta Pier" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Alpha Yard" }));
    expect(readProjectLibrary().selectedId).toBe("proj_a");
  });

  test("opens preferences for theme changes and logout", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <AppNavbar authenticated />
      </TestI18n>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir menú de cuenta" }),
    );
    expect(
      screen.getByRole("menuitem", { name: "Subir snapshot" }),
    ).toHaveAttribute("href", "/es/upload");
    fireEvent.click(screen.getByRole("menuitem", { name: "Tema oscuro" }));
    expect(setMode).toHaveBeenCalledWith("dark");

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir menú de cuenta" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Cerrar sesión" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
      });
    });
    expect(refresh).toHaveBeenCalled();
  });

  test("switches language and persists locale preference", () => {
    render(
      <TestI18n>
        <AppNavbar authenticated={false} />
      </TestI18n>,
    );

    fireEvent.mouseDown(screen.getByLabelText("Idioma"));
    fireEvent.click(screen.getByRole("option", { name: "English" }));

    expect(document.cookie).toContain("nordika.locale=en");
    expect(push).toHaveBeenCalledWith("/en");
    expect(refresh).toHaveBeenCalled();
  });
});
