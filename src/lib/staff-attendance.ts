/** Browser-local attendance marks per lead. No Core API. */

export const STAFF_ATTENDANCE_CHANGED_EVENT = "nodika:staff-attendance-changed";
export const STAFF_ATTENDANCE_STORAGE_KEY = "nodika.staffAttendance.v1";

export const ATTENDANCE_STATUSES = [
  "full_day",
  "half_day",
  "absent",
  "justified",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

/** leadId → reportId → ISO date (YYYY-MM-DD) → status */
export type AttendanceStore = {
  marks: Record<string, Record<string, Record<string, AttendanceStatus>>>;
};

export type AttendanceTally = {
  full_day: number;
  half_day: number;
  absent: number;
  justified: number;
};

export type AttendancePersonRef = {
  id: string;
  name: string;
};

const EMPTY_STORE: AttendanceStore = { marks: {} };

let memoryStore: AttendanceStore | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return (
    typeof value === "string" &&
    (ATTENDANCE_STATUSES as readonly string[]).includes(value)
  );
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function notifyStoreChanged() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(STAFF_ATTENDANCE_CHANGED_EVENT));
}

export function parseAttendanceStore(value: unknown): AttendanceStore {
  if (!isRecord(value) || !isRecord(value.marks)) {
    return { marks: {} };
  }
  const marks: AttendanceStore["marks"] = {};
  for (const [leadId, byReport] of Object.entries(value.marks)) {
    if (!leadId || !isRecord(byReport)) {
      continue;
    }
    const reportMap: Record<string, Record<string, AttendanceStatus>> = {};
    for (const [reportId, byDate] of Object.entries(byReport)) {
      if (!reportId || !isRecord(byDate)) {
        continue;
      }
      const dateMap: Record<string, AttendanceStatus> = {};
      for (const [date, status] of Object.entries(byDate)) {
        if (isIsoDate(date) && isAttendanceStatus(status)) {
          dateMap[date] = status;
        }
      }
      if (Object.keys(dateMap).length > 0) {
        reportMap[reportId] = dateMap;
      }
    }
    if (Object.keys(reportMap).length > 0) {
      marks[leadId] = reportMap;
    }
  }
  return { marks };
}

function readFromLocalStorage(): AttendanceStore {
  if (typeof window === "undefined") {
    return EMPTY_STORE;
  }
  try {
    const raw = window.localStorage.getItem(STAFF_ATTENDANCE_STORAGE_KEY);
    if (!raw) {
      return EMPTY_STORE;
    }
    return parseAttendanceStore(JSON.parse(raw) as unknown);
  } catch {
    return EMPTY_STORE;
  }
}

function writeStore(store: AttendanceStore): void {
  memoryStore = store;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        STAFF_ATTENDANCE_STORAGE_KEY,
        JSON.stringify(store),
      );
    } catch {
      // Ignore quota / private mode failures; keep memory cache.
    }
  }
  notifyStoreChanged();
}

export function readAttendanceStore(): AttendanceStore {
  if (memoryStore) {
    return memoryStore;
  }
  memoryStore = readFromLocalStorage();
  return memoryStore;
}

export function clearAttendanceStore(): void {
  memoryStore = { marks: {} };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STAFF_ATTENDANCE_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  notifyStoreChanged();
}

/** YYYY-MM */
export function currentYearMonth(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function daysInYearMonth(yearMonth: string): string[] {
  const match = /^(\d{4})-(\d{2})$/.exec(yearMonth);
  if (!match) {
    return [];
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || month < 1 || month > 12) {
    return [];
  }
  const lastDay = new Date(year, month, 0).getDate();
  const days: string[] = [];
  for (let day = 1; day <= lastDay; day += 1) {
    days.push(`${yearMonth}-${String(day).padStart(2, "0")}`);
  }
  return days;
}

export function getMark(
  leadId: string,
  reportId: string,
  date: string,
): AttendanceStatus | null {
  const status = readAttendanceStore().marks[leadId]?.[reportId]?.[date];
  return status ?? null;
}

export function setMark(
  leadId: string,
  reportId: string,
  date: string,
  status: AttendanceStatus | null,
): void {
  if (!leadId || !reportId || !isIsoDate(date)) {
    return;
  }
  const prev = readAttendanceStore();
  const marks: AttendanceStore["marks"] = { ...prev.marks };
  const leadMarks = { ...(marks[leadId] ?? {}) };
  const reportMarks = { ...(leadMarks[reportId] ?? {}) };

  if (status === null) {
    delete reportMarks[date];
  } else if (isAttendanceStatus(status)) {
    reportMarks[date] = status;
  } else {
    return;
  }

  if (Object.keys(reportMarks).length === 0) {
    delete leadMarks[reportId];
  } else {
    leadMarks[reportId] = reportMarks;
  }

  if (Object.keys(leadMarks).length === 0) {
    delete marks[leadId];
  } else {
    marks[leadId] = leadMarks;
  }

  writeStore({ marks });
}

export function emptyTally(): AttendanceTally {
  return { full_day: 0, half_day: 0, absent: 0, justified: 0 };
}

export function summarizeAttendance(
  leadId: string,
  yearMonth: string,
  reportIds: string[],
): AttendanceTally {
  const tally = emptyTally();
  const days = new Set(daysInYearMonth(yearMonth));
  const leadMarks = readAttendanceStore().marks[leadId] ?? {};
  for (const reportId of reportIds) {
    const byDate = leadMarks[reportId];
    if (!byDate) {
      continue;
    }
    for (const [date, status] of Object.entries(byDate)) {
      if (!days.has(date)) {
        continue;
      }
      tally[status] += 1;
    }
  }
  return tally;
}

export function filterPeopleByName<T extends { name: string }>(
  people: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return people;
  }
  return people.filter((person) => person.name.toLowerCase().includes(q));
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

/**
 * Export rows = union of current chart people and report ids with marks
 * in the month. Names come from chart when available.
 */
export function buildAttendanceCsv(input: {
  leadId: string;
  leadLabel: string;
  yearMonth: string;
  people: AttendancePersonRef[];
  removedLabel: string;
}): string {
  const days = daysInYearMonth(input.yearMonth);
  const leadMarks = readAttendanceStore().marks[input.leadId] ?? {};
  const byId = new Map(input.people.map((p) => [p.id, p.name]));
  const orphanIds = Object.keys(leadMarks).filter((id) => {
    if (byId.has(id)) {
      return false;
    }
    return Object.keys(leadMarks[id] ?? {}).some((date) => days.includes(date));
  });
  const rows: AttendancePersonRef[] = [
    ...input.people,
    ...orphanIds.map((id) => ({
      id,
      name: `${input.removedLabel} (${id})`,
    })),
  ];

  const header = [
    "leadId",
    "leadLabel",
    "reportId",
    "name",
    ...days,
    "full_day",
    "half_day",
    "absent",
    "justified",
  ];
  const lines = [header.map(csvEscape).join(",")];

  for (const person of rows) {
    const byDate = leadMarks[person.id] ?? {};
    const dayValues = days.map((date) => byDate[date] ?? "");
    const personTally = summarizeAttendance(input.leadId, input.yearMonth, [
      person.id,
    ]);
    lines.push(
      [
        input.leadId,
        input.leadLabel,
        person.id,
        person.name,
        ...dayValues,
        String(personTally.full_day),
        String(personTally.half_day),
        String(personTally.absent),
        String(personTally.justified),
      ]
        .map((cell) => csvEscape(String(cell)))
        .join(","),
    );
  }

  return lines.join("\n");
}

export function downloadTextFile(filename: string, contents: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function statusShortLabel(status: AttendanceStatus | null): string {
  switch (status) {
    case "full_day":
      return "P";
    case "half_day":
      return "M";
    case "absent":
      return "A";
    case "justified":
      return "J";
    default:
      return "";
  }
}
