// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { AppTheme } from "./app-theme";
import { ProjectDashboard } from "./project-dashboard";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("ProjectDashboard", () => {
  test("shows empty state when no snapshot is stored", async () => {
    render(
      <AppTheme>
        <ProjectDashboard />
      </AppTheme>,
    );

    expect(
      await screen.findByRole("heading", { name: "Project status" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Upload snapshot" }),
    ).toHaveAttribute("href", "/upload");
  });

  test("renders charts and grid from stored snapshot JSON", async () => {
    window.localStorage.setItem(
      "nordika.lastSnapshotJson",
      JSON.stringify({
        meta: {
          projectNombre: "North Quay",
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
      }),
    );

    render(
      <AppTheme>
        <ProjectDashboard />
      </AppTheme>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "North Quay" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Overall progress")).toBeInTheDocument();
    expect(screen.getByText("Duration mix")).toBeInTheDocument();
    expect(screen.getByText("Steel frame")).toBeInTheDocument();
    expect(screen.getByText("Survey")).toBeInTheDocument();
    expect(screen.getAllByText("40%").length).toBeGreaterThan(0);
  });

  test("shows empty charts and task table for a sparse snapshot", async () => {
    window.localStorage.setItem(
      "nordika.lastSnapshotJson",
      JSON.stringify({
        meta: { projectNombre: "Sparse" },
        tareas_con_objetivo: [],
      }),
    );

    render(
      <AppTheme>
        <ProjectDashboard />
      </AppTheme>,
    );

    expect(
      await screen.findByRole("heading", { name: "Sparse" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No duration data yet.")).toBeInTheDocument();
    expect(screen.getByText("No sector data yet.")).toBeInTheDocument();
    expect(
      screen.getByText("No objective tasks in this snapshot."),
    ).toBeInTheDocument();
  });
});
