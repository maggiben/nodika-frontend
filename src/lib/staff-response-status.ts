export type StaffResponseStatus =
  "green" | "yellow" | "red" | "neutral" | "pending";

/** Reply within this many days → green. */
export const STAFF_YELLOW_AFTER_DAYS = 1;

/** Reply within this many days (after green) → yellow; beyond → red (≥3 days). */
export const STAFF_RED_AFTER_DAYS = 2;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Deduce traffic light from persisted sent/replied timestamps.
 * - green: ≤ 1 day
 * - yellow: ≤ 2 days
 * - red: ≥ 3 days (or > 2 days silent)
 */
export function computeStaffResponseStatus(
  lastSentAt: string | null | undefined,
  lastReceivedAt: string | null | undefined,
  now: Date = new Date(),
): StaffResponseStatus {
  if (!lastSentAt) {
    return "neutral";
  }

  const sent = Date.parse(lastSentAt);
  if (Number.isNaN(sent)) {
    return "neutral";
  }

  const received = lastReceivedAt ? Date.parse(lastReceivedAt) : Number.NaN;
  if (!Number.isNaN(received) && received >= sent) {
    const replyLagDays = (received - sent) / MS_PER_DAY;
    if (replyLagDays <= STAFF_YELLOW_AFTER_DAYS) {
      return "green";
    }
    if (replyLagDays <= STAFF_RED_AFTER_DAYS) {
      return "yellow";
    }
    return "red";
  }

  const silentDays = (now.getTime() - sent) / MS_PER_DAY;
  if (silentDays <= STAFF_YELLOW_AFTER_DAYS) {
    return "green";
  }
  if (silentDays <= STAFF_RED_AFTER_DAYS) {
    return "yellow";
  }
  return "red";
}

/** Prefer stored latency ms from persisted StaffMessage when available. */
export function statusFromPersistedLatencyMs(
  latencyMs: number | null | undefined,
): StaffResponseStatus {
  if (latencyMs === null || latencyMs === undefined || latencyMs < 0) {
    return "pending";
  }
  const days = latencyMs / MS_PER_DAY;
  if (days <= STAFF_YELLOW_AFTER_DAYS) {
    return "green";
  }
  if (days <= STAFF_RED_AFTER_DAYS) {
    return "yellow";
  }
  return "red";
}

export function formatStaffTimestamp(
  iso: string | null | undefined,
  locale: string,
): string {
  if (!iso) {
    return "—";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
