const ORG_CHART_STORAGE_KEY = "nodika.staffOrgCharts.v1";
export const STAFF_ORG_CHART_CHANGED_EVENT = "nodika:staff-org-chart-changed";

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
  updatedAt: string;
};

export type StaffOrgChartStore = {
  charts: Record<string, StaffOrgChart>;
};

const EMPTY_STORE: StaffOrgChartStore = { charts: {} };

let memoryStore: StaffOrgChartStore | null = null;

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

function invalidateMemoryStore() {
  memoryStore = null;
}

function parseReport(value: unknown): StaffOrgReport | null {
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

function parseChart(value: unknown): StaffOrgChart | null {
  if (!isRecord(value)) {
    return null;
  }
  const contactId = asString(value.contactId);
  if (!contactId || !Array.isArray(value.reports)) {
    return null;
  }
  const reports = value.reports
    .map(parseReport)
    .filter((report): report is StaffOrgReport => report !== null);
  const contactLabel = asString(value.contactLabel) ?? undefined;
  const updatedAt = asString(value.updatedAt) ?? new Date().toISOString();
  return {
    contactId,
    ...(contactLabel ? { contactLabel } : {}),
    reports,
    updatedAt,
  };
}

function parseStore(raw: string | null): StaffOrgChartStore {
  if (!raw || raw.trim().length === 0) {
    return EMPTY_STORE;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.charts)) {
      return EMPTY_STORE;
    }
    const charts: Record<string, StaffOrgChart> = {};
    for (const [key, value] of Object.entries(parsed.charts)) {
      const chart = parseChart(value);
      if (chart && chart.contactId === key) {
        charts[key] = chart;
      }
    }
    return { charts };
  } catch {
    return EMPTY_STORE;
  }
}

function writeStore(store: StaffOrgChartStore): void {
  if (typeof window === "undefined") {
    return;
  }
  memoryStore = store;
  try {
    window.localStorage.setItem(ORG_CHART_STORAGE_KEY, JSON.stringify(store));
    notifyStoreChanged();
  } catch {
    // Ignore quota / privacy-mode failures.
  }
}

export function readOrgChartStore(): StaffOrgChartStore {
  if (typeof window === "undefined") {
    return EMPTY_STORE;
  }
  if (memoryStore !== null) {
    return memoryStore;
  }
  try {
    const store = parseStore(
      window.localStorage.getItem(ORG_CHART_STORAGE_KEY),
    );
    memoryStore = store;
    return store;
  } catch {
    memoryStore = EMPTY_STORE;
    return EMPTY_STORE;
  }
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
): StaffOrgChart {
  return {
    contactId: contactId.trim(),
    ...(asString(contactLabel)
      ? { contactLabel: asString(contactLabel)! }
      : {}),
    reports: [],
    updatedAt: new Date().toISOString(),
  };
}

export function upsertOrgChart(chart: StaffOrgChart): StaffOrgChart {
  const contactId = chart.contactId.trim();
  const next: StaffOrgChart = {
    contactId,
    ...(asString(chart.contactLabel)
      ? { contactLabel: asString(chart.contactLabel)! }
      : {}),
    reports: chart.reports
      .map((report) => parseReport(report))
      .filter((report): report is StaffOrgReport => report !== null),
    updatedAt: new Date().toISOString(),
  };
  const store = readOrgChartStore();
  writeStore({
    charts: {
      ...store.charts,
      [contactId]: next,
    },
  });
  return next;
}

export function removeOrgChart(contactId: string): void {
  const id = contactId.trim();
  if (!id || typeof window === "undefined") {
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

  const onCrossTabStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== ORG_CHART_STORAGE_KEY) {
      return;
    }
    invalidateMemoryStore();
    onStoreChange();
  };
  const onSameTabChange = () => onStoreChange();

  window.addEventListener("storage", onCrossTabStorage);
  window.addEventListener(STAFF_ORG_CHART_CHANGED_EVENT, onSameTabChange);
  return () => {
    window.removeEventListener("storage", onCrossTabStorage);
    window.removeEventListener(STAFF_ORG_CHART_CHANGED_EVENT, onSameTabChange);
  };
}

/** Clears browser + in-memory store (tests / remove-all). */
export function clearOrgCharts(): void {
  memoryStore = null;
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(ORG_CHART_STORAGE_KEY);
    notifyStoreChanged();
  } catch {
    // Ignore storage failures.
  }
}
