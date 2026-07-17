import type { EmailSchedule } from "@/lib/core-auth";
import { DEFAULT_TIMEZONE } from "@/lib/timezone-options";

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
};

const WEEKDAY_TO_JS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function readZonedParts(date: Date, timeZone: string): ZonedDateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: WEEKDAY_TO_JS[get("weekday")] ?? 0,
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = readZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - date.getTime();
}

function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  let resolved = new Date(
    Date.UTC(year, month - 1, day, hour, minute, 0) - offset,
  );
  const offsetAgain = getTimeZoneOffsetMs(resolved, timeZone);
  if (offsetAgain !== offset) {
    resolved = new Date(
      Date.UTC(year, month - 1, day, hour, minute, 0) - offsetAgain,
    );
  }
  return resolved;
}

function addCalendarDays(
  year: number,
  month: number,
  day: number,
  offset: number,
): { year: number; month: number; day: number } {
  const utc = new Date(Date.UTC(year, month - 1, day + offset));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

function startOfWeekMonday(
  parts: Pick<ZonedDateParts, "year" | "month" | "day" | "weekday">,
): { year: number; month: number; day: number } {
  const daysFromMonday = (parts.weekday + 6) % 7;
  return addCalendarDays(parts.year, parts.month, parts.day, -daysFromMonday);
}

/** Mirror of Core `computeNextSendDates` for live Staff preview. */
export function computeNextSendDates(
  schedule: EmailSchedule,
  count = 3,
  from = new Date(),
): string[] {
  if (!schedule.enabled) {
    return [];
  }

  const timeZone = schedule.timezone || DEFAULT_TIMEZONE;
  const nowParts = readZonedParts(from, timeZone);
  const weekStart = startOfWeekMonday(nowParts);
  const weekEnd = addCalendarDays(
    weekStart.year,
    weekStart.month,
    weekStart.day,
    7,
  );
  const weekStartUtc = zonedLocalToUtc(
    weekStart.year,
    weekStart.month,
    weekStart.day,
    0,
    0,
    timeZone,
  );
  const weekEndUtc = zonedLocalToUtc(
    weekEnd.year,
    weekEnd.month,
    weekEnd.day,
    0,
    0,
    timeZone,
  );

  const [hours, minutes] = schedule.sendTime.split(":").map(Number);
  const results: string[] = [];

  for (let offset = 0; offset < 400 && results.length < count; offset++) {
    const calendar = addCalendarDays(
      weekStart.year,
      weekStart.month,
      weekStart.day,
      offset,
    );
    const sendAt = zonedLocalToUtc(
      calendar.year,
      calendar.month,
      calendar.day,
      hours,
      minutes,
      timeZone,
    );
    const weekday = readZonedParts(sendAt, timeZone).weekday;

    const matches =
      schedule.frequency === "weekly"
        ? schedule.daysOfWeek.includes(weekday)
        : calendar.day === schedule.dayOfMonth;

    if (!matches) {
      continue;
    }

    const inCurrentWeek =
      sendAt.getTime() >= weekStartUtc.getTime() &&
      sendAt.getTime() < weekEndUtc.getTime();

    if (sendAt > from || inCurrentWeek) {
      results.push(sendAt.toISOString());
    }
  }

  return results;
}
