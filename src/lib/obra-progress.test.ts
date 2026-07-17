// @vitest-environment jsdom

import { describe, expect, test } from "vitest";
import {
  hasUsableOverallProgress,
  parseObraProgressSummary,
} from "@/lib/obra-progress";
import { buildSnapshotDashboard } from "@/lib/snapshot-dashboard";
import { mergeDashboardWithLiveProgress } from "@/lib/merge-dashboard-live-progress";

describe("obra-progress", () => {
  test("parses a Core progress payload", () => {
    const parsed = parseObraProgressSummary({
      projectId: "obra-1",
      overallPercent: 55,
      byRole: { jefe_obra: 60, operario: 50, jornalero: null, otro: null },
      reports: [
        {
          contactId: "c1",
          role: "jefe_obra",
          taskId: "t1",
          percent: 55,
          duration: null,
          avance: "estructura",
          notes: null,
          repliedAt: "2026-07-15T12:00:00.000Z",
          messageId: "m1",
        },
      ],
      updatedAt: "2026-07-15T12:00:00.000Z",
    });

    expect(parsed?.overallPercent).toBe(55);
    expect(parsed?.reports).toHaveLength(1);
    expect(hasUsableOverallProgress(parsed)).toBe(true);
  });

  test("rejects incomplete payloads", () => {
    expect(parseObraProgressSummary({ overallPercent: 10 })).toBeNull();
    expect(hasUsableOverallProgress(null)).toBe(false);
  });
});

describe("mergeDashboardWithLiveProgress", () => {
  const snapshot = buildSnapshotDashboard({
    meta: {
      projectNombre: "North Quay",
      projectId: "obra-1",
    },
    tareas_con_objetivo: [
      { id: "t1", label: "Steel", avance_base: 20, duracion: 5 },
      { id: "t2", label: "Deck", avance_base: 40, duracion: 3 },
    ],
    tareas_contexto: [],
  });

  test("falls back to snapshot when live progress is missing", () => {
    expect(snapshot).not.toBeNull();
    const merged = mergeDashboardWithLiveProgress(snapshot!, null);
    expect(merged.usingLiveOverall).toBe(false);
    expect(merged.averageProgress).toBe(30);
    expect(merged.objectiveTasks[0]?.avance).toBe(20);
  });

  test("ignores catalog-only live overall when no taskIds match the grid", () => {
    expect(snapshot).not.toBeNull();
    const merged = mergeDashboardWithLiveProgress(snapshot!, {
      projectId: "obra-1",
      overallPercent: 100,
      byRole: {
        jefe_obra: 100,
        operario: null,
        jornalero: null,
        otro: null,
      },
      reports: [
        {
          contactId: "c1",
          role: "jefe_obra",
          taskId: null,
          percent: 100,
          duration: null,
          avance: null,
          notes: null,
          repliedAt: "2026-07-15T12:00:00.000Z",
          messageId: "m-catalog",
        },
      ],
      updatedAt: "2026-07-15T12:00:00.000Z",
    });
    expect(merged.usingLiveOverall).toBe(false);
    expect(merged.averageProgress).toBe(30);
    expect(merged.objectiveTasks[0]?.avance).toBe(20);
    expect(merged.objectiveTasks[1]?.avance).toBe(40);
  });

  test("overall matches overlaid task average, not live.overallPercent", () => {
    expect(snapshot).not.toBeNull();
    const merged = mergeDashboardWithLiveProgress(snapshot!, {
      projectId: "obra-1",
      overallPercent: 100,
      byRole: {
        jefe_obra: 100,
        operario: null,
        jornalero: null,
        otro: null,
      },
      reports: [
        {
          contactId: "c1",
          role: "jefe_obra",
          taskId: null,
          percent: 100,
          duration: null,
          avance: null,
          notes: null,
          repliedAt: "2026-07-15T12:00:00.000Z",
          messageId: "m-catalog",
        },
        {
          contactId: "c1",
          role: "jefe_obra",
          taskId: "t1",
          percent: 0,
          duration: null,
          avance: null,
          notes: null,
          repliedAt: "2026-07-15T12:01:00.000Z",
          messageId: "m-task",
        },
      ],
      updatedAt: "2026-07-15T12:01:00.000Z",
    });
    expect(merged.usingLiveOverall).toBe(true);
    expect(merged.objectiveTasks[0]?.avance).toBe(0);
    expect(merged.objectiveTasks[1]?.avance).toBe(40);
    expect(merged.averageProgress).toBe(20);
  });

  test("overlays task percents and live overall", () => {
    expect(snapshot).not.toBeNull();
    const merged = mergeDashboardWithLiveProgress(snapshot!, {
      projectId: "obra-1",
      overallPercent: 77,
      byRole: {
        jefe_obra: 80,
        operario: 70,
        jornalero: null,
        otro: null,
      },
      reports: [
        {
          contactId: "c1",
          role: "jefe_obra",
          taskId: "t1",
          percent: 90,
          duration: null,
          avance: null,
          notes: null,
          repliedAt: "2026-07-15T12:00:00.000Z",
          messageId: "m1",
        },
      ],
      updatedAt: "2026-07-15T12:00:00.000Z",
    });

    expect(merged.usingLiveOverall).toBe(true);
    expect(merged.averageProgress).toBe(65);
    expect(merged.objectiveTasks[0]?.avance).toBe(90);
    expect(merged.objectiveTasks[1]?.avance).toBe(40);
  });
});
