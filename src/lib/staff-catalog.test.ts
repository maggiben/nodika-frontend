import { describe, expect, it } from "vitest";

import {
  groupCatalogByLead,
  moveIdInOrder,
  parseStaffCatalog,
} from "@/lib/staff-catalog";

describe("staff-catalog order helpers", () => {
  it("moves an id within the same ordered list", () => {
    expect(moveIdInOrder(["a", "b", "c"], "c", "a")).toEqual(["c", "a", "b"]);
    expect(moveIdInOrder(["a", "b", "c"], "a", "c")).toEqual(["b", "c", "a"]);
    expect(moveIdInOrder(["a", "b"], "a", "a")).toBeNull();
    expect(moveIdInOrder(["a", "b"], "a", "z")).toBeNull();
  });

  it("parses sortOrder and groups by lead with restarting numbers", () => {
    const rows = parseStaffCatalog([
      {
        _id: "m2",
        title: "B",
        body: "b",
        assignedContactId: "leadA",
        assignedLabel: "Ana",
        sortOrder: 2,
        active: true,
      },
      {
        _id: "m1",
        title: "A",
        body: "a",
        assignedContactId: "leadA",
        assignedLabel: "Ana",
        sortOrder: 1,
        active: true,
      },
      {
        _id: "m3",
        title: "C",
        body: "c",
        assignedContactId: "leadB",
        assignedLabel: "Ben",
        sortOrder: 1,
        active: true,
      },
      {
        _id: "m0",
        title: "U",
        body: "u",
        assignedContactId: null,
        sortOrder: 0,
        active: true,
      },
    ]);
    const groups = groupCatalogByLead(rows);
    expect(groups).toHaveLength(3);
    expect(groups[0]?.rows.map((row) => row._id)).toEqual(["m1", "m2"]);
    expect(groups[0]?.rows.map((row) => row.sortOrder)).toEqual([1, 2]);
    expect(groups[1]?.rows[0]?.sortOrder).toBe(1);
    expect(groups[2]?.contactId).toBeNull();
  });
});
