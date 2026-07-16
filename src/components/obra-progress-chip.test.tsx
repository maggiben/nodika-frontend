// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  clearStoredSnapshotJson,
  upsertStoredProject,
} from "@/lib/snapshot-storage";
import { TestI18n } from "@/test-utils/test-i18n";
import { ObraProgressChip } from "./obra-progress-chip";

afterEach(() => {
  cleanup();
  clearStoredSnapshotJson();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("ObraProgressChip", () => {
  test("renders nothing when unauthenticated", () => {
    upsertStoredProject(
      JSON.stringify({
        meta: { projectNombre: "North", projectId: "obra-1" },
        tareas_con_objetivo: [],
      }),
    );
    const { container } = render(
      <TestI18n>
        <ObraProgressChip authenticated={false} />
      </TestI18n>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("shows overall percent when progress is available", async () => {
    upsertStoredProject(
      JSON.stringify({
        meta: { projectNombre: "North", projectId: "obra-1" },
        tareas_con_objetivo: [],
      }),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            projectId: "obra-1",
            overallPercent: 64,
            byRole: {
              jefe_obra: 70,
              operario: 50,
              jornalero: null,
              otro: null,
            },
            reports: [],
            updatedAt: "2026-07-15T12:00:00.000Z",
          }),
        ),
      ),
    );

    render(
      <TestI18n>
        <ObraProgressChip authenticated />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Avance 64%/i)).toBeInTheDocument();
    });
  });

  test("hides when progress has no overall percent", async () => {
    upsertStoredProject(
      JSON.stringify({
        meta: { projectNombre: "North", projectId: "obra-1" },
        tareas_con_objetivo: [],
      }),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            projectId: "obra-1",
            overallPercent: null,
            byRole: {
              jefe_obra: null,
              operario: null,
              jornalero: null,
              otro: null,
            },
            reports: [],
            updatedAt: null,
          }),
        ),
      ),
    );

    const { container } = render(
      <TestI18n>
        <ObraProgressChip authenticated />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });
});
