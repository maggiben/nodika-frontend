import { describe, expect, it } from "vitest";

import {
  computeStaffResponseStatus,
  formatStaffTimestamp,
} from "@/lib/staff-response-status";
import { parseStaffRoster } from "@/lib/staff-roster";

describe("computeStaffResponseStatus", () => {
  const now = new Date("2026-07-15T12:00:00.000Z");

  it("returns neutral when never sent", () => {
    expect(computeStaffResponseStatus(null, null, now)).toBe("neutral");
  });

  it("returns neutral for invalid sent timestamps", () => {
    expect(computeStaffResponseStatus("not-a-date", null, now)).toBe("neutral");
  });

  it("returns green when reply arrives within two days", () => {
    expect(
      computeStaffResponseStatus(
        "2026-07-14T12:00:00.000Z",
        "2026-07-15T10:00:00.000Z",
        now,
      ),
    ).toBe("green");
  });

  it("returns yellow when a late reply lands between 2 and 5 days", () => {
    expect(
      computeStaffResponseStatus(
        "2026-07-11T12:00:00.000Z",
        "2026-07-15T10:00:00.000Z",
        now,
      ),
    ).toBe("yellow");
  });

  it("returns red when a reply arrives after more than 5 days", () => {
    expect(
      computeStaffResponseStatus(
        "2026-07-01T12:00:00.000Z",
        "2026-07-15T10:00:00.000Z",
        now,
      ),
    ).toBe("red");
  });

  it("returns yellow when silent between 2 and 5 days", () => {
    expect(
      computeStaffResponseStatus("2026-07-11T12:00:00.000Z", null, now),
    ).toBe("yellow");
  });

  it("returns red when silent more than 5 days", () => {
    expect(
      computeStaffResponseStatus("2026-07-01T12:00:00.000Z", null, now),
    ).toBe("red");
  });

  it("returns green while still inside the first two silent days", () => {
    expect(
      computeStaffResponseStatus("2026-07-14T12:00:00.000Z", null, now),
    ).toBe("green");
  });
});

describe("formatStaffTimestamp", () => {
  it("formats valid ISO dates and falls back for empty values", () => {
    expect(formatStaffTimestamp(null, "es")).toBe("—");
    expect(formatStaffTimestamp("not-a-date", "es")).toBe("—");
    expect(
      formatStaffTimestamp("2026-07-15T12:00:00.000Z", "en"),
    ).not.toBe("—");
  });
});

describe("parseStaffRoster", () => {
  it("parses valid roster rows and ignores invalid entries", () => {
    const rows = parseStaffRoster([
      {
        _id: "1",
        phone: "54911",
        label: "Obra",
        active: true,
        tags: ["staff", 3],
        lastSentAt: "2026-07-01T00:00:00.000Z",
        lastReceivedAt: null,
        lastTemplateKey: "weekly_status",
        messageTypes: ["weekly_status", 9],
        hasOutbound: true,
      },
      {
        _id: "2",
        phone: "54922",
        active: true,
        tags: ["staff"],
        lastSentAt: 123,
        lastReceivedAt: 456,
        lastTemplateKey: 789,
        messageTypes: "weekly",
        hasOutbound: 0,
      },
      { phone: "bad" },
      null,
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.label).toBe("Obra");
    expect(rows[0]?.hasOutbound).toBe(true);
    expect(rows[0]?.tags).toEqual(["staff"]);
    expect(rows[0]?.messageTypes).toEqual(["weekly_status"]);
    expect(rows[1]?.lastSentAt).toBeNull();
    expect(rows[1]?.lastReceivedAt).toBeNull();
    expect(rows[1]?.lastTemplateKey).toBeNull();
    expect(rows[1]?.messageTypes).toEqual([]);
    expect(rows[1]?.hasOutbound).toBe(false);
  });

  it("returns an empty list for non-array payloads", () => {
    expect(parseStaffRoster(null)).toEqual([]);
    expect(parseStaffRoster({ items: [] })).toEqual([]);
  });
});
