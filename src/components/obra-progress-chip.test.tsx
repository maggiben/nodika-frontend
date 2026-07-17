// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { clearProgressViewMode } from "@/lib/progress-view-mode";
import { clearStoredSnapshotJson } from "@/lib/snapshot-storage";
import { TestI18n } from "@/test-utils/test-i18n";
import { ObraProgressChip } from "./obra-progress-chip";

function stubLibraryAndProgress(progressBody: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/api/snapshots")) {
        return new Response(
          JSON.stringify([
            {
              id: "src_1",
              projectId: "obra-1",
              name: "North",
              filename: "a.json",
              createdAt: "2026-07-15T00:00:00.000Z",
              content: {
                meta: { projectNombre: "North", projectId: "obra-1" },
                tareas_con_objetivo: [
                  { id: "t1", label: "Steel", avance_base: 40, duracion: 5 },
                ],
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
            activeProjectId: "obra-1",
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
      return new Response(JSON.stringify(progressBody), { status: 200 });
    }),
  );
}

afterEach(() => {
  cleanup();
  clearStoredSnapshotJson();
  clearProgressViewMode();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("ObraProgressChip", () => {
  test("renders nothing when unauthenticated", async () => {
    stubLibraryAndProgress({
      projectId: "obra-1",
      overallPercent: 64,
      byRole: {},
      reports: [],
      updatedAt: "2026-07-15T12:00:00.000Z",
    });
    const { container } = render(
      <TestI18n>
        <ObraProgressChip authenticated={false} />
      </TestI18n>,
    );
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  test("shows before/after toggle when progress is available", async () => {
    stubLibraryAndProgress({
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
    });

    render(
      <TestI18n>
        <ObraProgressChip authenticated />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Después 64%/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Antes 40%/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Antes 40%/i));
    expect(screen.getByLabelText(/Antes 40%/i)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("hides when progress has no overall percent", async () => {
    stubLibraryAndProgress({
      projectId: "obra-1",
      overallPercent: null,
      byRole: {},
      reports: [],
      updatedAt: "2026-07-15T12:00:00.000Z",
    });

    const { container } = render(
      <TestI18n>
        <ObraProgressChip authenticated />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });
});
