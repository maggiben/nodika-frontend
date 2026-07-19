/** In-memory attendance cache loaded from / saved to Core via BFF. */

import { fetchAuthed } from "@/lib/session-client";

export const STAFF_ATTENDANCE_CHANGED_EVENT = "nodika:staff-attendance-changed";
/** Legacy browser key — cleared on hydrate; not source of truth. */
export const STAFF_ATTENDANCE_STORAGE_KEY = "nodika.staffAttendance.v1";

export const ATTENDANCE_STATUSES = [
  "full_day",
  "half_day",
  "absent",
  "justified",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type AttendanceMark = {
  reportId: string;
  date: string;
  status: AttendanceStatus;
};

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

function clearLegacyLocalStorage(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(STAFF_ATTENDANCE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function parseAttendanceMarksList(value: unknown): AttendanceMark[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const marks: AttendanceMark[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }
    const reportId =
      typeof item.reportId === "string" ? item.reportId.trim() : "";
    const date = typeof item.date === "string" ? item.date.trim() : "";
    if (!reportId || !isIsoDate(date) || !isAttendanceStatus(item.status)) {
      continue;
    }
    marks.push({ reportId, date, status: item.status });
  }
  return marks;
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

function writeMemoryStore(store: AttendanceStore): void {
  memoryStore = store;
  notifyStoreChanged();
}

export function readAttendanceStore(): AttendanceStore {
  if (memoryStore) {
    return memoryStore;
  }
  memoryStore = EMPTY_STORE;
  return memoryStore;
}

export function clearAttendanceStore(): void {
  memoryStore = { marks: {} };
  clearLegacyLocalStorage();
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

export function marksForLeadMonth(
  leadId: string,
  yearMonth: string,
): AttendanceMark[] {
  const days = new Set(daysInYearMonth(yearMonth));
  const leadMarks = readAttendanceStore().marks[leadId] ?? {};
  const list: AttendanceMark[] = [];
  for (const [reportId, byDate] of Object.entries(leadMarks)) {
    for (const [date, status] of Object.entries(byDate)) {
      if (days.has(date)) {
        list.push({ reportId, date, status });
      }
    }
  }
  return list;
}

/** Replace in-memory marks for one lead+month; keep other months/leads. */
export function hydrateAttendanceMonth(
  leadId: string,
  yearMonth: string,
  marks: AttendanceMark[],
): void {
  clearLegacyLocalStorage();
  const prev = readAttendanceStore();
  const nextLead: Record<string, Record<string, AttendanceStatus>> = {
    ...(prev.marks[leadId] ?? {}),
  };
  const days = daysInYearMonth(yearMonth);
  for (const day of days) {
    for (const reportId of Object.keys(nextLead)) {
      const byDate = { ...(nextLead[reportId] ?? {}) };
      delete byDate[day];
      if (Object.keys(byDate).length === 0) {
        delete nextLead[reportId];
      } else {
        nextLead[reportId] = byDate;
      }
    }
  }
  for (const mark of marks) {
    if (!mark.date.startsWith(`${yearMonth}-`)) {
      continue;
    }
    nextLead[mark.reportId] = {
      ...(nextLead[mark.reportId] ?? {}),
      [mark.date]: mark.status,
    };
  }
  const marksMap = { ...prev.marks };
  if (Object.keys(nextLead).length === 0) {
    delete marksMap[leadId];
  } else {
    marksMap[leadId] = nextLead;
  }
  writeMemoryStore({ marks: marksMap });
}

export function getMark(
  leadId: string,
  reportId: string,
  date: string,
): AttendanceStatus | null {
  const status = readAttendanceStore().marks[leadId]?.[reportId]?.[date];
  return status ?? null;
}

/** Update in-memory mark only. Call saveAttendanceMonthToCore to persist. */
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

  writeMemoryStore({ marks });
}

export type AttendanceSaveResult =
  { ok: true } | { ok: false; message: string; status?: number };

export async function loadAttendanceMonthFromCore(
  leadId: string,
  yearMonth: string,
): Promise<AttendanceSaveResult> {
  const id = leadId.trim();
  if (!id || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    return { ok: false, message: "Invalid attendance request." };
  }
  try {
    const response = await fetchAuthed(
      `/api/messaging/contacts/${encodeURIComponent(id)}/attendance?yearMonth=${encodeURIComponent(yearMonth)}`,
      { cache: "no-store" },
    );
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        isRecord(body) && typeof body.message === "string"
          ? body.message
          : `Load failed (${response.status}).`;
      return { ok: false, message, status: response.status };
    }
    const marks = parseAttendanceMarksList(
      isRecord(body) ? body.marks : undefined,
    );
    hydrateAttendanceMonth(id, yearMonth, marks);
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not reach the messaging service." };
  }
}

export async function saveAttendanceMonthToCore(
  leadId: string,
  yearMonth: string,
): Promise<AttendanceSaveResult> {
  const id = leadId.trim();
  if (!id || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    return { ok: false, message: "Invalid attendance request." };
  }
  const marks = marksForLeadMonth(id, yearMonth);
  try {
    const response = await fetchAuthed(
      `/api/messaging/contacts/${encodeURIComponent(id)}/attendance`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearMonth, marks }),
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
    const saved = parseAttendanceMarksList(
      isRecord(body) ? body.marks : undefined,
    );
    hydrateAttendanceMonth(id, yearMonth, saved);
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not reach the messaging service." };
  }
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
