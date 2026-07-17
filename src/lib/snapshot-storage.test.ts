// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  activateUploadedSnapshot,
  clearStoredSnapshotJson,
  listStoredProjects,
  readProjectLibrary,
  readSelectedSnapshotJson,
  refreshProjectLibrary,
  selectStoredProject,
} from "./snapshot-storage";

function snapshot(projectId: string, name: string) {
  return JSON.stringify({
    meta: { projectId, projectNombre: name },
  });
}

beforeEach(() => {
  clearStoredSnapshotJson();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

afterEach(() => {
  clearStoredSnapshotJson();
  vi.unstubAllGlobals();
});

describe("snapshot-storage", () => {
  test("loads projects from Core BFF and honors activeProjectId", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);
        if (url.includes("/api/snapshots")) {
          return new Response(
            JSON.stringify([
              {
                id: "src_a",
                projectId: "proj_a",
                name: "Alpha",
                filename: "a.json",
                createdAt: "2026-01-02T00:00:00.000Z",
                content: {
                  meta: { projectId: "proj_a", projectNombre: "Alpha" },
                },
              },
              {
                id: "src_b",
                projectId: "proj_b",
                name: "Beta",
                filename: "b.json",
                createdAt: "2026-01-01T00:00:00.000Z",
                content: {
                  meta: { projectId: "proj_b", projectNombre: "Beta" },
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
              activeProjectId: "proj_b",
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
        return new Response("{}", { status: 404 });
      }),
    );

    await refreshProjectLibrary();

    expect(listStoredProjects().map((project) => project.name)).toEqual([
      "Alpha",
      "Beta",
    ]);
    expect(readProjectLibrary().selectedId).toBe("proj_b");
    expect(readSelectedSnapshotJson()).toContain("Beta");

    selectStoredProject("proj_a");
    expect(readSelectedSnapshotJson()).toContain("Alpha");
  });

  test("activateUploadedSnapshot selects project and refreshes from Core", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);
        if (url.includes("/api/snapshots")) {
          return new Response(
            JSON.stringify([
              {
                id: "src_new",
                projectId: "proj_new",
                name: "Nuevo",
                filename: "n.json",
                createdAt: "2026-03-01T00:00:00.000Z",
                content: {
                  meta: { projectId: "proj_new", projectNombre: "Nuevo" },
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
              activeProjectId: "proj_new",
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
        return new Response("{}", { status: 404 });
      }),
    );

    const stored = await activateUploadedSnapshot(
      snapshot("proj_new", "Nuevo"),
    );
    expect(stored?.id).toBe("proj_new");
    expect(readSelectedSnapshotJson()).toContain("Nuevo");
  });

  test("clears legacy localStorage keys on refresh", async () => {
    window.localStorage.setItem("nodika.projectLibrary.v1", '{"projects":[]}');
    window.localStorage.setItem("nodika.lastSnapshotJson", "{}");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })),
    );

    await refreshProjectLibrary();

    expect(window.localStorage.getItem("nodika.projectLibrary.v1")).toBeNull();
    expect(window.localStorage.getItem("nodika.lastSnapshotJson")).toBeNull();
  });

  test("clearStoredSnapshotJson empties memory", () => {
    expect(() => clearStoredSnapshotJson()).not.toThrow();
    expect(listStoredProjects()).toEqual([]);
    expect(readSelectedSnapshotJson()).toBeNull();
  });
});
