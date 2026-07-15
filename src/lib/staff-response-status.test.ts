import { describe, expect, it } from "vitest";

import {
  computeStaffResponseStatus,
  formatStaffTimestamp,
} from "@/lib/staff-response-status";
import { parseStaffRoster } from "@/lib/staff-roster";
import { parseStaffCatalog } from "@/lib/staff-catalog";
import { truncateForPreview } from "@/lib/text-preview";

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
    expect(rows[0]?.responseLatencyMs).toBe(86400000);
    expect(rows[1]?.assignedContactId).toBeNull();
    expect(rows[1]?.responseStatus).toBe("neutral");
    expect(rows[1]?.active).toBe(false);
  });

  it("returns empty for non arrays", () => {
    expect(parseStaffCatalog(null)).toEqual([]);
  });
});
