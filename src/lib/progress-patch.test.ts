// @vitest-environment jsdom

import { describe, expect, test, vi, afterEach } from "vitest";

import type { ObraProgressSummary } from "@/lib/obra-progress";
import {
  buildProgressPatchJson,
  downloadJsonFile,
  progressPatchFilename,
} from "@/lib/progress-patch";

const baseSnapshot = {
  meta: { projectNombre: "North Quay", projectId: "obra-1" },
  tareas_con_objetivo: [
    { id: "t1", label: "Steel", avance_base: 20, duracion: 5 },
    { id: "t2", label: "Deck", avance_base: 40, duracion: 3 },
  ],
  tareas_contexto: [{ id: "c1", label: "Fence", avance_base: 10, duracion: 1 }],
};

function liveWithReports(
  reports: ObraProgressSummary["reports"],
): ObraProgressSummary {
  return {
    projectId: "obra-1",
    overallPercent: 70,
    byRole: {
      jefe_obra: 70,
      operario: null,
      jornalero: null,
      otro: null,
    },
    reports,
    updatedAt: "2026-07-15T12:00:00.000Z",
  };
}

describe("buildProgressPatchJson", () => {
  test("overlays live percents onto matching tasks", () => {
    const patched = buildProgressPatchJson(
      JSON.stringify(baseSnapshot),
      liveWithReports([
        {
          contactId: "contact-1",
          role: "jefe_obra",
          taskId: "t1",
          percent: 90,
          duration: null,
          avance: null,
          notes: null,
          repliedAt: "2026-07-15T12:00:00.000Z",
          messageId: "m1",
        },
        {
          contactId: "contact-2",
          role: "operario",
          taskId: "c1",
          percent: 55,
          duration: null,
          avance: null,
          notes: null,
          repliedAt: "2026-07-15T12:05:00.000Z",
          messageId: "m2",
        },
      ]),
    );

    expect(patched).not.toBeNull();
    const parsed = JSON.parse(patched!) as typeof baseSnapshot;
    expect(parsed.tareas_con_objetivo[0]?.avance_base).toBe(90);
    expect(parsed.tareas_con_objetivo[1]?.avance_base).toBe(40);
    expect(parsed.tareas_contexto[0]?.avance_base).toBe(55);
  });

  test("first report per taskId wins", () => {
    const patched = buildProgressPatchJson(
      JSON.stringify(baseSnapshot),
      liveWithReports([
        {
          contactId: "a",
          role: "jefe_obra",
          taskId: "t1",
          percent: 80,
          duration: null,
          avance: null,
          notes: null,
          repliedAt: "2026-07-15T12:00:00.000Z",
          messageId: "m1",
        },
        {
          contactId: "b",
          role: "operario",
          taskId: "t1",
          percent: 10,
          duration: null,
          avance: null,
          notes: null,
          repliedAt: "2026-07-15T12:01:00.000Z",
          messageId: "m2",
        },
      ]),
    );

    const parsed = JSON.parse(patched!) as typeof baseSnapshot;
    expect(parsed.tareas_con_objetivo[0]?.avance_base).toBe(80);
  });

  test("returns pretty base snapshot when live progress is missing", () => {
    const patched = buildProgressPatchJson(JSON.stringify(baseSnapshot), null);
    expect(patched).toBe(JSON.stringify(baseSnapshot, null, 2));
  });

  test("returns null for invalid JSON", () => {
    expect(buildProgressPatchJson("{not-json", null)).toBeNull();
  });
});

describe("progressPatchFilename", () => {
  test("slugs the project name", () => {
    expect(progressPatchFilename("North Quay")).toBe(
      "north-quay-progress-patch.json",
    );
  });
});

describe("downloadJsonFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("creates a temporary download anchor", () => {
    const click = vi.fn();
    const revoke = vi.fn();
    const createObjectURL = vi.fn(() => "blob:mock");
    vi.stubGlobal("URL", {
      createObjectURL,
      revokeObjectURL: revoke,
    });

    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      const el = realCreateElement(tagName);
      if (tagName === "a") {
        el.click = click;
      }
      return el;
    });

    downloadJsonFile("patch.json", '{"ok":true}');

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledWith("blob:mock");
  });
});
