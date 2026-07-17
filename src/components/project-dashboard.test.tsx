// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { clearStoredSnapshotJson } from "@/lib/snapshot-storage";
import { TestI18n } from "@/test-utils/test-i18n";
import { ProjectDashboard } from "./project-dashboard";

function stubSources(content: unknown, projectId = "proj_north") {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/api/snapshots")) {
        return new Response(
          JSON.stringify([
            {
              id: "src_1",
              projectId,
              name:
                typeof content === "object" &&
                content !== null &&
                "meta" in content &&
                typeof (content as { meta?: { projectNombre?: string } }).meta
                  ?.projectNombre === "string"
                  ? (content as { meta: { projectNombre: string } }).meta
                      .projectNombre
                  : projectId,
              filename: "a.json",
              createdAt: "2026-07-15T00:00:00.000Z",
              content,
            },
          ]),
          { status: 200 },
        );
      }
      if (url.includes("/api/settings")) {
        return new Response(
          JSON.stringify({
            email: "a@b.co",
            activeProjectId: projectId,
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
}

afterEach(() => {
  cleanup();
  clearStoredSnapshotJson();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("ProjectDashboard", () => {
  test("redirects to login when unauthenticated", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign, pathname: "/es" });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <ProjectDashboard authenticated={false} />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith("/es/login");
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("shows loading indicator before empty state when Core has no sources", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => fetchPromise),
    );

    render(
      <TestI18n>
        <ProjectDashboard authenticated />
      </TestI18n>,
    );

    expect(screen.getByText("Cargando proyecto…")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Estado del proyecto" }),
    ).not.toBeInTheDocument();

    resolveFetch?.(new Response(JSON.stringify([]), { status: 200 }));

    expect(
      await screen.findByRole("heading", { name: "Estado del proyecto" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Subir snapshot" }),
    ).toHaveAttribute("href", "/es/upload");
    expect(screen.queryByText("Cargando proyecto…")).not.toBeInTheDocument();
  });

  test("redirects to login when Core returns 401", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign, pathname: "/es" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 401 })),
    );

    render(
      <TestI18n>
        <ProjectDashboard authenticated />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith("/es/login");
    });
    expect(
      screen.queryByRole("heading", {
        name: "Inicia sesión para ver el estado del proyecto",
      }),
    ).not.toBeInTheDocument();
  });

  test("shows empty state when no snapshot is stored", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })),
    );

    render(
      <TestI18n>
        <ProjectDashboard authenticated />
      </TestI18n>,
    );

    expect(
      await screen.findByRole("heading", { name: "Estado del proyecto" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Subir snapshot" }),
    ).toHaveAttribute("href", "/es/upload");
  });

  test("renders charts and grid from Core snapshot JSON", async () => {
    stubSources({
      meta: {
        projectNombre: "North Quay",
        projectId: "proj_north",
        ciclo_inicio: "2026-07-01",
        ciclo_fin: "2026-07-21",
      },
      tareas_con_objetivo: [
        {
          id: "t1",
          label: "Steel frame",
          duracion: 10,
          avance_base: 40,
          sector: "Deck",
          ini: "2026-07-01",
          fin: "2026-07-11",
        },
      ],
      tareas_contexto: [
        {
          id: "c1",
          label: "Survey",
          sector: "Deck",
          duracion: 1,
          ini: "2026-06-01",
          fin: "2026-06-02",
        },
      ],
    });

    render(
      <TestI18n>
        <ProjectDashboard authenticated />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "North Quay" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Progreso general")).toBeInTheDocument();
    expect(screen.getByText("Mezcla de duración")).toBeInTheDocument();
    expect(screen.getByText("Steel frame")).toBeInTheDocument();
    expect(screen.getByText("Survey")).toBeInTheDocument();
    expect(screen.getAllByText("40%").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("columnheader", { name: /Tarea/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/search/i).length).toBeGreaterThan(0);
  });

  test("falls back to empty state when Core returns no sources", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })),
    );

    render(
      <TestI18n>
        <ProjectDashboard authenticated />
      </TestI18n>,
    );

    expect(
      await screen.findByRole("heading", { name: "Estado del proyecto" }),
    ).toBeInTheDocument();
  });

  test("shows empty charts and task table for a sparse snapshot", async () => {
    stubSources(
      {
        meta: { projectNombre: "Sparse", projectId: "proj_sparse" },
        tareas_con_objetivo: [],
      },
      "proj_sparse",
    );

    render(
      <TestI18n>
        <ProjectDashboard authenticated />
      </TestI18n>,
    );

    expect(
      await screen.findByRole("heading", { name: "Sparse" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Aún no hay datos de duración."),
    ).toBeInTheDocument();
    expect(screen.getByText("Aún no hay datos de sector.")).toBeInTheDocument();
    expect(
      screen.getByText("No hay tareas con objetivo en este snapshot."),
    ).toBeInTheDocument();
  });
});
