// @vitest-environment jsdom

import { describe, expect, test } from "vitest";
import {
  hasUsableOverallProgress,
  parseObraProgressSummary,
  roleBreakdownItems,
} from "@/lib/obra-progress";
import { buildSnapshotDashboard } from "@/lib/snapshot-dashboard";
import { mergeDashboardWithLiveProgress } from "@/lib/merge-dashboard-live-progress";

const roleLabels = {
  jefe_obra: "Site lead",
  operario: "Operator",
  jornalero: "Day laborer",
  otro: "Other",
} as const;

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
    expect(roleBreakdownItems(parsed, roleLabels)).toEqual([
      { label: "Site lead", percent: 60 },
      { label: "Operator", percent: 50 },
    ]);
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
    const merged = mergeDashboardWithLiveProgress(snapshot!, null, roleLabels);
    expect(merged.usingLiveOverall).toBe(false);
    expect(merged.averageProgress).toBe(30);
    expect(merged.objectiveTasks[0]?.avance).toBe(20);
    expect(merged.roleBreakdown).toEqual([]);
  });

  test("overlays task percents and live overall", () => {
    expect(snapshot).not.toBeNull();
    const merged = mergeDashboardWithLiveProgress(
      snapshot!,
      {
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
      },
      roleLabels,
    );

    expect(merged.usingLiveOverall).toBe(true);
    expect(merged.averageProgress).toBe(77);
    expect(merged.objectiveTasks[0]?.avance).toBe(90);
    expect(merged.objectiveTasks[1]?.avance).toBe(40);
    expect(merged.roleBreakdown).toEqual([
      { label: "Site lead", percent: 80 },
      { label: "Operator", percent: 70 },
    ]);
  });
});
