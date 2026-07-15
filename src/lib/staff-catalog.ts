export type StaffCatalogRow = {
  _id: string;
  title: string;
  body: string;
  assignedContactId: string | null;
  assignedLabel: string | null;
  assignedPhone: string | null;
  active: boolean;
  lastSentAt: string | null;
  repliedAt: string | null;
  responseLatencyMs: number | null;
  responseStatus: string;
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
