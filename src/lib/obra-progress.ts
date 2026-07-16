export type ObraProgressRole = "jefe_obra" | "operario" | "jornalero" | "otro";

export type ObraProgressReport = {
  contactId: string;
  role: ObraProgressRole;
  taskId: string | null;
  percent: number;
  duration: string | null;
  avance: string | null;
  notes: string | null;
  repliedAt: string;
  messageId: string;
};

export type ObraProgressSummary = {
  projectId: string;
  overallPercent: number | null;
  byRole: {
    jefe_obra: number | null;
    operario: number | null;
    jornalero: number | null;
    otro: number | null;
  };
  reports: ObraProgressReport[];
  updatedAt: string | null;
};

const ROLE_KEYS: ObraProgressRole[] = [
  "jefe_obra",
  "operario",
  "jornalero",
  "otro",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asRole(value: unknown): ObraProgressRole | null {
  return typeof value === "string" &&
    ROLE_KEYS.includes(value as ObraProgressRole)
    ? (value as ObraProgressRole)
    : null;
}

function parseReport(value: unknown): ObraProgressReport | null {
  if (!isRecord(value)) {
    return null;
  }
  const contactId = asString(value.contactId);
  const role = asRole(value.role);
  const percent = asNumber(value.percent);
  const messageId = asString(value.messageId);
  const repliedAt = asString(value.repliedAt);
  if (!contactId || !role || percent === null || !messageId || !repliedAt) {
    return null;
  }
  return {
    contactId,
    role,
    taskId: asString(value.taskId),
    percent,
    duration: asString(value.duration),
    avance: asString(value.avance),
    notes: asString(value.notes),
    repliedAt,
    messageId,
  };
}

export function parseObraProgressSummary(
  value: unknown,
): ObraProgressSummary | null {
  if (!isRecord(value)) {
    return null;
  }
  const projectId = asString(value.projectId);
  if (!projectId) {
    return null;
  }
  const byRoleRaw = isRecord(value.byRole) ? value.byRole : {};
  const reports = Array.isArray(value.reports)
    ? value.reports
        .map(parseReport)
        .filter((row): row is ObraProgressReport => row !== null)
    : [];

  return {
    projectId,
    overallPercent: asNumber(value.overallPercent),
    byRole: {
      jefe_obra: asNumber(byRoleRaw.jefe_obra),
      operario: asNumber(byRoleRaw.operario),
      jornalero: asNumber(byRoleRaw.jornalero),
      otro: asNumber(byRoleRaw.otro),
    },
    reports,
    updatedAt: asString(value.updatedAt),
  };
}

export function hasUsableOverallProgress(
  progress: ObraProgressSummary | null | undefined,
): progress is ObraProgressSummary & { overallPercent: number } {
  return (
    progress !== null &&
    progress !== undefined &&
    progress.overallPercent !== null &&
    Number.isFinite(progress.overallPercent)
  );
}

export async function fetchObraProgress(
  projectId: string,
): Promise<ObraProgressSummary | null> {
  const trimmed = projectId.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const response = await fetch(
      `/api/messaging/progress?projectId=${encodeURIComponent(trimmed)}`,
      { method: "GET" },
    );
    if (!response.ok) {
      return null;
    }
    const body: unknown = await response.json().catch(() => null);
    return parseObraProgressSummary(body);
  } catch {
    return null;
  }
}
