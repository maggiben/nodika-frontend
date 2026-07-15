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
  readOrgChart,
  removeOrgChart,
  reportRoleLabel,
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
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(countOrgReports("lead_1")).toBe(2);
    expect(readOrgChart("lead_1")?.reports.map((r) => r.name)).toEqual([
      "Ana",
      "Luis",
    ]);
    expect(
      JSON.parse(getOrgChartsSnapshot()).charts.lead_1.reports,
    ).toHaveLength(2);
  });

  test("removes a chart for a contact", () => {
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

  test("ignores corrupt localStorage payloads", () => {
    window.localStorage.setItem("nodika.staffOrgCharts.v1", "{not-json");
    expect(readOrgChart("x")).toBeNull();
    window.localStorage.setItem(
      "nodika.staffOrgCharts.v1",
      JSON.stringify({ charts: { bad: { contactId: "other" } } }),
    );
    clearOrgCharts();
    expect(countOrgReports("bad")).toBe(0);
  });

  test("notifies subscribers and creates report ids", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToOrgCharts(listener);
    upsertOrgChart({
      ...emptyOrgChart("lead_4"),
      reports: [{ id: createReportId(), name: "A", role: "operario" }],
    });
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    expect(createReportId().length).toBeGreaterThan(4);
  });

  test("covers storage event subscriptions and role labels without roleOther", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToOrgCharts(listener);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "other-key", newValue: "x" }),
    );
    expect(listener).not.toHaveBeenCalled();
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "nodika.staffOrgCharts.v1",
        newValue: "{}",
      }),
    );
    expect(listener).toHaveBeenCalled();
    unsubscribe();

    expect(
      reportRoleLabel(
        { id: "r1", name: "Sam", role: "otro" },
        {
          operario: "Operator",
          jornalero: "Day laborer",
          otro: "Other",
        },
      ),
    ).toBe("Other");
    expect(readOrgChart("   ")).toBeNull();
    expect(createReportId()).toMatch(/./);

    const original = globalThis.crypto;
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: undefined,
    });
    expect(createReportId()).toMatch(/^report-/);
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: original,
    });
  });

  test("swallows localStorage write failures", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() =>
      upsertOrgChart({
        ...emptyOrgChart("lead_5"),
        reports: [{ id: "r1", name: "A", role: "operario" }],
      }),
    ).not.toThrow();
  });

  test("swallows localStorage read failures", () => {
    clearOrgCharts();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readOrgChart("lead_x")).toBeNull();
    expect(countOrgReports("lead_x")).toBe(0);
  });

  test("parses empty, mismatched, and partial chart documents", () => {
    clearOrgCharts();
    window.localStorage.setItem("nodika.staffOrgCharts.v1", "   ");
    expect(getOrgChartsSnapshot()).toBe(JSON.stringify({ charts: {} }));

    clearOrgCharts();
    window.localStorage.setItem(
      "nodika.staffOrgCharts.v1",
      JSON.stringify({
        charts: {
          lead_ok: {
            contactId: "lead_ok",
            contactLabel: "  ",
            reports: [
              { id: "r1", name: "A", role: "operario" },
              { id: "r2", name: "B", role: "nope" },
              null,
              { id: "r3", name: "C", role: "jornalero" },
            ],
            updatedAt: null,
          },
          lead_bad: {
            contactId: "different",
            reports: [],
          },
        },
      }),
    );
    expect(countOrgReports("lead_ok")).toBe(2);
    expect(readOrgChart("lead_bad")).toBeNull();
  });

  test("swallows localStorage remove failures on clear", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => clearOrgCharts()).not.toThrow();
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
        contactId: "lead_1",
        contactLabel: "Juan",
        reports: [
          { id: "r1", name: "Ana", role: "operario" },
          { id: "r2", name: "Luis", role: "jornalero" },
        ],
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });

    expect(draft).toContain("Hola Juan");
    expect(draft).toContain("1. Ana (operario)");
    expect(draft).toContain("2. Luis (jornalero)");
    expect(draft).toContain("performance");
  });

  test("builds an English draft listing each report", () => {
    const draft = buildPerformanceDraft({
      locale: "en",
      leadName: "",
      chart: {
        contactId: "lead_1",
        contactLabel: "Site lead",
        reports: [{ id: "r1", name: "Ana", role: "otro", roleOther: "Helper" }],
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });

    expect(draft).toContain("Hi Site lead");
    expect(draft).toContain("1. Ana (Helper)");
    expect(draft).toContain("performance update");
  });

  test("falls back when lead name and label are missing", () => {
    const draft = buildPerformanceDraft({
      locale: "en",
      leadName: "   ",
      chart: {
        contactId: "lead_1",
        reports: [{ id: "r1", name: "Ana", role: "operario" }],
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });
    expect(draft).toContain("Hi there");
  });

  test("builds a Spanish attendance draft from org chart reports", () => {
    const draft = buildAttendanceDraft({
      locale: "es",
      leadName: "Juan",
      chart: {
        contactId: "lead_1",
        contactLabel: "Juan",
        reports: [
          { id: "r1", name: "Ana", role: "operario" },
          { id: "r2", name: "Luis", role: "jornalero" },
        ],
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });
    expect(draft).toContain("Hola Juan");
    expect(draft).toContain("1. Ana (operario)");
    expect(draft).toContain("2. Luis (jornalero)");
    expect(draft).toContain("Día completo");
    expect(draft).toContain("Media jornada");
    expect(draft).toContain("Faltó");
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
    expect(draft).toContain("Hi Juan");
    expect(draft).not.toContain("Person 1");
    expect(draft).toContain("No people on this lead’s org chart yet");
  });

  test("builds work-progress and catalog preset drafts", () => {
    const chart = {
      contactId: "lead_1",
      contactLabel: "Juan",
      reports: [{ id: "r1", name: "Ana", role: "operario" as const }],
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    expect(
      buildWorkProgressDraft({
        locale: "es",
        leadName: "Juan",
        chart,
      }),
    ).toMatch(/Porcentaje cumplido[\s\S]*Duración[\s\S]*Avance[\s\S]*Notas/);
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
    expect(applied.title).toContain("Performance del equipo — Juan");
    expect(applied.body).toContain("Ana (operario)");

    const withoutTeam = applyCatalogMessagePreset({
      presetId: "workProgress",
      locale: "en",
      leadName: "",
      chart: null,
    });
    expect(withoutTeam.usedOrgChart).toBe(false);
    expect(withoutTeam.body).toContain("Percent complete");
    expect(withoutTeam.body).not.toContain("Person 1");
    expect(withoutTeam.body).toContain("No people on this lead’s org chart yet");
  });
});
