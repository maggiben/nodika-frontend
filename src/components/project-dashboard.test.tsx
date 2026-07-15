// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import {
  clearStoredSnapshotJson,
  upsertStoredProject,
} from "@/lib/snapshot-storage";
import { TestI18n } from "@/test-utils/test-i18n";
import { ProjectDashboard } from "./project-dashboard";

afterEach(() => {
  cleanup();
  clearStoredSnapshotJson();
  window.localStorage.clear();
});

describe("ProjectDashboard", () => {
  test("shows empty state when no snapshot is stored", async () => {
    render(
      <TestI18n>
        <ProjectDashboard />
      </TestI18n>,
    );

    expect(
      await screen.findByRole("heading", { name: "Estado del proyecto" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Subir snapshot" }),
    ).toHaveAttribute("href", "/es/upload");
  });

  test("renders charts and grid from stored snapshot JSON", async () => {
    upsertStoredProject(
      JSON.stringify({
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
      }),
    );

    render(
      <TestI18n>
        <ProjectDashboard />
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

  test("falls back to empty state when stored JSON is invalid", async () => {
    window.localStorage.setItem(
      "nordika.projectLibrary.v1",
      JSON.stringify({
        selectedId: "bad",
        projects: [
          {
            id: "bad",
            name: "Broken",
            json: "{not-json",
            updatedAt: "2026-07-15T00:00:00.000Z",
          },
        ],
      }),
    );

    render(
      <TestI18n>
        <ProjectDashboard />
      </TestI18n>,
    );

    expect(
      await screen.findByRole("heading", { name: "Estado del proyecto" }),
    ).toBeInTheDocument();
  });

  test("shows empty charts and task table for a sparse snapshot", async () => {
    upsertStoredProject(
      JSON.stringify({
        meta: { projectNombre: "Sparse", projectId: "proj_sparse" },
        tareas_con_objetivo: [],
      }),
    );

    render(
      <TestI18n>
        <ProjectDashboard />
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
