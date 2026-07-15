import { describe, expect, test } from "vitest";
import { buildSnapshotDashboard } from "./snapshot-dashboard";

describe("buildSnapshotDashboard", () => {
  test("summarizes project progress and buckets from snapshot JSON", () => {
    const model = buildSnapshotDashboard({
      meta: {
        projectNombre: "Pier",
        projectId: "proj_1",
        ciclo_inicio: "2026-07-01",
        ciclo_fin: "2026-07-21",
      },
      tareas_con_objetivo: [
        {
          id: "t1",
          label: "Framing",
          duracion: 5,
          avance_base: 50,
          sector: "A",
          ini: "2026-07-01",
          fin: "2026-07-06",
        },
        {
          id: "t2",
          label: "Roof",
          duracion: 20,
          avance_base: 100,
          sector: "B",
        },
      ],
      tareas_contexto: [
        { id: "c1", label: "Permit", sector: "A", duracion: 2 },
      ],
    });

    expect(model).toMatchObject({
      projectName: "Pier",
      projectId: "proj_1",
      averageProgress: 75,
      completedCount: 1,
      totalObjectiveTasks: 2,
    });
    expect(
      model?.durationBuckets.find((b) => b.label === "4–7 days")?.count,
    ).toBe(1);
    expect(
      model?.durationBuckets.find((b) => b.label === "15+ days")?.count,
    ).toBe(1);
    expect(model?.sectorCounts[0]).toEqual({ label: "A", count: 2 });
  });

  test("buckets remaining duration ranges and untitled projects", () => {
    const model = buildSnapshotDashboard({
      meta: {},
      tareas_con_objetivo: [
        { id: "a", label: "Short", duracion: 2, avance_base: 10 },
        { id: "b", label: "Medium", duracion: 10, avance_base: 20 },
        { id: "c", label: "Unknown length", duracion: null, avance_base: null },
        {},
      ],
      tareas_contexto: [{ sector: null }],
    });

    expect(model?.projectName).toBe("Untitled project");
    expect(model?.objectiveTasks[3]?.id).toBe("task-4");
    expect(model?.objectiveTasks[3]?.label).toBe("Task 4");
    expect(
      model?.durationBuckets.find((b) => b.label === "1–3 days")?.count,
    ).toBe(1);
    expect(
      model?.durationBuckets.find((b) => b.label === "8–14 days")?.count,
    ).toBe(1);
    expect(
      model?.durationBuckets.find((b) => b.label === "Unknown")?.count,
    ).toBe(2);
    expect(model?.averageProgress).toBe(15);
    expect(model?.sectorCounts.some((s) => s.label === "Unassigned")).toBe(
      true,
    );
  });
});
