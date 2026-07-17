// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { TestI18n } from "@/test-utils/test-i18n";
import { clearStoredSnapshotJson } from "@/lib/snapshot-storage";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { SettingsProjectsPanel } from "./settings-projects-panel";

beforeEach(() => {
  clearStoredSnapshotJson();
});

afterEach(() => {
  cleanup();
  clearStoredSnapshotJson();
  vi.unstubAllGlobals();
});

describe("SettingsProjectsPanel", () => {
  test("lists projects and links to upload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);
        if (
          url.includes("/api/snapshots") &&
          !url.includes("/api/snapshots/")
        ) {
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
            { status: 200 },
          );
        }
        if (url.includes("/api/settings")) {
          return new Response(
            JSON.stringify({
              email: "a@b.co",
              activeProjectId: "proj_a",
              emailSchedule: {
                enabled: false,
                frequency: "weekly",
                daysOfWeek: [1],
                dayOfMonth: 1,
                sendTime: "09:00",
                timezone: "UTC",
              },
              nextSendDates: [],
            }),
            { status: 200 },
          );
        }
        return new Response("{}", { status: 404 });
      }),
    );

    render(
      <TestI18n>
        <SettingsProjectsPanel />
      </TestI18n>,
    );

    expect(await screen.findByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("proj_a")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Subir snapshot/i }),
    ).toHaveAttribute("href", "/es/upload");
  });

  test("shows empty state when library has no projects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })),
    );

    render(
      <TestI18n>
        <SettingsProjectsPanel />
      </TestI18n>,
    );

    expect(
      await screen.findByText(/Todavía no hay proyectos/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Subir snapshot/i }),
    ).toBeInTheDocument();
  });

  test("cancels delete without calling the BFF", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/snapshots") && init?.method === "DELETE") {
        return new Response(JSON.stringify({ message: "should not run" }), {
          status: 500,
        });
      }
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
          { status: 200 },
        );
      }
      if (url.includes("/api/settings")) {
        return new Response(
          JSON.stringify({
            email: "a@b.co",
            activeProjectId: "proj_a",
            emailSchedule: {
              enabled: false,
              frequency: "weekly",
              daysOfWeek: [1],
              dayOfMonth: 1,
              sendTime: "09:00",
              timezone: "UTC",
            },
            nextSendDates: [],
          }),
          { status: 200 },
        );
      }
      return new Response("{}", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <SettingsProjectsPanel />
      </TestI18n>,
    );

    expect(await screen.findByText("Alpha")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Eliminar$/i }));
    expect(
      await screen.findByRole("heading", { name: /¿Eliminar proyecto/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: /¿Eliminar proyecto/i }),
      ).toBeNull();
    });
    expect(
      fetchMock.mock.calls.some(
        ([, init]) =>
          typeof init === "object" &&
          init !== null &&
          "method" in init &&
          init.method === "DELETE",
      ),
    ).toBe(false);
  });

  test("shows an error when delete fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/snapshots/") && init?.method === "DELETE") {
          return new Response(JSON.stringify({ message: "nope" }), {
            status: 503,
          });
        }
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
            { status: 200 },
          );
        }
        if (url.includes("/api/settings")) {
          return new Response(
            JSON.stringify({
              email: "a@b.co",
              activeProjectId: "proj_a",
              emailSchedule: {
                enabled: false,
                frequency: "weekly",
                daysOfWeek: [1],
                dayOfMonth: 1,
                sendTime: "09:00",
                timezone: "UTC",
              },
              nextSendDates: [],
            }),
            { status: 200 },
          );
        }
        return new Response("{}", { status: 404 });
      }),
    );

    render(
      <TestI18n>
        <SettingsProjectsPanel />
      </TestI18n>,
    );

    expect(await screen.findByText("Alpha")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Eliminar$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Eliminar proyecto/i }));

    expect(await screen.findByText("nope")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });
});
