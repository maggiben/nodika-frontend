export type StaffCatalogRow = {
  _id: string;
  title: string;
  body: string;
  assignedContactId: string | null;
  assignedLabel: string | null;
  assignedPhone: string | null;
  sortOrder: number;
  active: boolean;
  lastSentAt: string | null;
  repliedAt: string | null;
  responseLatencyMs: number | null;
  responseStatus: string;
};

export type CatalogLeadGroup = {
  contactId: string | null;
  label: string;
  rows: StaffCatalogRow[];
};

export function parseStaffCatalog(payload: unknown): StaffCatalogRow[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .filter(
      (item) =>
        typeof item._id === "string" &&
        typeof item.title === "string" &&
        typeof item.body === "string",
    )
    .map((item) => ({
      _id: item._id as string,
      title: item.title as string,
      body: item.body as string,
      assignedContactId:
        typeof item.assignedContactId === "string"
          ? item.assignedContactId
          : null,
      assignedLabel:
        typeof item.assignedLabel === "string" ? item.assignedLabel : null,
      assignedPhone:
        typeof item.assignedPhone === "string" ? item.assignedPhone : null,
      sortOrder:
        typeof item.sortOrder === "number" && Number.isFinite(item.sortOrder)
          ? item.sortOrder
          : 0,
      active: item.active !== false,
      lastSentAt: typeof item.lastSentAt === "string" ? item.lastSentAt : null,
      repliedAt: typeof item.repliedAt === "string" ? item.repliedAt : null,
      responseLatencyMs:
        typeof item.responseLatencyMs === "number"
          ? item.responseLatencyMs
          : null,
      responseStatus:
        typeof item.responseStatus === "string"
          ? item.responseStatus
          : "neutral",
    }));
}

/** Move `fromId` before/onto `toId` inside an ordered id list. */
export function moveIdInOrder(
  orderedIds: string[],
  fromId: string,
  toId: string,
): string[] | null {
  if (fromId === toId) {
    return null;
  }
  const from = orderedIds.indexOf(fromId);
  const to = orderedIds.indexOf(toId);
  if (from < 0 || to < 0) {
    return null;
  }
  const next = [...orderedIds];
  next.splice(from, 1);
  next.splice(to, 0, fromId);
  return next;
}

/** Group catalog rows by assignee; assigned leads first (by label), unassigned last. */
export function groupCatalogByLead(
  rows: StaffCatalogRow[],
): CatalogLeadGroup[] {
  const groups = new Map<string, CatalogLeadGroup>();
  for (const row of rows) {
    const key = row.assignedContactId ?? "__unassigned__";
    const existing = groups.get(key);
    if (existing) {
      existing.rows.push(row);
      continue;
    }
    groups.set(key, {
      contactId: row.assignedContactId,
      label:
        row.assignedLabel?.trim() ||
        row.assignedPhone ||
        (row.assignedContactId ? row.assignedContactId : "Unassigned"),
      rows: [row],
    });
  }
  const list = [...groups.values()];
  for (const group of list) {
    group.rows.sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left._id.localeCompare(right._id),
    );
  }
  list.sort((left, right) => {
    if (!left.contactId && right.contactId) {
      return 1;
    }
    if (left.contactId && !right.contactId) {
      return -1;
    }
    return left.label.localeCompare(right.label);
  });
  return list;
}
