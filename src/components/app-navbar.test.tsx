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
let pathname = "/es";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
  usePathname: () => pathname,
}));

function stubProjectsLibrary() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/api/snapshots")) {
        return new Response(
          JSON.stringify([
            {
              id: "src_a",
              projectId: "proj_a",
              name: "Alpha",
              filename: "a.json",
              createdAt: "2026-01-01T00:00:00.000Z",
              content: {
                meta: { projectId: "proj_a", projectNombre: "Alpha" },
              },
            },
          ]),
        );
      }
      if (url.includes("/api/settings")) {
        return new Response(
          JSON.stringify({ activeProjectId: "proj_a", email: "maria@example.com" }),
        );
      }
      return new Response("{}", { status: 404 });
    }),
  );
}

afterEach(() => {
  cleanup();
  refresh.mockReset();
  push.mockReset();
  pathname = "/es";
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
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response("{}")),
    );
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
    expect(
      screen.getByRole("menuitem", { name: "Subir snapshot" }),
    ).toHaveAttribute("href", "/es/upload");
    expect(
      screen.getByRole("menuitem", { name: "Bajar patch" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Configuración" }),
    ).toHaveAttribute("href", "/es/settings");
    expect(screen.getByRole("menuitem", { name: "Equipo" })).toHaveAttribute(
      "href",
      "/es/staff",
    );
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Tema oscuro" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: "Cerrar sesión" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
      });
    });
    expect(push).toHaveBeenCalledWith("/es/login");
    expect(refresh).toHaveBeenCalled();
  });

  test("shows project selector on home when projects exist", async () => {
    pathname = "/es";
    stubProjectsLibrary();

    render(
      <TestI18n>
        <AppNavbar authenticated userEmail="maria@example.com" />
      </TestI18n>,
    );

    expect(await screen.findByLabelText("Proyecto")).toBeInTheDocument();
  });

  test("hides project selector off home", async () => {
    pathname = "/es/settings";
    stubProjectsLibrary();

    render(
      <TestI18n>
        <AppNavbar authenticated userEmail="maria@example.com" />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(screen.getByText("MA")).toBeInTheDocument();
    });
    expect(screen.queryByLabelText("Proyecto")).not.toBeInTheDocument();
  });

  test("download patch no-ops without a selected snapshot", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({}))),
    );

    render(
      <TestI18n>
        <AppNavbar authenticated userEmail="maria@example.com" />
      </TestI18n>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir menú de cuenta" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Bajar patch" }));

    expect(push).not.toHaveBeenCalled();
  });
});
