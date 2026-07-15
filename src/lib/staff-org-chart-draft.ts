import type { Locale } from "@/i18n/config";
import {
  reportRoleLabel,
  type StaffOrgChart,
  type StaffReportRole,
} from "@/lib/staff-org-chart";

const ROLE_LABELS: Record<Locale, Record<StaffReportRole, string>> = {
  es: {
    operario: "operario",
    jornalero: "jornalero",
    otro: "otro",
  },
  en: {
    operario: "operator",
    jornalero: "day laborer",
    otro: "other",
  },
};

export function buildPerformanceDraft(input: {
  locale: Locale;
  leadName: string;
  chart: StaffOrgChart;
}): string | null {
  if (chartHasNoReports(input.chart)) {
    return null;
  }

  const lead = input.leadName.trim() || input.chart.contactLabel?.trim() || "";
  const roleLabels = ROLE_LABELS[input.locale];
  const lines = input.chart.reports.map((report, index) => {
    const role = reportRoleLabel(report, roleLabels);
    return `${index + 1}. ${report.name} (${role})`;
  });

  if (input.locale === "en") {
    return [
      `Hi ${lead || "there"},`,
      "",
      "Could you share a short performance update for each person on your team?",
      "",
      ...lines,
      "",
      "For each person: how did they do this week, any issues, and any help they need?",
      "Thanks.",
    ].join("\n");
  }

  return [
    `Hola ${lead || ""},`.trimEnd(),
    "",
    "¿Podrías contarme cómo fue la performance de cada persona de tu equipo?",
    "",
    ...lines,
    "",
    "Para cada uno: cómo les fue esta semana, si hubo problemas y si necesitan apoyo.",
    "Gracias.",
  ].join("\n");
}

export function chartHasNoReports(chart: StaffOrgChart): boolean {
  return chart.reports.length === 0;
}

const ATTENDANCE_CHOICES: Record<Locale, readonly string[]> = {
  es: ["Día completo", "Media jornada", "Faltó"],
  en: ["Full day", "Half day", "Absent"],
};

function attendanceChoiceLines(locale: Locale): string[] {
  return ATTENDANCE_CHOICES[locale].flatMap((choice) => [`   - [ ] ${choice}`]);
}

function formatAttendancePersonBlock(
  locale: Locale,
  index: number,
  name: string,
  roleSuffix?: string,
): string[] {
  const heading = roleSuffix
    ? `${index}. ${name} (${roleSuffix})`
    : `${index}. ${name}`;
  return [heading, ...attendanceChoiceLines(locale), ""];
}

export function buildAttendanceTitle(input: {
  locale: Locale;
  leadName?: string;
  dateLabel?: string;
}): string {
  const datePart =
    input.dateLabel?.trim() ||
    new Intl.DateTimeFormat(input.locale === "es" ? "es-AR" : "en-US", {
      dateStyle: "medium",
    }).format(new Date());
  const lead = input.leadName?.trim();
  if (input.locale === "en") {
    return lead
      ? `Team attendance — ${lead} — ${datePart}`
      : `Team attendance — ${datePart}`;
  }
  return lead
    ? `Asistencia del equipo — ${lead} — ${datePart}`
    : `Asistencia del equipo — ${datePart}`;
}

export function buildAttendanceDraft(input: {
  locale: Locale;
  leadName: string;
  chart: StaffOrgChart | null;
}): string {
  const lead = input.leadName.trim() || input.chart?.contactLabel?.trim() || "";
  const roleLabels = ROLE_LABELS[input.locale];
  const personBlocks: string[] = [];

  if (input.chart && !chartHasNoReports(input.chart)) {
    input.chart.reports.forEach((report, index) => {
      personBlocks.push(
        ...formatAttendancePersonBlock(
          input.locale,
          index + 1,
          report.name,
          reportRoleLabel(report, roleLabels),
        ),
      );
    });
  } else {
    const placeholders =
      input.locale === "en"
        ? ["Person 1", "Person 2", "Person 3"]
        : ["Persona 1", "Persona 2", "Persona 3"];
    placeholders.forEach((name, index) => {
      personBlocks.push(
        ...formatAttendancePersonBlock(input.locale, index + 1, name),
      );
    });
  }

  if (input.locale === "en") {
    return [
      `Hi ${lead || "there"},`,
      "",
      "Please report today’s attendance for each person on your team.",
      "Mark one option for each person: full day, half day, or absent.",
      "",
      ...personBlocks,
      "Reply with the chosen option for each name. Thanks.",
    ].join("\n");
  }

  return [
    `Hola ${lead || ""},`.trimEnd(),
    "",
    "Por favor reportá la asistencia de hoy de cada persona a cargo.",
    "Marcá una opción por persona: día completo, media jornada o faltó.",
    "",
    ...personBlocks,
    "Respondé indicando la opción de cada uno. Gracias.",
  ].join("\n");
}
