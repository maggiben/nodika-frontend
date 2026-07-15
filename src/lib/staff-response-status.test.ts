import { describe, expect, it } from "vitest";

import {
  computeStaffResponseStatus,
  formatStaffTimestamp,
  statusFromPersistedLatencyMs,
  STAFF_RED_AFTER_DAYS,
  STAFF_YELLOW_AFTER_DAYS,
} from "@/lib/staff-response-status";

describe("staff response traffic light (1d / 2d / 3d+)", () => {
  const now = new Date("2026-07-15T12:00:00.000Z");

  it("uses one- and two-day bands from persisted timestamps", () => {
    expect(STAFF_YELLOW_AFTER_DAYS).toBe(1);
    expect(STAFF_RED_AFTER_DAYS).toBe(2);

    expect(
      computeStaffResponseStatus(
        "2026-07-15T00:00:00.000Z",
        "2026-07-15T12:00:00.000Z",
        now,
      ),
    ).toBe("green");

    expect(
      computeStaffResponseStatus(
        "2026-07-13T12:00:00.000Z",
        "2026-07-15T00:00:00.000Z",
        now,
      ),
    ).toBe("yellow");

    expect(
      computeStaffResponseStatus(
        "2026-07-11T12:00:00.000Z",
        "2026-07-15T12:00:00.000Z",
        now,
      ),
    ).toBe("red");
  });

  it("derives color from persisted latency milliseconds", () => {
    expect(statusFromPersistedLatencyMs(12 * 60 * 60 * 1000)).toBe("green");
    expect(statusFromPersistedLatencyMs(36 * 60 * 60 * 1000)).toBe("yellow");
    expect(statusFromPersistedLatencyMs(72 * 60 * 60 * 1000)).toBe("red");
    expect(statusFromPersistedLatencyMs(null)).toBe("pending");
  });

  it("formats timestamps for display", () => {
    expect(formatStaffTimestamp(null, "es")).toBe("—");
    expect(
      formatStaffTimestamp("2026-07-15T12:00:00.000Z", "en"),
    ).not.toBe("—");
  });
});
