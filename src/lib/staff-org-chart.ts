/** In-memory org charts loaded from Core via BFF. No localStorage as source of truth. */

export const STAFF_ORG_CHART_CHANGED_EVENT = "nodika:staff-org-chart-changed";
const LEGACY_ORG_CHART_STORAGE_KEY = "nodika.staffOrgCharts.v1";

export type StaffReportRole = "operario" | "jornalero" | "otro";

export type StaffOrgReport = {
  id: string;
  name: string;
  role: StaffReportRole;
  /** Free-text label when role is `otro`. */
  roleOther?: string;
};

export type StaffOrgChart = {
  contactId: string;
  contactLabel?: string;
  reports: StaffOrgReport[];
  projectIds: string[];
  updatedAt: string;
};

export type StaffOrgChartStore = {
  charts: Record<string, StaffOrgChart>;
};

const EMPTY_STORE: StaffOrgChartStore = { charts: {} };

let memoryStore: StaffOrgChartStore = EMPTY_STORE;

const REPORT_ROLES: StaffReportRole[] = ["operario", "jornalero", "otro"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isReportRole(value: unknown): value is StaffReportRole {
  return (
    typeof value === "string" && REPORT_ROLES.includes(value as StaffReportRole)
  );
}

function notifyStoreChanged() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(STAFF_ORG_CHART_CHANGED_EVENT));
}

function writeStore(store: StaffOrgChartStore): void {
  memoryStore = store;
  notifyStoreChanged();
}

function clearLegacyLocalStorage(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(LEGACY_ORG_CHART_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function parseOrgReport(value: unknown): StaffOrgReport | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = asString(value.id);
  const name = asString(value.name);
  if (!id || !name || !isReportRole(value.role)) {
    return null;
  }
  const roleOther =
    value.role === "otro"
      ? (asString(value.roleOther) ?? undefined)
      : undefined;
  return {
    id,
    name,
    role: value.role,
    ...(roleOther ? { roleOther } : {}),
  };
}

export function parseOrgReports(value: unknown): StaffOrgReport[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map(parseOrgReport)
    .filter((report): report is StaffOrgReport => report !== null);
}

export function parseProjectIds(value: unknown, fallback?: unknown): string[] {
  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .map((id) => asString(id))
          .filter((id): id is string => Boolean(id)),
      ),
    ];
  }
  const singular = asString(fallback);
  return singular ? [singular] : [];
}

export function chartFromRosterRow(row: {
  _id: string;
  label?: string;
  orgReports?: unknown;
  projectIds?: unknown;
  projectId?: unknown;
}): StaffOrgChart {
  return {
    contactId: row._id,
    ...(asString(row.label) ? { contactLabel: asString(row.label)! } : {}),
    reports: parseOrgReports(row.orgReports),
    projectIds: parseProjectIds(row.projectIds, row.projectId),
    updatedAt: new Date().toISOString(),
  };
}

/** Replace the in-memory store from roster (or contact) rows. */
export function hydrateOrgChartsFromRoster(
  rows: Array<{
    _id: string;
    label?: string;
    orgReports?: unknown;
    projectIds?: unknown;
    projectId?: unknown;
  }>,
): StaffOrgChartStore {
  clearLegacyLocalStorage();
  const charts: Record<string, StaffOrgChart> = {};
  for (const row of rows) {
    if (!asString(row._id)) {
      continue;
    }
    charts[row._id] = chartFromRosterRow(row);
  }
  const store = { charts };
  writeStore(store);
  return store;
}

export function readOrgChartStore(): StaffOrgChartStore {
  return memoryStore;
}

/** Stable snapshot for `useSyncExternalStore` consumers. */
export function getOrgChartsSnapshot(): string {
  return JSON.stringify(readOrgChartStore());
}

export function readOrgChart(contactId: string): StaffOrgChart | null {
  const id = contactId.trim();
  if (!id) {
    return null;
  }
  return readOrgChartStore().charts[id] ?? null;
}

export function countOrgReports(contactId: string): number {
  return readOrgChart(contactId)?.reports.length ?? 0;
}

export function emptyOrgChart(
  contactId: string,
  contactLabel?: string,
  projectIds: string[] = [],
): StaffOrgChart {
  return {
    contactId: contactId.trim(),
    ...(asString(contactLabel)
      ? { contactLabel: asString(contactLabel)! }
      : {}),
    reports: [],
    projectIds: [...projectIds],
    updatedAt: new Date().toISOString(),
  };
}

/** Updates the in-memory chart only (tests / optimistic UI). */
export function upsertOrgChart(chart: StaffOrgChart): StaffOrgChart {
  const contactId = chart.contactId.trim();
  const next: StaffOrgChart = {
    contactId,
    ...(asString(chart.contactLabel)
      ? { contactLabel: asString(chart.contactLabel)! }
      : {}),
    reports: chart.reports
      .map((report) => parseOrgReport(report))
      .filter((report): report is StaffOrgReport => report !== null),
    projectIds: parseProjectIds(chart.projectIds),
    updatedAt: new Date().toISOString(),
  };
  writeStore({
    charts: {
      ...readOrgChartStore().charts,
      [contactId]: next,
    },
  });
  return next;
}

export type SaveOrgChartInput = {
  contactId: string;
  reports: StaffOrgReport[];
  projectIds: string[];
  contactLabel?: string;
};

export type SaveOrgChartResult =
  | { ok: true; chart: StaffOrgChart }
  | { ok: false; message: string; status?: number };

/** Persist org reports + project membership to Core through the BFF. */
export async function saveOrgChartToCore(
  input: SaveOrgChartInput,
): Promise<SaveOrgChartResult> {
  const contactId = input.contactId.trim();
  if (!contactId) {
    return { ok: false, message: "Contact id is required." };
  }

  const reports = input.reports
    .map((report) => parseOrgReport(report))
    .filter((report): report is StaffOrgReport => report !== null);
  const projectIds = parseProjectIds(input.projectIds);

  try {
    const response = await fetch(
      `/api/messaging/contacts/${encodeURIComponent(contactId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgReports: reports,
          projectIds,
        }),
      },
    );
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        isRecord(body) && typeof body.message === "string"
          ? body.message
          : `Save failed (${response.status}).`;
      return { ok: false, message, status: response.status };
    }

    const chart: StaffOrgChart = {
      contactId,
      ...(asString(input.contactLabel)
        ? { contactLabel: asString(input.contactLabel)! }
        : {}),
      reports:
        isRecord(body) && "orgReports" in body
          ? parseOrgReports(body.orgReports)
          : reports,
      projectIds:
        isRecord(body) && ("projectIds" in body || "projectId" in body)
          ? parseProjectIds(body.projectIds, body.projectId)
          : projectIds,
      updatedAt: new Date().toISOString(),
    };
    upsertOrgChart(chart);
    return { ok: true, chart };
  } catch {
    return { ok: false, message: "Could not reach the messaging service." };
  }
}

/** Drops a chart from memory (contact deletion is owned by Core). */
export function removeOrgChart(contactId: string): void {
  const id = contactId.trim();
  if (!id) {
    return;
  }
  const store = readOrgChartStore();
  if (!(id in store.charts)) {
    return;
  }
  const charts = { ...store.charts };
  delete charts[id];
  writeStore({ charts });
}

export function createReportId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `report-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function reportRoleLabel(
  report: StaffOrgReport,
  labels: Record<StaffReportRole, string>,
): string {
  if (report.role === "otro" && report.roleOther) {
    return report.roleOther;
  }
  return labels[report.role];
}

export function subscribeToOrgCharts(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onSameTabChange = () => onStoreChange();
  window.addEventListener(STAFF_ORG_CHART_CHANGED_EVENT, onSameTabChange);
  return () => {
    window.removeEventListener(STAFF_ORG_CHART_CHANGED_EVENT, onSameTabChange);
  };
}

/** Clears in-memory store and legacy localStorage key (tests). */
export function clearOrgCharts(): void {
  memoryStore = EMPTY_STORE;
  clearLegacyLocalStorage();
  notifyStoreChanged();
}
