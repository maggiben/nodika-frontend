// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  activateUploadedSnapshot,
  clearStoredSnapshotJson,
  deleteStoredProject,
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

  test("deleteStoredProject removes a project and refreshes", async () => {
    let projects = [
      {
        id: "src_a",
        projectId: "proj_a",
        name: "Alpha",
        filename: "a.json",
        createdAt: "2026-01-02T00:00:00.000Z",
        content: { meta: { projectId: "proj_a", projectNombre: "Alpha" } },
      },
      {
        id: "src_b",
        projectId: "proj_b",
        name: "Beta",
        filename: "b.json",
        createdAt: "2026-01-01T00:00:00.000Z",
        content: { meta: { projectId: "proj_b", projectNombre: "Beta" } },
      },
    ];
    let activeProjectId = "proj_a";

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        if (
          url.includes("/api/snapshots/proj_a") &&
          init?.method === "DELETE"
        ) {
          projects = projects.filter(
            (project) => project.projectId !== "proj_a",
          );
          return new Response(
            JSON.stringify({ projectId: "proj_a", deletedCount: 1 }),
            { status: 200 },
          );
        }
        if (url.includes("/api/snapshots")) {
          return new Response(JSON.stringify(projects), { status: 200 });
        }
        if (url.includes("/api/settings") && init?.method === "PATCH") {
          const body = JSON.parse(String(init.body)) as {
            activeProjectId: string | null;
          };
          activeProjectId = body.activeProjectId ?? "";
          return new Response(
            JSON.stringify({
              email: "a@b.co",
              activeProjectId: body.activeProjectId,
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
        if (url.includes("/api/settings")) {
          return new Response(
            JSON.stringify({
              email: "a@b.co",
              activeProjectId,
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
    expect(readProjectLibrary().selectedId).toBe("proj_a");

    const result = await deleteStoredProject("proj_a");
    expect(result.ok).toBe(true);
    expect(listStoredProjects().map((project) => project.id)).toEqual([
      "proj_b",
    ]);
    expect(readProjectLibrary().selectedId).toBe("proj_b");
    expect(activeProjectId).toBe("proj_b");
  });

  test("deleteStoredProject clears activeProjectId when deleting the last project", async () => {
    let projects = [
      {
        id: "src_a",
        projectId: "proj_a",
        name: "Alpha",
        filename: "a.json",
        createdAt: "2026-01-02T00:00:00.000Z",
        content: { meta: { projectId: "proj_a", projectNombre: "Alpha" } },
      },
    ];
    let activeProjectId: string | null = "proj_a";

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        if (
          url.includes("/api/snapshots/proj_a") &&
          init?.method === "DELETE"
        ) {
          projects = [];
          return new Response(
            JSON.stringify({ projectId: "proj_a", deletedCount: 1 }),
            { status: 200 },
          );
        }
        if (url.includes("/api/snapshots")) {
          return new Response(JSON.stringify(projects), { status: 200 });
        }
        if (url.includes("/api/settings") && init?.method === "PATCH") {
          const body = JSON.parse(String(init.body)) as {
            activeProjectId: string | null;
          };
          activeProjectId = body.activeProjectId;
          return new Response(
            JSON.stringify({
              email: "a@b.co",
              activeProjectId: body.activeProjectId,
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
        if (url.includes("/api/settings")) {
          return new Response(
            JSON.stringify({
              email: "a@b.co",
              activeProjectId,
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
    const result = await deleteStoredProject("proj_a");
    expect(result.ok).toBe(true);
    expect(listStoredProjects()).toEqual([]);
    expect(readProjectLibrary().selectedId).toBeNull();
    expect(activeProjectId).toBeNull();
  });

  test("deleteStoredProject surfaces BFF failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        if (
          String(input).includes("/api/snapshots/") &&
          init?.method === "DELETE"
        ) {
          return new Response(JSON.stringify({ message: "blocked" }), {
            status: 403,
          });
        }
        return new Response(JSON.stringify([]), { status: 200 });
      }),
    );

    await expect(deleteStoredProject("proj_a")).resolves.toEqual({
      ok: false,
      message: "blocked",
    });
  });

  test("after successful delete, progress for that projectId is empty (Core cascade)", async () => {
    let projects = [
      {
        id: "src_a",
        projectId: "proj_a",
        name: "Alpha",
        filename: "a.json",
        createdAt: "2026-01-02T00:00:00.000Z",
        content: { meta: { projectId: "proj_a", projectNombre: "Alpha" } },
      },
    ];
    let progressByProject: Record<
      string,
      {
        projectId: string;
        overallPercent: number | null;
        reports: unknown[];
      }
    > = {
      proj_a: {
        projectId: "proj_a",
        overallPercent: 42,
        reports: [{ messageId: "m1", percent: 42 }],
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/snapshots/proj_a") && init?.method === "DELETE") {
          projects = [];
          // Mirrors Core cascade: messaging progress wiped with the source.
          delete progressByProject.proj_a;
          return new Response(
            JSON.stringify({ projectId: "proj_a", deletedCount: 1 }),
            { status: 200 },
          );
        }
        if (url.includes("/api/snapshots")) {
          return new Response(JSON.stringify(projects), { status: 200 });
        }
        if (url.includes("/api/settings") && init?.method === "PATCH") {
          return new Response(
            JSON.stringify({
              email: "a@b.co",
              activeProjectId: null,
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
        if (url.includes("/api/settings")) {
          return new Response(
            JSON.stringify({
              email: "a@b.co",
              activeProjectId: "proj_a",
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
        if (url.includes("/api/messaging/progress")) {
          const projectId = new URL(url, "http://localhost").searchParams.get(
            "projectId",
          );
          const summary = projectId ? progressByProject[projectId] : undefined;
          return new Response(
            JSON.stringify(
              summary ?? {
                projectId: projectId ?? "",
                overallPercent: null,
                byRole: {
                  jefe_obra: null,
                  operario: null,
                  jornalero: null,
                  otro: null,
                },
                reports: [],
                updatedAt: null,
              },
            ),
            { status: 200 },
          );
        }
        return new Response("{}", { status: 404 });
      }),
    );

    await refreshProjectLibrary();
    const before = await fetch("/api/messaging/progress?projectId=proj_a");
    await expect(before.json()).resolves.toMatchObject({
      overallPercent: 42,
    });

    const result = await deleteStoredProject("proj_a");
    expect(result.ok).toBe(true);

    const after = await fetch("/api/messaging/progress?projectId=proj_a");
    await expect(after.json()).resolves.toMatchObject({
      overallPercent: null,
      reports: [],
    });
  });
});
