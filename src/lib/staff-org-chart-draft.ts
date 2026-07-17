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
    personBlocks.push(
      ...(input.locale === "en"
        ? [
            "(No people on this lead’s org chart yet. Add them under Org chart, then re-apply the template.)",
            "",
          ]
        : [
            "(Todavía no hay personas en el organigrama de este jefe. Agregalas en Organigrama y volvé a aplicar la plantilla.)",
            "",
          ]),
    );
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

export function buildWorkProgressTitle(input: {
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
      ? `Workday progress — ${lead} — ${datePart}`
      : `Workday progress — ${datePart}`;
  }
  return lead
    ? `Avance de jornada — ${lead} — ${datePart}`
    : `Avance de jornada — ${datePart}`;
}

export function buildWorkProgressDraft(input: {
  locale: Locale;
  leadName: string;
  chart: StaffOrgChart | null;
}): string {
  const lead = input.leadName.trim() || input.chart?.contactLabel?.trim() || "";
  const roleLabels = ROLE_LABELS[input.locale];
  const people: string[] = [];

  if (input.chart && !chartHasNoReports(input.chart)) {
    input.chart.reports.forEach((report, index) => {
      const role = reportRoleLabel(report, roleLabels);
      people.push(`${index + 1}. ${report.name} (${role})`);
    });
  } else {
    people.push(
      input.locale === "en"
        ? "(No people on this lead’s org chart yet. Add them under Org chart, then re-apply the template.)"
        : "(Todavía no hay personas en el organigrama de este jefe. Agregalas en Organigrama y volvé a aplicar la plantilla.)",
    );
  }

  if (input.locale === "en") {
    return [
      `Hi ${lead || "there"},`,
      "",
      "Please send today’s workday progress for the site.",
      "Reply with:",
      "- Work time / hours worked",
      "- Percent complete",
      "- Duration",
      "- Progress summary (avance)",
      "- Notes",
      "",
      "Team:",
      ...people,
      "",
      "Thanks.",
    ].join("\n");
  }

  return [
    `Hola ${lead || ""},`.trimEnd(),
    "",
    "Por favor reportá el avance de la jornada en obra.",
    "Respondé con:",
    "- Tiempo de trabajo / horas",
    "- Porcentaje cumplido",
    "- Duración",
    "- Avance",
    "- Notas",
    "",
    "Equipo a cargo:",
    ...people,
    "",
    "Gracias.",
  ].join("\n");
}

function buildPerformanceTitle(input: {
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
      ? `Team performance — ${lead} — ${datePart}`
      : `Team performance — ${datePart}`;
  }
  return lead
    ? `Performance del equipo — ${lead} — ${datePart}`
    : `Performance del equipo — ${datePart}`;
}

function buildPerformanceDraftOrPlaceholder(input: {
  locale: Locale;
  leadName: string;
  chart: StaffOrgChart | null;
}): string {
  if (input.chart && !chartHasNoReports(input.chart)) {
    return (
      buildPerformanceDraft({
        locale: input.locale,
        leadName: input.leadName,
        chart: input.chart,
      }) ?? ""
    );
  }

  const lead = input.leadName.trim() || input.chart?.contactLabel?.trim() || "";

  if (input.locale === "en") {
    return [
      `Hi ${lead || "there"},`,
      "",
      "Could you share a short performance update for each person on your team?",
      "",
      "(No people on this lead’s org chart yet. Add them under Org chart, then re-apply the template.)",
      "",
      "For each person: how did they do this workday, any issues, and any help they need?",
      "Thanks.",
    ].join("\n");
  }

  return [
    `Hola ${lead || ""},`.trimEnd(),
    "",
    "¿Podrías contarme cómo fue la performance de cada persona de tu equipo en la jornada?",
    "",
    "(Todavía no hay personas en el organigrama de este jefe. Agregalas en Organigrama y volvé a aplicar la plantilla.)",
    "",
    "Para cada uno: cómo les fue, si hubo problemas y si necesitan apoyo.",
    "Gracias.",
  ].join("\n");
}

export const ADELANTO_CATALOG_TAG = "adelanto";

export const CATALOG_MESSAGE_PRESET_IDS = [
  "attendance",
  "performance",
  "workProgress",
  "adelanto",
] as const;

export type CatalogMessagePresetId =
  (typeof CATALOG_MESSAGE_PRESET_IDS)[number];

export function buildAdelantoTitle(input: {
  locale: Locale;
  leadName?: string;
}): string {
  const lead = input.leadName?.trim();
  if (input.locale === "en") {
    return lead
      ? `Ahead-of-schedule work — ${lead}`
      : "Ahead-of-schedule work";
  }
  return lead ? `Adelanto de obra — ${lead}` : "Adelanto de obra";
}

export function buildAdelantoDraft(input: {
  locale: Locale;
  leadName: string;
}): string {
  const lead = input.leadName.trim();
  if (input.locale === "en") {
    return [
      `Hi ${lead || "there"},`,
      "",
      "Besides the tasks planned for this period, were you working on any other task ahead of schedule?",
      "Which one?",
      "How much did you advance, or how much work was done?",
      "",
      "Please reply with the task name and approximate % or amount of work. Thanks.",
    ].join("\n");
  }
  return [
    `Hola ${lead || ""},`.trimEnd(),
    "",
    "Además de las tareas de este período, ¿estuvieron trabajando en alguna otra tarea de forma adelantada?",
    "¿Cuál?",
    "¿Cuánto se adelantó o cuánto se trabajó?",
    "",
    "Respondé con el nombre de la tarea y el % o avance aproximado. Gracias.",
  ].join("\n");
}

export function applyCatalogMessagePreset(input: {
  presetId: CatalogMessagePresetId;
  locale: Locale;
  leadName: string;
  chart: StaffOrgChart | null;
}): { title: string; body: string; usedOrgChart: boolean; tags: string[] } {
  const usedOrgChart = Boolean(input.chart && !chartHasNoReports(input.chart));

  switch (input.presetId) {
    case "attendance":
      return {
        title: buildAttendanceTitle({
          locale: input.locale,
          leadName: input.leadName,
        }),
        body: buildAttendanceDraft({
          locale: input.locale,
          leadName: input.leadName,
          chart: input.chart,
        }),
        usedOrgChart,
        tags: [],
      };
    case "performance":
      return {
        title: buildPerformanceTitle({
          locale: input.locale,
          leadName: input.leadName,
        }),
        body: buildPerformanceDraftOrPlaceholder({
          locale: input.locale,
          leadName: input.leadName,
          chart: input.chart,
        }),
        usedOrgChart,
        tags: [],
      };
    case "workProgress":
      return {
        title: buildWorkProgressTitle({
          locale: input.locale,
          leadName: input.leadName,
        }),
        body: buildWorkProgressDraft({
          locale: input.locale,
          leadName: input.leadName,
          chart: input.chart,
        }),
        usedOrgChart,
        tags: [],
      };
    case "adelanto":
      return {
        title: buildAdelantoTitle({
          locale: input.locale,
          leadName: input.leadName,
        }),
        body: buildAdelantoDraft({
          locale: input.locale,
          leadName: input.leadName,
        }),
        usedOrgChart: false,
        tags: [ADELANTO_CATALOG_TAG],
      };
  }
}
