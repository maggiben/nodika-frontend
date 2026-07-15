// @vitest-environment jsdom

import { afterEach, describe, expect, test, vi } from "vitest";
import {
  clearStoredSnapshotJson,
  listStoredProjects,
  readProjectLibrary,
  readSelectedSnapshotJson,
  readStoredSnapshotJson,
  selectStoredProject,
  storeSnapshotJson,
  upsertStoredProject,
} from "./snapshot-storage";

afterEach(() => {
  clearStoredSnapshotJson();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("snapshot-storage", () => {
  test("upserts multiple projects and reads the selected snapshot", () => {
    expect(readSelectedSnapshotJson()).toBeNull();

    upsertStoredProject(
      JSON.stringify({
        meta: { projectId: "proj_a", projectNombre: "Alpha" },
      }),
    );
    upsertStoredProject(
      JSON.stringify({
        meta: { projectId: "proj_b", projectNombre: "Beta" },
      }),
    );

    expect(listStoredProjects().map((project) => project.name)).toEqual([
      "Beta",
      "Alpha",
    ]);
    expect(readProjectLibrary().selectedId).toBe("proj_b");
    expect(readSelectedSnapshotJson()).toContain("Beta");

    selectStoredProject("proj_a");
    expect(readSelectedSnapshotJson()).toContain("Alpha");
  });

  test("migrates a legacy single snapshot into the library", () => {
    window.localStorage.setItem(
      "nodika.lastSnapshotJson",
      JSON.stringify({
        meta: { projectId: "legacy_1", projectNombre: "Legacy" },
      }),
    );

    expect(readSelectedSnapshotJson()).toContain("Legacy");
    expect(listStoredProjects()).toHaveLength(1);
    expect(window.localStorage.getItem("nodika.lastSnapshotJson")).toBeNull();
    expect(window.localStorage.getItem("nodika.projectLibrary.v1")).not.toBeNull();
  });

  test("migrates previous-brand library keys into the new store", () => {
    window.localStorage.setItem(
      "nordika.projectLibrary.v1",
      JSON.stringify({
        projects: [
          {
            id: "old_1",
            name: "Old brand",
            json: '{"meta":{"projectNombre":"Old brand"}}',
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        selectedId: "old_1",
      }),
    );

    expect(readSelectedSnapshotJson()).toContain("Old brand");
    expect(window.localStorage.getItem("nordika.projectLibrary.v1")).toBeNull();
    expect(window.localStorage.getItem("nodika.projectLibrary.v1")).not.toBeNull();
  });

  test("keeps deprecated helpers working", () => {
    storeSnapshotJson('{"meta":{"projectNombre":"Compat"}}');
    expect(readStoredSnapshotJson()).toContain("Compat");
  });

  test("ignores localStorage failures", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readStoredSnapshotJson()).toBeNull();

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => storeSnapshotJson("{}")).not.toThrow();

    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => clearStoredSnapshotJson()).not.toThrow();
  });
});
