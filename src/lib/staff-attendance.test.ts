// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
  buildAttendanceCsv,
  clearAttendanceStore,
  currentYearMonth,
  daysInYearMonth,
  filterPeopleByName,
  getMark,
  parseAttendanceStore,
  readAttendanceStore,
  setMark,
  STAFF_ATTENDANCE_STORAGE_KEY,
  summarizeAttendance,
} from "@/lib/staff-attendance";

describe("staff-attendance", () => {
  beforeEach(() => {
    clearAttendanceStore();
    window.localStorage.clear();
  });

  afterEach(() => {
    clearAttendanceStore();
    window.localStorage.clear();
  });

  test("daysInYearMonth lists every calendar day", () => {
    expect(daysInYearMonth("2026-02")).toHaveLength(28);
    expect(daysInYearMonth("2026-02")[0]).toBe("2026-02-01");
    expect(daysInYearMonth("2026-02").at(-1)).toBe("2026-02-28");
    expect(daysInYearMonth("bad")).toEqual([]);
  });

  test("currentYearMonth formats YYYY-MM", () => {
    expect(currentYearMonth(new Date("2026-07-19T12:00:00Z"))).toBe("2026-07");
  });

  test("persists marks and round-trips through localStorage", () => {
    setMark("lead_1", "r1", "2026-07-01", "full_day");
    setMark("lead_1", "r1", "2026-07-02", "absent");
    expect(getMark("lead_1", "r1", "2026-07-01")).toBe("full_day");
    expect(getMark("lead_1", "r1", "2026-07-02")).toBe("absent");

    const raw = window.localStorage.getItem(STAFF_ATTENDANCE_STORAGE_KEY);
    expect(raw).toBeTruthy();
    clearAttendanceStore();
    window.localStorage.setItem(STAFF_ATTENDANCE_STORAGE_KEY, raw!);
    // Force re-read from storage
    expect(
      parseAttendanceStore(JSON.parse(raw!)).marks.lead_1.r1["2026-07-01"],
    ).toBe("full_day");
  });

  test("clearing a mark leaves other history intact", () => {
    setMark("lead_1", "r1", "2026-07-01", "full_day");
    setMark("lead_1", "r1", "2026-06-15", "half_day");
    setMark("lead_1", "r1", "2026-07-01", null);
    expect(getMark("lead_1", "r1", "2026-07-01")).toBeNull();
    expect(getMark("lead_1", "r1", "2026-06-15")).toBe("half_day");
  });

  test("month changes do not erase other months", () => {
    setMark("lead_1", "r1", "2026-06-30", "justified");
    setMark("lead_1", "r1", "2026-07-01", "full_day");
    expect(summarizeAttendance("lead_1", "2026-06", ["r1"]).justified).toBe(1);
    expect(summarizeAttendance("lead_1", "2026-07", ["r1"]).full_day).toBe(1);
    expect(summarizeAttendance("lead_1", "2026-07", ["r1"]).justified).toBe(0);
  });

  test("summarizeAttendance tallies filtered report ids", () => {
    setMark("lead_1", "r1", "2026-07-01", "full_day");
    setMark("lead_1", "r1", "2026-07-02", "half_day");
    setMark("lead_1", "r2", "2026-07-01", "absent");
    setMark("lead_1", "r2", "2026-07-03", "justified");

    expect(summarizeAttendance("lead_1", "2026-07", ["r1"])).toEqual({
      full_day: 1,
      half_day: 1,
      absent: 0,
      justified: 0,
    });
    expect(summarizeAttendance("lead_1", "2026-07", ["r1", "r2"])).toEqual({
      full_day: 1,
      half_day: 1,
      absent: 1,
      justified: 1,
    });
  });

  test("filterPeopleByName is case-insensitive", () => {
    const people = [
      { id: "1", name: "Ana Pérez" },
      { id: "2", name: "Juan Gómez" },
    ];
    expect(filterPeopleByName(people, "ana")).toEqual([people[0]]);
    expect(filterPeopleByName(people, "  ")).toEqual(people);
  });

  test("CSV includes orphans and does not clear storage", () => {
    setMark("lead_1", "alive", "2026-07-01", "full_day");
    setMark("lead_1", "gone", "2026-07-02", "absent");

    const csv = buildAttendanceCsv({
      leadId: "lead_1",
      leadLabel: "Boss",
      yearMonth: "2026-07",
      people: [{ id: "alive", name: "Alive Person" }],
      removedLabel: "Removed",
    });

    expect(csv).toContain("Alive Person");
    expect(csv).toContain("Removed (gone)");
    expect(csv).toContain("full_day");
    expect(csv).toContain("absent");
    expect(getMark("lead_1", "alive", "2026-07-01")).toBe("full_day");
    expect(getMark("lead_1", "gone", "2026-07-02")).toBe("absent");
    expect(readAttendanceStore().marks.lead_1.gone["2026-07-02"]).toBe(
      "absent",
    );
  });

  test("parseAttendanceStore ignores invalid payloads", () => {
    expect(parseAttendanceStore(null).marks).toEqual({});
    expect(
      parseAttendanceStore({
        marks: {
          lead: {
            r1: { "not-a-date": "full_day", "2026-07-01": "nope" },
          },
        },
      }).marks,
    ).toEqual({});
  });
});
