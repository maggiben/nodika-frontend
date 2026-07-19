// @vitest-environment jsdom

import { afterEach, describe, expect, test, vi } from "vitest";

import {
  applyCatalogMessagePreset,
  buildAttendanceDraft,
  buildAttendanceTitle,
  buildPerformanceDraft,
  buildWorkProgressDraft,
  buildWorkProgressTitle,
} from "./staff-org-chart-draft";
import {
  clearOrgCharts,
  countOrgReports,
  createReportId,
  emptyOrgChart,
  getOrgChartsSnapshot,
  hydrateOrgChartsFromRoster,
  readOrgChart,
  removeOrgChart,
  reportRoleLabel,
  saveOrgChartToCore,
  subscribeToOrgCharts,
  upsertOrgChart,
} from "./staff-org-chart";

afterEach(() => {
  clearOrgCharts();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("staff-org-chart", () => {
  test("upserts reports and counts them", () => {
    expect(countOrgReports("lead_1")).toBe(0);

    upsertOrgChart({
      contactId: "lead_1",
      contactLabel: "Juan",
      reports: [
        { id: "r1", name: "Ana", role: "operario" },
        { id: "r2", name: "Luis", role: "jornalero" },
      ],
      projectIds: ["proj_a"],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(countOrgReports("lead_1")).toBe(2);
    expect(readOrgChart("lead_1")?.reports.map((r) => r.name)).toEqual([
      "Ana",
      "Luis",
    ]);
    expect(readOrgChart("lead_1")?.projectIds).toEqual(["proj_a"]);
    expect(
      JSON.parse(getOrgChartsSnapshot()).charts.lead_1.reports,
    ).toHaveLength(2);
  });

  test("removes a chart for a contact from memory", () => {
    upsertOrgChart({
      ...emptyOrgChart("lead_2", "Lead"),
      reports: [{ id: "r1", name: "Pablo", role: "operario" }],
    });
    expect(countOrgReports("lead_2")).toBe(1);
    removeOrgChart("lead_2");
    expect(countOrgReports("lead_2")).toBe(0);
    expect(readOrgChart("lead_2")).toBeNull();
    removeOrgChart("missing");
  });

  test("keeps otro role label and drops invalid reports", () => {
    upsertOrgChart({
      contactId: "lead_3",
      reports: [
        { id: "r1", name: "Sam", role: "otro", roleOther: "Ayudante" },
        {
          id: "",
          name: "Bad",
          role: "operario",
        },
      ],
      projectIds: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const chart = readOrgChart("lead_3");
    expect(chart?.reports).toHaveLength(1);
    expect(
      reportRoleLabel(chart!.reports[0]!, {
        operario: "Operator",
        jornalero: "Day laborer",
        otro: "Other",
      }),
    ).toBe("Ayudante");
  });

  test("clears legacy localStorage key on hydrate", () => {
    window.localStorage.setItem("nodika.staffOrgCharts.v1", "{not-json");
    hydrateOrgChartsFromRoster([
      {
        _id: "lead_x",
        label: "Lead",
        orgReports: [{ id: "r1", name: "Ana", role: "operario" }],
        projectIds: ["obra-1"],
      },
    ]);
    expect(window.localStorage.getItem("nodika.staffOrgCharts.v1")).toBeNull();
    expect(countOrgReports("lead_x")).toBe(1);
    expect(readOrgChart("lead_x")?.projectIds).toEqual(["obra-1"]);
  });

  test("notifies subscribers on upsert", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToOrgCharts(listener);
    upsertOrgChart({
      ...emptyOrgChart("lead_4"),
      reports: [{ id: "r1", name: "A", role: "operario" }],
    });
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  test("createReportId returns a non-empty string", () => {
    expect(createReportId().length).toBeGreaterThan(4);
  });

  test("saveOrgChartToCore PATCHes orgReports and projectIds", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        orgReports: [{ id: "r1", name: "Ana", role: "operario" }],
        projectIds: ["proj_a", "proj_b"],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await saveOrgChartToCore({
      contactId: "lead_save",
      reports: [{ id: "r1", name: "Ana", role: "operario" }],
      projectIds: ["proj_a", "proj_b"],
      contactLabel: "Lead",
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/messaging/contacts/lead_save",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          orgReports: [{ id: "r1", name: "Ana", role: "operario" }],
          projectIds: ["proj_a", "proj_b"],
        }),
      }),
    );
    expect(readOrgChart("lead_save")?.projectIds).toEqual(["proj_a", "proj_b"]);
  });

  test("saveOrgChartToCore returns errors from the BFF", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ message: "Core down" }),
      }),
    );
    const result = await saveOrgChartToCore({
      contactId: "lead_err",
      reports: [],
      projectIds: [],
    });
    expect(result).toEqual({
      ok: false,
      message: "Core down",
      status: 503,
    });
  });

  test("saveOrgChartToCore handles empty id, network errors, and bare failures", async () => {
    expect(
      await saveOrgChartToCore({
        contactId: "   ",
        reports: [],
        projectIds: [],
      }),
    ).toEqual({ ok: false, message: "Contact id is required." });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      }),
    );
    expect(
      await saveOrgChartToCore({
        contactId: "lead_bare",
        reports: [],
        projectIds: [],
      }),
    ).toEqual({
      ok: false,
      message: "Save failed (500).",
      status: 500,
    });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(
      await saveOrgChartToCore({
        contactId: "lead_net",
        reports: [],
        projectIds: ["proj_a"],
        contactLabel: "Lead",
      }),
    ).toEqual({
      ok: false,
      message: "Could not reach the messaging service.",
    });
  });

  test("saveOrgChartToCore falls back when response omits orgReports fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ _id: "lead_fb" }),
      }),
    );
    const result = await saveOrgChartToCore({
      contactId: "lead_fb",
      reports: [{ id: "r1", name: "Ana", role: "operario" }],
      projectIds: ["obra-1"],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.chart.reports[0]?.name).toBe("Ana");
      expect(result.chart.projectIds).toEqual(["obra-1"]);
    }
  });

  test("parse helpers and edge removals", () => {
    expect(readOrgChart("   ")).toBeNull();
    expect(removeOrgChart("")).toBeUndefined();
    expect(
      reportRoleLabel(
        { id: "r1", name: "Sam", role: "otro" },
        { operario: "Op", jornalero: "Jo", otro: "Other" },
      ),
    ).toBe("Other");

    vi.stubGlobal("crypto", {});
    expect(createReportId().startsWith("report-")).toBe(true);
    vi.unstubAllGlobals();

    hydrateOrgChartsFromRoster([
      {
        _id: "lead_singular",
        projectId: "solo",
        orgReports: null,
      },
      { _id: "  " },
    ]);
    expect(readOrgChart("lead_singular")?.projectIds).toEqual(["solo"]);
  });
});

describe("staff-org-chart-draft", () => {
  test("returns null when there are no reports", () => {
    expect(
      buildPerformanceDraft({
        locale: "es",
        leadName: "Juan",
        chart: emptyOrgChart("lead_1", "Juan"),
      }),
    ).toBeNull();
  });

  test("builds a Spanish draft listing each report", () => {
    const draft = buildPerformanceDraft({
      locale: "es",
      leadName: "Juan",
      chart: {
        ...emptyOrgChart("lead_1", "Juan"),
        reports: [
          { id: "r1", name: "Ana", role: "operario" },
          { id: "r2", name: "Luis", role: "jornalero" },
        ],
      },
    });

    expect(draft).toContain("Hola Juan");
    expect(draft).toContain("1. Ana (operario)");
    expect(draft).toContain("2. Luis (jornalero)");
    expect(draft).toContain("performance");
  });

  test("builds English drafts and titles without a lead name", () => {
    const chart = {
      ...emptyOrgChart("lead_1"),
      reports: [{ id: "r1", name: "Ana", role: "operario" as const }],
    };
    expect(
      buildPerformanceDraft({
        locale: "en",
        leadName: "",
        chart,
      }),
    ).toContain("Hi there");
    expect(
      buildAttendanceDraft({
        locale: "en",
        leadName: "",
        chart,
      }),
    ).toContain("Hi there");
    expect(
      buildAttendanceTitle({
        locale: "en",
        dateLabel: "Jul 15, 2026",
      }),
    ).toBe("Team attendance — Jul 15, 2026");
    expect(
      buildWorkProgressTitle({
        locale: "en",
        dateLabel: "Jul 15, 2026",
      }),
    ).toBe("Workday progress — Jul 15, 2026");
    expect(
      buildWorkProgressDraft({
        locale: "en",
        leadName: "Juan",
        chart,
      }),
    ).toContain("Percent complete");
  });

  test("builds a Spanish attendance draft from org chart reports", () => {
    const draft = buildAttendanceDraft({
      locale: "es",
      leadName: "Juan",
      chart: {
        ...emptyOrgChart("lead_1", "Juan"),
        reports: [
          { id: "r1", name: "Ana", role: "operario" },
          { id: "r2", name: "Luis", role: "jornalero" },
        ],
      },
    });
    expect(draft).toContain("Hola Juan");
    expect(draft).toContain("1. Ana (operario)");
    expect(
      buildAttendanceTitle({
        locale: "es",
        leadName: "Juan",
        dateLabel: "15 jul 2026",
      }),
    ).toBe("Asistencia del equipo — Juan — 15 jul 2026");
  });

  test("builds placeholder attendance draft when the chart is empty", () => {
    const draft = buildAttendanceDraft({
      locale: "en",
      leadName: "Juan",
      chart: emptyOrgChart("lead_1", "Juan"),
    });
    expect(draft).toContain("No people on this lead’s org chart yet");
  });

  test("builds work-progress and catalog preset drafts", () => {
    const chart = {
      ...emptyOrgChart("lead_1", "Juan"),
      reports: [{ id: "r1", name: "Ana", role: "operario" as const }],
    };
    expect(
      buildWorkProgressDraft({
        locale: "es",
        leadName: "Juan",
        chart,
      }),
    ).toContain("1. Ana (operario)");
    expect(
      buildWorkProgressTitle({
        locale: "es",
        leadName: "Juan",
        dateLabel: "15 jul 2026",
      }),
    ).toBe("Avance de jornada — Juan — 15 jul 2026");

    const applied = applyCatalogMessagePreset({
      presetId: "performance",
      locale: "es",
      leadName: "Juan",
      chart,
    });
    expect(applied.usedOrgChart).toBe(true);
    expect(applied.body).toContain("Ana (operario)");

    const attendance = applyCatalogMessagePreset({
      presetId: "attendance",
      locale: "en",
      leadName: "Juan",
      chart: null,
    });
    expect(attendance.usedOrgChart).toBe(false);
    expect(attendance.title).toContain("Team attendance");
    expect(attendance.body).toContain("No people on this lead’s org chart yet");
    expect(attendance.tags).toEqual(["attendance"]);

    const performanceEmpty = applyCatalogMessagePreset({
      presetId: "performance",
      locale: "en",
      leadName: "",
      chart: emptyOrgChart("lead_1", "Site lead"),
    });
    expect(performanceEmpty.usedOrgChart).toBe(false);
    expect(performanceEmpty.body).toContain("Hi Site lead");
    expect(performanceEmpty.title).toContain("Team performance");

    const performanceEsEmpty = applyCatalogMessagePreset({
      presetId: "performance",
      locale: "es",
      leadName: "",
      chart: null,
    });
    expect(performanceEsEmpty.body).toContain("organigrama");

    const withoutTeam = applyCatalogMessagePreset({
      presetId: "workProgress",
      locale: "en",
      leadName: "",
      chart: null,
    });
    expect(withoutTeam.usedOrgChart).toBe(false);
    expect(withoutTeam.body).toContain(
      "No people on this lead’s org chart yet",
    );
    expect(withoutTeam.tags).toEqual([]);

    const adelanto = applyCatalogMessagePreset({
      presetId: "adelanto",
      locale: "es",
      leadName: "Benjamin",
      chart: null,
    });
    expect(adelanto.title).toContain("Adelanto");
    expect(adelanto.body).toContain("alguna otra tarea");
    expect(adelanto.body).toContain("Cuánto se adelantó");
    expect(adelanto.tags).toEqual(["adelanto"]);
    expect(adelanto.usedOrgChart).toBe(false);
  });
});
