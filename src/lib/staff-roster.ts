export type StaffRosterRow = {
  _id: string;
  phone: string;
  label?: string;
  active: boolean;
  tags: string[];
  projectId?: string | null;
  projectIds?: string[];
  lastSentAt: string | null;
  lastReceivedAt: string | null;
  lastTemplateKey: string | null;
  messageTypes: string[];
  hasOutbound: boolean;
  responseLatencyMs?: number | null;
  responseStatus?: string;
};

export type StaffTemplate = {
  key: string;
  name: string;
  description?: string;
  body?: { text?: string };
  active?: boolean;
  source?: string;
};

export function isStaffRosterRow(value: unknown): value is StaffRosterRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row._id === "string" &&
    typeof row.phone === "string" &&
    typeof row.active === "boolean" &&
    Array.isArray(row.tags)
  );
}

export function parseStaffRoster(payload: unknown): StaffRosterRow[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload.filter(isStaffRosterRow).map((row) => ({
    _id: row._id,
    phone: row.phone,
    label: typeof row.label === "string" ? row.label : undefined,
    active: row.active,
    tags: row.tags.filter((tag): tag is string => typeof tag === "string"),
    projectIds: Array.isArray(row.projectIds)
      ? row.projectIds.filter((id): id is string => typeof id === "string")
      : typeof row.projectId === "string"
        ? [row.projectId]
        : [],
    projectId:
      typeof row.projectId === "string"
        ? row.projectId
        : Array.isArray(row.projectIds) &&
            typeof row.projectIds[0] === "string"
          ? row.projectIds[0]
          : null,
    lastSentAt: typeof row.lastSentAt === "string" ? row.lastSentAt : null,
    lastReceivedAt:
      typeof row.lastReceivedAt === "string" ? row.lastReceivedAt : null,
    lastTemplateKey:
      typeof row.lastTemplateKey === "string" ? row.lastTemplateKey : null,
    messageTypes: Array.isArray(row.messageTypes)
      ? row.messageTypes.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    hasOutbound: Boolean(row.hasOutbound),
    responseLatencyMs:
      typeof row.responseLatencyMs === "number" ? row.responseLatencyMs : null,
    responseStatus:
      typeof row.responseStatus === "string" ? row.responseStatus : undefined,
  }));
}
