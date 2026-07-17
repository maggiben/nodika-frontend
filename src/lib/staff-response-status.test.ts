import { describe, expect, it } from "vitest";

import { parseStaffCatalog } from "@/lib/staff-catalog";
import {
  computeStaffResponseStatus,
  formatStaffTimestamp,
  statusFromPersistedLatencyMs,
  STAFF_RED_AFTER_DAYS,
  STAFF_YELLOW_AFTER_DAYS,
} from "@/lib/staff-response-status";
import { parseStaffRoster } from "@/lib/staff-roster";
import { truncateForPreview } from "@/lib/text-preview";

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
    expect(formatStaffTimestamp("not-a-date", "es")).toBe("—");
    expect(formatStaffTimestamp("2026-07-15T12:00:00.000Z", "en")).not.toBe(
      "—",
    );
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

describe("truncateForPreview", () => {
  it("keeps short text and truncates long text for UI only", () => {
    expect(truncateForPreview("hola")).toBe("hola");
    const long = "x".repeat(150);
    const preview = truncateForPreview(long, 100);
    expect(preview.endsWith("…")).toBe(true);
    expect(preview.length).toBeLessThanOrEqual(100);
  });

  it("preserves line breaks instead of flattening them", () => {
    expect(truncateForPreview("linea 1\nlinea 2")).toBe("linea 1\nlinea 2");
    expect(truncateForPreview("a  \n\n  b")).toBe("a\n\nb");
  });
});

describe("parseStaffCatalog", () => {
  it("parses catalog rows with full body preserved", () => {
    const full =
      "Este es un mensaje largo que se guarda completo aunque la UI lo recorte.";
    const rows = parseStaffCatalog([
      {
        _id: "c1",
        title: "Avance",
        body: full,
        assignedContactId: "u1",
        assignedLabel: "PM",
        assignedPhone: "54911",
        active: true,
        lastSentAt: "2026-07-01T00:00:00.000Z",
        repliedAt: "2026-07-02T00:00:00.000Z",
        responseLatencyMs: 86400000,
        responseStatus: "green",
        tags: ["adelanto"],
      },
      {
        _id: "c2",
        title: "Otro",
        body: "corto",
        assignedContactId: 9,
        assignedLabel: 1,
        assignedPhone: false,
        active: false,
        lastSentAt: 1,
        repliedAt: 2,
        responseLatencyMs: "x",
        responseStatus: 3,
      },
      { title: "bad" },
      null,
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.body).toBe(full);
    expect(rows[0]?.tags).toEqual(["adelanto"]);
    expect(rows[0]?.responseLatencyMs).toBe(86400000);
    expect(rows[1]?.assignedContactId).toBeNull();
    expect(rows[1]?.responseStatus).toBe("neutral");
    expect(rows[1]?.active).toBe(false);
  });

  it("returns empty for non arrays", () => {
    expect(parseStaffCatalog(null)).toEqual([]);
  });
});
