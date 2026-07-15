import { describe, expect, test } from "vitest";
import {
  NODIKA_SNAPSHOT_SCHEMA_VERSION,
  validateNodikaSnapshot,
} from "./nodika-snapshot";

function createSnapshot() {
  return {
    schema_version: NODIKA_SNAPSHOT_SCHEMA_VERSION,
    meta: {
      projectId: "proj_1",
      projectNombre: "Obra",
      ciclo_inicio: "2026-07-01",
      ciclo_fin: "2026-07-21",
      gestionSnapshotId: "snapshot_3",
      exportado_en: "2026-07-15T00:50:36.611Z",
    },
    tareas_con_objetivo: [
      {
        id: "task_1",
        label: "Estructura",
        rubroKey: null,
        ini: "2026-06-01",
        fin: "2026-07-01",
        duracion: 30,
        avance_base: 0,
        pct_objetivo: null,
        sector: null,
        agente: null,
      },
    ],
  };
}

describe("validateNodikaSnapshot", () => {
  test("accepts a valid snapshot", () => {
    expect(validateNodikaSnapshot(createSnapshot()).success).toBe(true);
  });

  test("rejects misspelled fields", () => {
    const snapshot = createSnapshot();
    const task = snapshot.tareas_con_objetivo[0] as unknown as Record<
      string,
      unknown
    >;
    delete task.duracion;
    task.duracionn = 30;

    const result = validateNodikaSnapshot(snapshot);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "tareas_con_objetivo[0].duracion" }),
          expect.objectContaining({ path: "tareas_con_objetivo[0].duracionn" }),
        ]),
      );
    }
  });

  test("rejects invalid task date ranges", () => {
    const snapshot = createSnapshot();
    snapshot.tareas_con_objetivo[0].ini = "2026-07-02";

    const result = validateNodikaSnapshot(snapshot);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: "tareas_con_objetivo[0].fin" }),
      );
    }
  });

  test("rejects duplicate task IDs and invalid percentages", () => {
    const snapshot = createSnapshot();
    snapshot.tareas_con_objetivo.push({
      ...snapshot.tareas_con_objetivo[0],
      avance_base: 101,
    });

    const result = validateNodikaSnapshot(snapshot);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "tareas_con_objetivo[1].id" }),
          expect.objectContaining({
            path: "tareas_con_objetivo[1].avance_base",
          }),
        ]),
      );
    }
  });
});
